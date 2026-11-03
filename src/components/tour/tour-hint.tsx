"use client";

import { useTour } from "@/lib/tour/store";
import { useTourHydrated } from "@/lib/tour/use-tour-hydrated";
import { Button } from "@/components/ui/button";

/** T2: a dismissible card at the top of New case, not a tour. It stays until "Got it", and the
 * guide's "Tour this page" brings it back. */
export function TourHint({ className }: { className?: string }) {
  const seen = useTour((s) => !!s.seen.T2);
  const ready = useTourHydrated();
  // Not before the API has said what this account has seen.
  const loaded = useTour((s) => s.loaded);
  if (!ready || !loaded || seen) return null;
  return (
    <div role="note" className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-warn-line bg-warn-bg px-4 py-3 ${className ?? ""}`}>
      <p className="min-w-[200px] flex-1 text-[13px] leading-[1.5] text-warn-ink">
        Tell us in your own words. We&apos;ll ask a few questions, then you check the details before your case is created.
      </p>
      <Button variant="outline" size="sm" onClick={() => useTour.getState().markSeen(["T2"], "COMPLETED")}>
        Got it
      </Button>
    </div>
  );
}
