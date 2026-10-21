import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import type { CaseArea } from "@/lib/types";
import { caseKeys } from "./queries";

/** Whether the case has what a lawyer needs (GET /api/client/cases/:id/lawyer-readiness). The API
 * asks Jev after each AI answer and keeps the result, so fetching it again is free. */
export interface LawyerReadiness {
  /** False when the API has the check switched off: offer a lawyer as before. */
  enabled: boolean;
  ready: boolean;
  criteria: { key: string; label: string; met: boolean; confidence: number }[];
  practiceArea: { value: CaseArea | "PERSONAL_INJURY"; confidence: number } | null;
  ukJurisdiction: string | null;
  blockedBy: "OUTSIDE_UK" | "PERSONAL_INJURY" | null;
  /** The check couldn't run this time. Show nothing rather than guess. */
  unavailable: boolean;
  checkedAt: string | null;
  basedOnMessageId: string | null;
}

export function getLawyerReadiness(caseId: string) {
  return apiFetch<LawyerReadiness>(`/api/client/cases/${caseId}/lawyer-readiness`);
}

/** Keyed by the latest AI answer, so a new answer means a fresh check and an old one is cached. */
export function useLawyerReadinessQuery(caseId: string, latestAnswerId: string | undefined) {
  const userId = useSession((s) => s.user?.id);
  return useQuery({
    queryKey: [...caseKeys.all(userId), "lawyer-readiness", caseId, latestAnswerId ?? "none"],
    queryFn: () => getLawyerReadiness(caseId),
    enabled: !!userId && !!latestAnswerId,
    staleTime: Infinity,
    // A refusal (e.g. AI consent withdrawn) just means no suggestion; don't retry it.
    retry: false,
  });
}

/** "an employment lawyer in England and Wales" */
export function lawyerKind(r: Pick<LawyerReadiness, "practiceArea" | "ukJurisdiction">) {
  const area: Record<string, string> = {
    EMPLOYMENT: "an employment lawyer",
    PROPERTY: "a property lawyer",
    FAMILY: "a family lawyer",
    CONSUMER: "a consumer lawyer",
  };
  const who = (r.practiceArea && area[r.practiceArea.value]) || "a lawyer";
  return r.ukJurisdiction ? `${who} in ${r.ukJurisdiction}` : who;
}
