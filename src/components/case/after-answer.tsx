"use client";

import { LawyerSuggestion } from "@/components/case/lawyer-suggestion";
import { RegionPrompt } from "@/components/case/region-prompt";
import { useSite } from "@/components/site/site-provider";
import { caseRegion, type Case } from "@/lib/types";

/**
 * What sits under the AI's latest answer (consultation.*.tsx). On a site that asks for a part of the
 * UK, that comes first until the case has one (#973), then the lawyer offer. A site without the
 * question (KR, PH) never shows the UK picker, and no lawyer offer until its lawyers take requests.
 */
export function AfterAnswer({ c, latestAnswerId, onAsk }: { c: Case; latestAnswerId: string; onAsk: (text: string) => void }) {
  const { regionQuestion, clientRequests } = useSite();
  if (regionQuestion && caseRegion(c) === "") return <RegionPrompt caseId={c.id} />;
  if (clientRequests !== "open") return null;
  return <LawyerSuggestion caseId={c.id} latestAnswerId={latestAnswerId} onAsk={onAsk} />;
}
