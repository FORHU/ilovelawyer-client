import { useT } from "@/components/site/language-provider";
import { cn } from "@/lib/cn";
import { appendSpoken, clock } from "@/lib/voice/live-dictation";
import type { LiveDictationPhase } from "@/lib/voice/use-live-dictation";

/** What the composer shows while the client speaks: whether it's listening, for how long, and the
 * words so far, newest line in view. `before` is what's already in the composer (typed, or spoken
 * earlier): it stays on screen and the new words carry on after it, as they will once stopped.
 * Shared by the intake's desktop and mobile views. */
export function LiveDictationStatus({
  phase,
  seconds,
  transcript,
  before = "",
}: {
  phase: LiveDictationPhase;
  seconds: number;
  transcript: string;
  before?: string;
}) {
  const t = useT();
  const label = phase === "starting" ? t("Starting…") : phase === "finishing" ? t("Finishing…") : t("Listening");
  const shown = appendSpoken(before, transcript).trim();
  return (
    <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5 px-1 py-1.5">
      <div role="status" className="flex items-center gap-2 text-[12.5px] text-ink-2">
        <span aria-hidden className={cn("size-2 rounded-full motion-safe:animate-pulse", phase === "recording" ? "bg-error" : "bg-gold")} />
        <span>{label}</span>
        {phase !== "starting" && <span className="tabular-nums text-muted">{clock(seconds)}</span>}
      </div>
      {/* Not announced as it changes: the words are revised several times a second. */}
      <p className="flex max-h-18 flex-col justify-end overflow-hidden text-[15px] leading-6 text-ink">
        {shown ? <span className="whitespace-pre-wrap">{shown}</span> : phase === "recording" && <span className="text-muted">{t("Say what happened…")}</span>}
      </p>
    </div>
  );
}
