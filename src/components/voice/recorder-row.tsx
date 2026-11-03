"use client";

import { LoaderCircle, Mic, Square, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DictationPhase } from "@/lib/voice/use-dictation";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** The mic in a composer. Tapping it asks for the microphone, if it hasn't been allowed yet. */
export function MicButton({ onClick, disabled, compact }: { onClick: () => void; disabled?: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Speak instead of typing"
      title="Speak instead of typing"
      data-tour="mic"
      data-no-tap
      className={cn(
        "flex shrink-0 items-center justify-center self-end rounded-full text-ink-2 transition-colors hover:bg-chip hover:text-ink disabled:opacity-40",
        compact ? "size-9" : "size-11",
      )}
    >
      <Mic size={20} aria-hidden="true" />
    </button>
  );
}

/** What replaces a composer's text box while recording and transcribing: cancel, a running clock,
 * and stop. The words are put in the composer afterwards, to be edited before sending. */
export function RecorderRow({
  phase,
  seconds,
  onCancel,
  onStop,
}: {
  phase: Exclude<DictationPhase, "idle">;
  seconds: number;
  onCancel: () => void;
  onStop: () => void;
}) {
  if (phase === "transcribing") {
    return (
      <div role="status" className="flex min-h-11 flex-1 items-center justify-center gap-2.5 text-[14px] text-ink-2">
        <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
        Transcribing…
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel recording"
        data-no-tap
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line-input text-ink-2 hover:border-line-hover hover:text-ink"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <div role="status" aria-label={`Recording, ${clock(seconds)}`} className="flex min-h-11 flex-1 items-center justify-center gap-2.5 text-[14px]">
        <span aria-hidden className="size-2.5 rounded-full bg-error motion-safe:animate-pulse" />
        <span className="tabular-nums">{clock(seconds)}</span>
        <span className="text-ink-2">Recording</span>
      </div>
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop recording"
        data-no-tap
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-white hover:bg-gold-hover"
      >
        <Square size={14} className="fill-current" aria-hidden="true" />
      </button>
    </>
  );
}
