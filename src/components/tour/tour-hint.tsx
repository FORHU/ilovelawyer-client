"use client";

import { useTour } from "@/lib/tour/store";
import { useTourHydrated } from "@/lib/tour/use-tour-hydrated";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/site/language-provider";
import { useSite } from "@/components/site/site-provider";

/** T2: a dismissible card at the top of New case, not a tour. It stays until "Got it", and the
 * guide's "Tour this page" brings it back. */
export function TourHint({ className }: { className?: string }) {
  const seen = useTour((s) => !!s.seen.T2);
  const ready = useTourHydrated();
  // Not before the API has said what this account has seen.
  const loaded = useTour((s) => s.loaded);
  const t = useT();
  const chatOpen = useSite().intakeChat === "open";
  if (!ready || !loaded || seen) return null;
  return (
    <div role="note" className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-warn-line bg-warn-bg px-4 py-3 ${className ?? ""}`}>
      <p className="min-w-[200px] flex-1 text-[13px] leading-[1.5] text-warn-ink">
        {chatOpen
          ? "Tell us in your own words. We'll ask a few questions, then you check the details before your case is created."
          : t("Fill in what you know. Only the title and the type of issue are needed, and you can change everything later.")}
      </p>
      <Button variant="outline" size="sm" onClick={() => useTour.getState().markSeen(["T2"], "COMPLETED")}>
        {t("Got it")}
      </Button>
    </div>
  );
}
