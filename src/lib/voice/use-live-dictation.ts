"use client";

import { useEffect, useRef, useState } from "react";
import { getAppSocket } from "@/lib/socket";
import { currentLang } from "@/lib/i18n/translate";
import { LIVE_SAMPLE_RATE, PcmDownsampler } from "./pcm";
import {
  CONNECTION_LOST,
  FAILED,
  LONG_ENOUGH,
  MIC_OFF,
  NOTHING_HEARD,
  OFFLINE,
  UNSUPPORTED,
  appendSpoken,
  liveTranscript,
  refusalMessage,
  tickAction,
  type LiveStartAck,
} from "./live-dictation";

export type LiveDictationPhase = "idle" | "starting" | "recording" | "finishing";

const START_TIMEOUT_MS = 10_000;
/** After stop, the last words normally arrive in well under a second. */
const FINISH_TIMEOUT_MS = 10_000;
const FALLBACK_MAX_SECONDS = 180;

/** Runs in the audio thread: collects the microphone's samples and hands them over every 100 ms.
 * Loaded from a blob, so it needs no file of its own. `sampleRate` is the audio thread's global. */
const TAP_WORKLET = `
class DictationTap extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = Math.round(sampleRate / 10);
    this.buffer = new Float32Array(this.size);
    this.filled = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.filled++] = channel[i];
        if (this.filled === this.size) {
          this.port.postMessage(this.buffer, [this.buffer.buffer]);
          this.buffer = new Float32Array(this.size);
          this.filled = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("dictation-tap", DictationTap);
`;

export interface Ui {
  setPhase: (phase: LiveDictationPhase) => void;
  setSeconds: (seconds: number) => void;
  setTranscript: (text: string) => void;
  setError: (message: string) => void;
  onText: (text: string) => void;
  alive: () => boolean;
}

/** One recording, from the tap to the text. */
interface Run {
  context: AudioContext;
  stream: MediaStream | null;
  node: AudioWorkletNode | null;
  timer: ReturnType<typeof setInterval> | null;
  finishTimer: ReturnType<typeof setTimeout> | null;
  detach: () => void;
  finals: string[];
  partial: string;
  /** In all, as the person sees it. */
  seconds: number;
  /** On the stream that's open now: a chained recording moves to a new one before the API's limit. */
  streamSeconds: number;
  /** The API's per-stream limit, from its start answer. */
  maxSeconds: number;
  /** Words from this recording's earlier streams. */
  earlier: string;
  /** Between streams: the last one was asked to stop and the next isn't open yet. The microphone
   * keeps going, and its audio waits in `held` until the next stream opens. */
  handingOff: boolean;
  held: ArrayBuffer[];
  /** The person (or the overall limit) stopped it: no further stream is opened. */
  stopped: boolean;
  /** It stopped at the overall limit, which the person is told. */
  reachedLimit: boolean;
  /** The API has a stream open for it, so a cancel has to tell the API. */
  serverOpen: boolean;
  /** Audio is going out. */
  sending: boolean;
  done: boolean;
}

/** All the words of a recording so far: its earlier streams', then this stream's. */
function heard(run: Run): string {
  return appendSpoken(run.earlier, liveTranscript(run.finals, run.partial)).trim();
}

/** `chainUpTo`: carry on past the API's per-stream limit, on new streams, up to this many seconds in
 * all (see tickAction). The microphone stays open throughout, which matters on Safari, where audio
 * can only start inside a tap. Exported for its test (__tests__/chained-dictation.test.ts). */
