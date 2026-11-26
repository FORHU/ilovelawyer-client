import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HANDOFF_EARLY_SECONDS, LONG_ENOUGH, tickAction } from "../live-dictation";

// The recorder against a fake socket and a fake audio stack: what it sends to the API, and what
// the screen is told, as a recording moves from one stream to the next.

type Handler = (payload?: unknown) => void;

class FakeSocket {
  connected = true;
  handlers = new Map<string, Handler>();
  emitted: [string, unknown][] = [];
  acks: unknown[] = [];
  on(event: string, fn: Handler) {
    this.handlers.set(event, fn);
    return this;
  }
  off(event: string) {
    this.handlers.delete(event);
    return this;
  }
  emit(event: string, payload?: unknown) {
    this.emitted.push([event, payload]);
    return this;
  }
  timeout() {
    return {
      emitWithAck: (event: string, payload: unknown) => {
        this.emitted.push([event, payload]);
        return Promise.resolve(this.acks.shift());
      },
    };
  }
  fire(event: string, payload?: unknown) {
    this.handlers.get(event)?.(payload);
  }
  /** The API events sent, without the audio. */
  calls() {
    return this.emitted.map(([event]) => event).filter((e) => e !== "dictation:audio");
  }
  audioCount() {
    return this.emitted.filter(([event]) => event === "dictation:audio").length;
  }
}

let socket: FakeSocket;
vi.mock("@/lib/socket", () => ({ getAppSocket: () => socket }));

let node: { port: { onmessage: ((e: { data: Float32Array }) => void) | null }; connect: () => void; disconnect: () => void };

class FakeContext {
  state = "running";
  sampleRate = 16_000;
  audioWorklet = { addModule: async () => {} };
  destination = {};
  resume = async () => {};
  close = async () => {
    this.state = "closed";
  };
  createMediaStreamSource() {
    return { connect() {} };
  }
  createGain() {
    return { gain: { value: 1 }, connect() {} };
  }
}

class FakeWorkletNode {
  port = { onmessage: null as ((e: { data: Float32Array }) => void) | null };
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    node = this;
  }
  connect() {}
  disconnect() {}
}

const ok = (maxSeconds: number) => ({ ok: true, languageCode: "en-GB", sampleRate: 16_000, maxSeconds });

function makeUi() {
  const ui = {
    phase: "idle",
    seconds: 0,
    transcript: "",
    error: "",
    texts: [] as string[],
    setPhase: (p: string) => void (ui.phase = p),
    setSeconds: (s: number) => void (ui.seconds = s),
    setTranscript: (t: string) => void (ui.transcript = t),
    setError: (e: string) => void (ui.error = e),
    onText: (t: string) => void ui.texts.push(t),
    alive: () => true,
  };
  return ui;
}

const flush = () => vi.advanceTimersByTimeAsync(0);
const speak = () => node.port.onmessage?.({ data: new Float32Array(1600) });

async function recording(chainUpTo: number | undefined, maxSeconds: number) {
  const { createRecorder } = await import("../use-live-dictation");
  const ui = makeUi();
  socket.acks.push(ok(maxSeconds));
  const recorder = createRecorder(ui as never, { chainUpTo });
  recorder.start();
  await flush();
  expect(ui.phase).toBe("recording");
  return { ui, recorder };
}

