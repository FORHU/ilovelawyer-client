import { cn } from "@/lib/cn";

/** Three pulsing dots: someone is writing. The pulse is off for people who ask for less motion, so
 * the dots just sit there; the caller gives the group its `role="status"` and a label. */
export function TypingDots({ className }: { className?: string }) {
  return (
    <>
      {[0, 1, 2].map((d) => (
        <span key={d} aria-hidden className={cn("size-1.5 rounded-full bg-muted motion-safe:animate-pulse", className)} style={{ animationDelay: `${d * 150}ms` }} />
      ))}
    </>
  );
}