export function createRecorder(ui: Ui, { chainUpTo }: { chainUpTo?: number } = {}) {
  let current: Run | null = null;

  /** Lets go of the microphone and the audio graph; the socket listeners stay for the last words. */
  const releaseAudio = (run: Run) => {
    run.sending = false;
    if (run.timer) clearInterval(run.timer);
    run.timer = null;
    run.stream?.getTracks().forEach((track) => track.stop());
    if (run.node) {
      run.node.port.onmessage = null;
      run.node.disconnect();
    }
    if (run.context.state !== "closed") void run.context.close().catch(() => {});
  };

  const release = (run: Run) => {
    releaseAudio(run);
    if (run.finishTimer) clearTimeout(run.finishTimer);
    run.finishTimer = null;
    run.detach();
  };

  /** Ends a recording with nothing handed over: a refused start, a cancel, an unmount. */
  const abandon = (run: Run) => {
    run.done = true;
    release(run);
    if (current === run) current = null;
    if (!ui.alive()) return;
    ui.setPhase("idle");
    ui.setTranscript("");
  };

  /** Ends a recording and hands over what was heard: on the API's end, an error, a dropped
   * connection or a stop the API never answered. Words already heard are never thrown away. */
  const finish = (run: Run, { text, error }: { text?: string; error?: string }) => {
    if (run.done) return;
    run.done = true;
    release(run);
    if (current === run) current = null;
    if (!ui.alive()) return;
    const last = text?.trim() || liveTranscript(run.finals, run.partial);
    const words = appendSpoken(run.earlier, last).trim();
    ui.setPhase("idle");
    ui.setTranscript("");
    if (words) ui.onText(words);
    if (error) ui.setError(error);
    else if (!words) ui.setError(NOTHING_HEARD);
    else if (run.reachedLimit) ui.setError(LONG_ENOUGH);
  };

  const stopRun = (run: Run) => {
    if (run.done || !run.sending) return;
    run.stopped = true;
    releaseAudio(run);
    // Between streams there may be none open to stop: the next one is stopped as soon as it opens
    // and has had the audio that waited for it (nextStream).
    if (!run.handingOff) getAppSocket().emit("dictation:stop");
    ui.setPhase("finishing");
    if (run.finishTimer) clearTimeout(run.finishTimer);
    run.finishTimer = setTimeout(() => finish(run, {}), FINISH_TIMEOUT_MS);
  };

  /** Near the API's per-stream limit: ask this stream to finish. Its last words come with
   * dictation:end, and nextStream opens the next one; meanwhile the audio is held. */
  const handOff = (run: Run) => {
    run.handingOff = true;
    getAppSocket().emit("dictation:stop");
    run.finishTimer = setTimeout(() => finish(run, { error: FAILED }), FINISH_TIMEOUT_MS);
  };

  /** The previous stream has ended with `text`: keep its words and open the next stream, then send
   * it the audio that waited. A refusal ends the recording, keeping every word heard so far. */
  async function nextStream(run: Run, text: string | undefined) {
    if (run.finishTimer) clearTimeout(run.finishTimer);
    run.finishTimer = null;
    run.earlier = appendSpoken(run.earlier, text?.trim() || liveTranscript(run.finals, run.partial));
    run.finals = [];
    run.partial = "";
    run.serverOpen = false;

    const socket = getAppSocket();
    let ack: LiveStartAck;
    try {
      ack = await socket.timeout(START_TIMEOUT_MS).emitWithAck("dictation:start", { sampleRate: LIVE_SAMPLE_RATE, language: currentLang() });
    } catch {
      return finish(run, { error: FAILED });
    }
    if (run.done) {
      if (ack?.ok) socket.emit("dictation:cancel");
      return;
    }
    if (!ack?.ok) return finish(run, { error: refusalMessage(ack) });

    run.serverOpen = true;
    run.maxSeconds = ack.maxSeconds || run.maxSeconds;
    run.handingOff = false;
    // The held audio counts toward the new stream's limit.
    let heldBytes = 0;
    for (const chunk of run.held.splice(0)) {
      heldBytes += chunk.byteLength;
      socket.emit("dictation:audio", chunk);
    }
    run.streamSeconds = Math.ceil(heldBytes / (LIVE_SAMPLE_RATE * 2));
    // Stopped while waiting for this stream: it has had the last of the audio, so it ends now.
    if (run.stopped) socket.emit("dictation:stop");
  }

  async function start() {
    if (current) return;
    ui.setError("");
    if (typeof AudioWorkletNode === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      ui.setError(UNSUPPORTED);
      return;
    }
    const socket = getAppSocket();
    if (!socket.connected) {
      ui.setError(OFFLINE);
      return;
    }

    // Made at the tap, before anything is awaited: Safari only lets audio start inside the tap.
    let context: AudioContext;
    try {
      context = new AudioContext();
    } catch {
      ui.setError(UNSUPPORTED);
      return;
    }
    const run: Run = {
      context,
      stream: null,
      node: null,
      timer: null,
      finishTimer: null,
      detach: () => {},
      finals: [],
      partial: "",
      seconds: 0,
      streamSeconds: 0,
      maxSeconds: FALLBACK_MAX_SECONDS,
      earlier: "",
      handingOff: false,
      held: [],
      stopped: false,
      reachedLimit: false,
      serverOpen: false,
      sending: false,
      done: false,
    };
    current = run;
    ui.setSeconds(0);
    ui.setTranscript("");
    ui.setPhase("starting");

    // The microphone first: a person who says no never opens a (billed) stream.
    try {
      run.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      if (run.done) return;
      abandon(run);
      ui.setError(MIC_OFF);
      return;
    }
    if (run.done) return release(run);

    let downsampler: PcmDownsampler;
    try {
      const url = URL.createObjectURL(new Blob([TAP_WORKLET], { type: "application/javascript" }));
      try {
        await context.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      await context.resume();
      downsampler = new PcmDownsampler(context.sampleRate, LIVE_SAMPLE_RATE);
    } catch {
      if (run.done) return;
      abandon(run);
      ui.setError(UNSUPPORTED);
      return;
    }
    if (run.done) return release(run);

    const onPartial = (payload: { text?: string }) => {
      if (run.done) return;
      run.partial = payload?.text ?? "";
      ui.setTranscript(heard(run));
    };
    const onFinal = (payload: { text?: string }) => {
      if (run.done) return;
      if (payload?.text) run.finals.push(payload.text);
      run.partial = "";
      ui.setTranscript(heard(run));
    };
    // A stream that ends while handing off is followed by the next, which also takes any audio that
    // waited for it when the person stopped meanwhile (then ends at once). Otherwise it's over.
    const onEnd = (payload: { text?: string }) => {
      if (run.done) return;
      if (run.handingOff && (!run.stopped || run.held.length > 0)) void nextStream(run, payload?.text);
      else finish(run, { text: payload?.text });
    };
    const onError = (payload: { message?: string }) => finish(run, { error: payload?.message || FAILED });
    const onDisconnect = () => finish(run, { error: CONNECTION_LOST });
    socket.on("dictation:partial", onPartial);
    socket.on("dictation:final", onFinal);
    socket.on("dictation:end", onEnd);
    socket.on("dictation:error", onError);
    socket.on("disconnect", onDisconnect);
    run.detach = () => {
      socket.off("dictation:partial", onPartial);
      socket.off("dictation:final", onFinal);
      socket.off("dictation:end", onEnd);
      socket.off("dictation:error", onError);
      socket.off("disconnect", onDisconnect);
    };

    let ack: LiveStartAck;
    try {
      ack = await socket.timeout(START_TIMEOUT_MS).emitWithAck("dictation:start", { sampleRate: LIVE_SAMPLE_RATE, language: currentLang() });
    } catch {
      if (run.done) return;
      abandon(run);
      ui.setError(FAILED);
      return;
    }
    if (run.done) {
      // Cancelled while the API was opening it.
      if (ack?.ok) socket.emit("dictation:cancel");
      return;
    }
    if (!ack?.ok) {
      abandon(run);
      ui.setError(refusalMessage(ack));
      return;
    }
    run.serverOpen = true;

    const source = context.createMediaStreamSource(run.stream);
    const node = new AudioWorkletNode(context, "dictation-tap");
    // The tap has to reach the speakers to be run at all, so it goes through a silent gain.
    const silent = context.createGain();
    silent.gain.value = 0;
    source.connect(node);
    node.connect(silent);
    silent.connect(context.destination);
    run.node = node;
    node.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (!run.sending) return;
      const pcm = downsampler.push(event.data);
      if (!pcm.length) return;
      if (run.handingOff) run.held.push(pcm.buffer as ArrayBuffer);
      else socket.emit("dictation:audio", pcm.buffer);
    };
    run.sending = true;
    ui.setPhase("recording");

    run.maxSeconds = ack.maxSeconds || FALLBACK_MAX_SECONDS;
    run.timer = setInterval(() => {
      run.seconds += 1;
      run.streamSeconds += 1;
      ui.setSeconds(run.seconds);
      const action = tickAction({ seconds: run.seconds, streamSeconds: run.streamSeconds, maxSeconds: run.maxSeconds, chainUpTo, handingOff: run.handingOff });
      if (action === "stop") stopRun(run);
      else if (action === "limit") {
        run.reachedLimit = true;
        stopRun(run);
      } else if (action === "handoff") handOff(run);
    }, 1000);
  }

  return {
    start: () => void start(),
    /** No more audio; the words heard so far go to `onText` once the last of them arrive. */
    stop: () => {
      if (current) stopRun(current);
    },
    /** Drops the recording: nothing goes to `onText`. */
    cancel: () => {
      const run = current;
      if (!run) return;
      if (run.serverOpen) getAppSocket().emit("dictation:cancel");
      abandon(run);
    },
  };
}