beforeEach(() => {
  vi.useFakeTimers();
  socket = new FakeSocket();
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("AudioWorkletNode", FakeWorkletNode);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:tap");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tickAction", () => {
  it("stops at the API's limit when not chained, as a composer's recording does", () => {
    expect(tickAction({ seconds: 179, streamSeconds: 179, maxSeconds: 180, handingOff: false })).toBe("continue");
    expect(tickAction({ seconds: 180, streamSeconds: 180, maxSeconds: 180, handingOff: false })).toBe("stop");
  });

  it("hands off a little before the API's limit, once, when chained", () => {
    const at = 180 - HANDOFF_EARLY_SECONDS;
    expect(tickAction({ seconds: at - 1, streamSeconds: at - 1, maxSeconds: 180, chainUpTo: 600, handingOff: false })).toBe("continue");
    expect(tickAction({ seconds: at, streamSeconds: at, maxSeconds: 180, chainUpTo: 600, handingOff: false })).toBe("handoff");
    expect(tickAction({ seconds: at + 1, streamSeconds: at + 1, maxSeconds: 180, chainUpTo: 600, handingOff: true })).toBe("continue");
  });

  it("stops at the overall limit, whatever the stream", () => {
    expect(tickAction({ seconds: 600, streamSeconds: 70, maxSeconds: 180, chainUpTo: 600, handingOff: false })).toBe("limit");
  });
});

describe("a chained recording", () => {
  it("moves to a new stream before the limit, keeps every word, and holds the audio in between", async () => {
    const { ui, recorder } = await recording(60, 10);

    speak();
    socket.fire("dictation:final", { text: "My manager let me go." });
    await vi.advanceTimersByTimeAsync((10 - HANDOFF_EARLY_SECONDS) * 1000);
    expect(socket.calls()).toEqual(["dictation:start", "dictation:stop"]);

    // Between streams: the microphone's audio waits.
    const sentBefore = socket.audioCount();
    speak();
    speak();
    expect(socket.audioCount()).toBe(sentBefore);

    socket.acks.push(ok(10));
    socket.fire("dictation:end", { text: "My manager let me go." });
    await flush();
    expect(socket.calls()).toEqual(["dictation:start", "dictation:stop", "dictation:start"]);
    // The held audio went to the new stream, and the screen never saw the recording stop.
    expect(socket.audioCount()).toBe(sentBefore + 2);
    expect(ui.phase).toBe("recording");

    socket.fire("dictation:final", { text: "They owe me two months' pay." });
    expect(ui.transcript).toBe("My manager let me go. They owe me two months' pay.");
    expect(ui.seconds).toBe(10 - HANDOFF_EARLY_SECONDS);

    recorder.stop();
    socket.fire("dictation:end", { text: "They owe me two months' pay." });
    expect(ui.texts).toEqual(["My manager let me go. They owe me two months' pay."]);
    expect(ui.error).toBe("");
    expect(ui.phase).toBe("idle");
  });

  it("stops at the overall limit and says why, keeping what was heard", async () => {
    const { ui } = await recording(8, 180);
    await vi.advanceTimersByTimeAsync(8000);
    expect(socket.calls()).toEqual(["dictation:start", "dictation:stop"]);
    socket.fire("dictation:end", { text: "All of it." });
    expect(ui.texts).toEqual(["All of it."]);
    expect(ui.error).toBe(LONG_ENOUGH);
  });

  it("ends with the words so far when the next stream is refused", async () => {
    const { ui } = await recording(60, 10);
    await vi.advanceTimersByTimeAsync((10 - HANDOFF_EARLY_SECONDS) * 1000);
    socket.acks.push({ ok: false, message: "You've used voice input a lot just now.", code: "DICTATION_RATE_LIMITED" });
    socket.fire("dictation:end", { text: "The first part." });
    await flush();
    expect(ui.texts).toEqual(["The first part."]);
    expect(ui.error).toBe("You've used voice input a lot just now.");
    expect(ui.phase).toBe("idle");
  });

  it("stopped between streams, still sends the audio that waited, then ends", async () => {
    const { ui, recorder } = await recording(60, 10);
    await vi.advanceTimersByTimeAsync((10 - HANDOFF_EARLY_SECONDS) * 1000);
    speak();
    recorder.stop();
    // No stream open to stop yet.
    expect(socket.calls()).toEqual(["dictation:start", "dictation:stop"]);

    socket.acks.push(ok(10));
    socket.fire("dictation:end", { text: "First." });
    await flush();
    expect(socket.calls()).toEqual(["dictation:start", "dictation:stop", "dictation:start", "dictation:stop"]);
    socket.fire("dictation:end", { text: "Last words." });
    expect(ui.texts).toEqual(["First. Last words."]);
  });

  it("isn't chained in a composer: it stops at the API's limit", async () => {
    const { ui } = await recording(undefined, 10);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(socket.calls()).toEqual(["dictation:start", "dictation:stop"]);
    expect(ui.phase).toBe("finishing");
    socket.fire("dictation:end", { text: "Short one." });
    expect(ui.texts).toEqual(["Short one."]);
    expect(ui.error).toBe("");
  });
});
