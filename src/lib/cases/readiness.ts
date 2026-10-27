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
  /** The case areas Jev is sure the problem falls under. Once ready, they're the case's. Empty
   * before Jev has looked, or when it's sure of none. */
  caseAreas: (CaseArea & { confidence: number })[];
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

/** "a lawyer for Employment and Consumer in England and Wales". Other says nothing more than "a
 * lawyer". The names are admins' (case areas), so they're used as written. */
export function lawyerKind(r: Pick<LawyerReadiness, "caseAreas" | "ukJurisdiction">) {
  const names = (r.caseAreas ?? []).filter((a) => a.code !== "OTHER").map((a) => a.name);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  const who = list ? `a lawyer for ${list}` : "a lawyer";
  return r.ukJurisdiction ? `${who} in ${r.ukJurisdiction}` : who;
}
