"use client";

import { Lightbulb } from "lucide-react";
import type { IntakeGap } from "@/lib/types";

/** #159: the one next-most-useful upload to suggest, from the Overview's open gaps
 * (lib/documents/evidence-gaps.ts, nextSuggestedGap). There's no "evidence space" screen in this
 * repo yet, so this is new UI — a single banner rather than a full ordered gap list, per the plan's
 * "keep it simple" scope. Renders nothing once every known gap has something filled against it. */
export function EvidenceSuggestionBanner({ gap }: { gap: IntakeGap | null }) {
  if (!gap) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-card border border-dashed border-line-input bg-subtle px-4 py-3 text-[13px] leading-[1.5]"
    >
      <Lightbulb size={15} className="mt-px shrink-0 text-ink-2" aria-hidden="true" />
      <div>
        <span className="font-medium">Worth adding: </span>
        {gap.question}
        {gap.why && <span className="text-ink-2"> — {gap.why}</span>}
      </div>
    </div>
  );
}
