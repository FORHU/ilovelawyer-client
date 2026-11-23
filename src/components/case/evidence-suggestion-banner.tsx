"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import type { MissingEvidenceItem } from "@/lib/types";

/** #159: the one next-most-useful upload to suggest, from the case's open CaseMissingEvidence
 * gaps (lib/documents/evidence-gaps.ts, nextSuggestedGap) and CW's phrased ask for it. There's no
 * "evidence space" screen in this repo yet, so this is new UI — a single banner rather than a
 * full ordered gap list, per the plan's "keep it simple" scope. Renders nothing once every known
 * gap has something filled, or there's nothing to suggest. Picking a file here tags the upload
 * with this gap's id (the "fill this gap" link — an explicit action, not an AI guess). */
export function EvidenceSuggestionBanner({
  gap,
  message,
  onUpload,
}: {
  gap: MissingEvidenceItem | null;
  message: string | null;
  onUpload: (gapId: string, file: File) => void;
}) {
  if (!gap) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-card border border-dashed border-line-input bg-subtle px-4 py-3 text-[13px] leading-[1.5]"
    >
      <Lightbulb size={15} className="mt-px shrink-0 text-ink-2" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="font-medium">Worth adding: </span>
          {message || gap.label}
          {gap.detail && <span className="text-ink-2"> — {gap.detail}</span>}
        </div>
        <FilePicker multiple={false} onPick={(files) => files[0] && onUpload(gap.id, files[0])}>
          {(open) => (
            <Button type="button" variant="soft" size="sm" onClick={open}>
              Upload
            </Button>
          )}
        </FilePicker>
      </div>
    </div>
  );
}
