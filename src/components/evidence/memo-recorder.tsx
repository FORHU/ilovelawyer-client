"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/site/language-provider";
import { MIC_OFF, UNSUPPORTED, clock, levelOf } from "@/lib/voice/live-dictation";
import { Waveform } from "@/components/voice/waveform";
import { memoFormat, memoName } from "@/lib/cases/evidence";

/** A voice memo stops by itself after this long. */
const MEMO_MAX_SECONDS = 5 * 60;
/** How often the waveform reads the microphone, and how many readings it shows. */
const LEVEL_MS = 100;
const LEVELS = 32;

type Phase = "idle" | "starting" | "recording" | "recorded";

/**
 * Records a voice memo in the browser (MediaRecorder) for the evidence step: "anything you remember:
 * a conversation, a phone call, what someone said". The client hears it back before adding it to the
 * case, where it's transcribed like any recording. The microphone is asked for only on Start.
 */
export function MemoRecorder({ onAdd, onClose, adding }: { onAdd: (file: File) => void; onClose: () => void; adding: boolean }) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [memo, setMemo] = useState<{ file: File; url: string } | null>(null);
  const [levels, setLevels] = useState<number[]>([]);
  const meter = useRef<{ context: AudioContext; timer: ReturnType<typeof setInterval> } | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const release = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (meter.current) {
      clearInterval(meter.current.timer);
      void meter.current.context.close().catch(() => {});
      meter.current = null;
    }
  };

  /** Reads the recording's level for the waveform. Only a picture: the memo records without it. */
  const startMeter = (source: MediaStream) => {
    try {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaStreamSource(source).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        setLevels((prev) => [...prev.slice(-(LEVELS - 1)), levelOf(samples)]);
      }, LEVEL_MS);
      meter.current = { context, timer };
    } catch {
      // No waveform: the timer still shows it's recording.
    }
  };

  // Nothing keeps the microphone on, or a recording's URL alive, once the recorder closes.
  useEffect(
    () => () => {
      if (recorder.current && recorder.current.state !== "inactive") {
        recorder.current.ondataavailable = null;
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      release();
    },
    [],
  );
  useEffect(() => () => void (memo && URL.revokeObjectURL(memo.url)), [memo]);

  async function start() {
    setError("");
    const format = typeof MediaRecorder === "undefined" ? null : memoFormat((type) => MediaRecorder.isTypeSupported(type));
    if (!format || !navigator.mediaDevices?.getUserMedia) {
      setError(t(UNSUPPORTED));
      return;
    }
    setPhase("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPhase("idle");
      setError(t(MIC_OFF));
      return;
    }
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream.current, { mimeType: format.mimeType });
    rec.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    rec.onstop = () => {
      release();
      const blob = new Blob(chunks, { type: format.mimeType });
      if (!blob.size) {
        setPhase("idle");
        setError(t("We didn’t catch anything. Try again."));
        return;
      }
      const file = new File([blob], memoName(new Date(), format.extension), { type: format.mimeType });
      setMemo({ file, url: URL.createObjectURL(blob) });
      setPhase("recorded");
    };
    recorder.current = rec;
    rec.start();
    setLevels([]);
    startMeter(stream.current);
    setSeconds(0);
    setPhase("recording");
    let elapsed = 0;
    timer.current = setInterval(() => {
      elapsed += 1;
      setSeconds(elapsed);
      if (elapsed >= MEMO_MAX_SECONDS) rec.stop();
    }, 1000);
  }

  const stop = () => recorder.current?.state === "recording" && recorder.current.stop();
  const again = () => {
    setMemo(null);
    setPhase("idle");
  };

  return (
    <div role="group" aria-label={t("Record a voice memo")} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold">{t("Record a voice memo")}</p>
          <p className="text-[13.5px] leading-[1.45] text-ink-2">{t("Anything you remember: a conversation, a phone call, what someone said.")}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t("Close")} className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-chip">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {phase === "recorded" && memo ? (
        // A plain player, to hear it back before adding it.
        <audio controls src={memo.url} className="w-full" aria-label={t("Your voice memo")} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          {phase === "recording" ? (
            <button
              type="button"
              onClick={stop}
              aria-label={t("Stop")}
              className="flex size-18 items-center justify-center rounded-full bg-error text-white shadow-[0_0_0_8px_var(--color-error-bg)] transition-transform active:scale-95 motion-reduce:transition-none"
            >
              <Square size={24} className="fill-current" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void start()}
              disabled={phase === "starting"}
              aria-label={t("Start recording")}
              className="flex size-18 items-center justify-center rounded-full bg-gold text-white shadow-[0_0_0_8px_var(--color-gold-soft)] transition-[background-color,transform] hover:bg-gold-hover active:scale-95 disabled:opacity-60 motion-reduce:transition-none"
            >
              {phase === "starting" ? <Loader2 size={26} className="motion-safe:animate-spin" aria-hidden="true" /> : <Mic size={28} aria-hidden="true" />}
            </button>
          )}
          {phase === "recording" ? (
            <>
              <Waveform levels={levels} className="h-10 w-full max-w-[320px]" />
              <p role="status" className="flex items-center gap-2 text-[14px] text-ink">
                <span aria-hidden className="size-2.5 rounded-full bg-error motion-safe:animate-pulse" />
                {t("Recording")} <span className="tabular-nums text-ink-2">{clock(seconds)}</span>
              </p>
            </>
          ) : (
            <p className="text-[14px] font-medium text-ink-2">{t("Tap to start recording")}</p>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-[13.5px] text-error">
          {error}
        </p>
      )}

      {phase === "recorded" && memo && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => onAdd(memo.file)} disabled={adding} aria-busy={adding}>
            {adding && <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />}
            {t("Add to my case")}
          </Button>
          <Button variant="quiet" size="sm" onClick={again} disabled={adding}>
            {t("Record again")}
          </Button>
        </div>
      )}
    </div>
  );
}
