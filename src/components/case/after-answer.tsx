"use client";

import { LawyerSuggestion } from "@/components/case/lawyer-suggestion";
import { useSite } from "@/components/site/site-provider";
import type { Case } from "@/lib/types";

/**
 * What sits under the AI's latest answer (consultation.*.tsx): the lawyer offer once the case is
 * ready. The UK-part question used to have its own separate RegionPrompt card here — removed, since
 * CW's own #158 suggestions already cover that exact question deterministically (the three real
 * jurisdictions, guaranteed, never guessed) through the same single mechanism as every other
 * question. Two parallel ways to answer the same question was the actual bug.
 */
export function AfterAnswer({ c, latestAnswerId }: { c: Case; latestAnswerId: string }) {
  const { clientRequests } = useSite();
  if (clientRequests !== "open") return null;
  return <LawyerSuggestion caseId={c.id} latestAnswerId={latestAnswerId} />;
}
