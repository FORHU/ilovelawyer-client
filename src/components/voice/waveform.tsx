import { cn } from "@/lib/cn";

/** Bars drawn from the microphone's recent levels (useLiveDictation's `levels`, 0 to 1, newest on
 * the right), so the client sees they're being heard: flat in silence, moving as they speak.
 * Decorative: what's heard is already said in words beside it. */
export function Waveform({ levels, bars = 32, className }: { levels: number[]; bars?: number; /** Sets the height. */ className: string }) {
  // Pad on the left, so a new recording grows in from the right.
  const shown = [...Array<number>(Math.max(0, bars - levels.length)).fill(0), ...levels.slice(-bars)];
  return (
    <div aria-hidden="true" className={cn("flex items-center justify-center gap-[3px]", className)}>
      {shown.map((level, i) => (
        <span
          key={i}
          className="h-full w-[3px] origin-center rounded-full bg-gold transition-transform duration-100 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleY(${0.08 + level * 0.92})` }}
        />
      ))}
    </div>
  );
}
