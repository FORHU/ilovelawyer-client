import { cn } from "@/lib/cn";

export type ProgressTone = "gold" | "warning" | "critical";

const TONE_CLASS: Record<ProgressTone, string> = {
  gold: "bg-gold",
  warning: "bg-amber-500",
  critical: "bg-error",
};

/** A slim, non-interactive progress bar. `value` is 0-100 (callers clamp the underlying
 * percentage before this; it also clamps defensively so a bad value can't overflow the track). */
export function ProgressBar({
  value,
  tone = "gold",
  className,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-chip", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", TONE_CLASS[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
