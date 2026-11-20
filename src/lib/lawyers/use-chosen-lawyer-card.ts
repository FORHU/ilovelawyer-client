"use client";

import { useSite } from "@/components/site/site-provider";
import { useCaseQuery, useMessagesQuery } from "@/lib/cases/queries";
import { useLawyerReadinessQuery } from "@/lib/cases/readiness";
import { useEligibilityQuery, useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { chosenLawyerCardState, useChosenLawyer } from "./chosen-lawyer";

/** chosenLawyerCardState for a case, from its queries: the Overview card and the header button read
 * the same answer. The readiness check is keyed by the latest AI answer, as in the Interview. */
export function useChosenLawyerCard(caseId: string) {
  const site = useSite();
  const chosen = useChosenLawyer((s) => s.byCase[caseId] ?? null);
  const { data: theCase } = useCaseQuery(caseId);
  const { data: eligibility } = useEligibilityQuery(caseId);
  const { data: openRequest } = useOpenLawyerRequestQuery(caseId);
  const { data: messages } = useMessagesQuery(caseId);
  const latestAnswerId = messages?.messages.findLast((m) => m.role === "ai")?.id;
  const { data: readiness } = useLawyerReadinessQuery(caseId, latestAnswerId);
  return chosenLawyerCardState({
    chosen,
    theCase,
    eligibility,
    readiness,
    readinessExpected: site.intakeChat === "open" && site.clientRequests === "open",
    openRequest,
  });
}
