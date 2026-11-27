"use client";

import { LawyerSuggestion } from "@/components/case/lawyer-suggestion";
import { RegionPrompt } from "@/components/case/region-prompt";
import { useSite } from "@/components/site/site-provider";
import { useQuestionsUnderway } from "@/lib/cases/questions";
import { caseRegion, UK_JURISDICTIONS, type Case } from "@/lib/types";

/** CW returns exactly these three, in this order, only for its one fixed jurisdiction question
 * (`_JURISDICTION_SUGGESTIONS` in the_server.py) -- the one signal that the AI's LATEST message
 * is actually asking it, as opposed to the case merely not having a region yet (it can ask other
 * questions first, e.g. "what's the money owed for", long before it gets to this one). */
export function isJurisdictionQuestion(suggestions: string[]): boolean {
  return suggestions.length === UK_JURISDICTIONS.length && UK_JURISDICTIONS.every((j, i) => suggestions[i] === j);
}

/**
 * What sits under the AI's latest answer (consultation.*.tsx). On a site that asks for a part of
 * the UK, the picker only shows while the case has no region AND the AI's latest message is that
 * exact question (#973 plus 2026-11-24's live QA: showing it under an unrelated question, just
 * because the region happens to be unset, is its own bug) -- otherwise the lawyer offer.
 * A site without the question (KR, PH) never shows the UK picker, and no lawyer offer until its
 * lawyers take requests.
 */
export function AfterAnswer({
  c,
  latestAnswerId,
  suggestions,
  onAnswered,
}: {
  c: Case;
  latestAnswerId: string;
  suggestions: string[];
  onAnswered: (text: string) => void;
}) {
  const { regionQuestion, clientRequests, storyIntake } = useSite();
  // Not while the case's questions are under way: the header's button is offer enough until then.
  const underway = useQuestionsUnderway(c.id, storyIntake === "open");
  if (regionQuestion && caseRegion(c) === "" && isJurisdictionQuestion(suggestions)) {
    return <RegionPrompt caseId={c.id} onAnswered={onAnswered} />;
  }
  if (clientRequests !== "open" || underway) return null;
  return <LawyerSuggestion caseId={c.id} latestAnswerId={latestAnswerId} />;
}
