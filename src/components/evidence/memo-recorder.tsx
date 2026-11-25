"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/site/language-provider";
import { clock } from "@/lib/voice/live-dictation";
import { MIC_OFF, UNSUPPORTED } from "@/lib/voice/live-dictation";
import { memoFormat, memoName } from "@/lib/cases/evidence";

/** A voice memo stops by itself after this long. */
const MEMO_MAX_SECONDS = 5 * 60;

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
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const release = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
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
    <div role="group" aria-label={t("Record a voice memo")} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold">{t("Record a voice memo")}</p>
          <p className="text-[13.5px] leading-[1.45] text-ink-2">{t("Anything you remember: a conversation, a phone call, what someone said.")}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t("Close")} className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-chip">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {phase === "recording" && (
        <p role="status" className="flex items-center gap-2 text-[14px] text-ink">
          <span aria-hidden className="size-2.5 rounded-full bg-error motion-safe:animate-pulse" />
          {t("Recording")} <span className="tabular-nums text-ink-2">{clock(seconds)}</span>
        </p>
      )}
      {phase === "recorded" && memo && (
        // A plain player, to hear it back before adding it.
        <audio controls src={memo.url} className="w-full" aria-label={t("Your voice memo")} />
      )}
      {error && (
        <p role="alert" className="text-[13.5px] text-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(phase === "idle" || phase === "starting") && (
          <Button variant="primary" size="sm" onClick={() => void start()} disabled={phase === "starting"}>
            <Mic size={14} aria-hidden="true" />
            {t("Start recording")}
          </Button>
        )}
        {phase === "recording" && (
          <Button variant="primary" size="sm" onClick={stop}>
            <Square size={12} className="fill-current" aria-hidden="true" />
            {t("Stop")}
          </Button>
        )}
        {phase === "recorded" && memo && (
          <>
            <Button variant="primary" size="sm" onClick={() => onAdd(memo.file)} disabled={adding} aria-busy={adding}>
              {adding && <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />}
              {t("Add to my case")}
            </Button>
            <Button variant="quiet" size="sm" onClick={again} disabled={adding}>
              {t("Record again")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