/**
 * Speaking instead of typing, with the words appearing while the person talks. The microphone is
 * asked for only when `start` is called, from a tap. `transcript` is what has been heard so far, to
 * show while recording; once stopped, `onText` gets the whole of it for the caller to put in the
 * composer, where it can be edited before sending. Stops by itself at the API's time limit (180 s),
 * or, with `chainUpTo`, carries on past it on new streams, as one recording, up to that many seconds.
 */
export function useLiveDictation({ onText, chainUpTo }: { onText: (text: string) => void; chainUpTo?: number }) {
  const [phase, setPhase] = useState<LiveDictationPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  // Made once mounted, and dropped (with any recording) on unmount.
  const recorder = useRef<ReturnType<typeof createRecorder> | null>(null);
  useEffect(() => {
    let alive = true;
    const made = createRecorder(
      {
        setPhase,
        setSeconds,
        setTranscript,
        setError,
        onText: (text) => onTextRef.current(text),
        alive: () => alive,
      },
      { chainUpTo },
    );
    recorder.current = made;
    return () => {
      alive = false;
      made.cancel();
      if (recorder.current === made) recorder.current = null;
    };
    // The limit is the caller's for the life of the screen: read once, when the recorder is made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    seconds,
    transcript,
    error,
    clearError: () => setError(""),
    start: () => recorder.current?.start(),
    stop: () => recorder.current?.stop(),
    cancel: () => recorder.current?.cancel(),
  };
}
