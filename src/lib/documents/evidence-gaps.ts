import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";
import type { CaseDocument, MissingEvidenceItem, MissingEvidenceResponse } from "@/lib/types";

export function getMissingEvidence(caseId: string) {
  return apiFetch<MissingEvidenceResponse>(`/api/client/cases/${caseId}/missing-evidence`);
}

/** Same staleness idiom as useLawyerReadinessQuery (readiness.ts): cheap to refetch (the API
 * caches the gap rows; CW's suggestion is the only live part), so poll lightly rather than tie
 * this to a specific answer id the way readiness does. */
export function useMissingEvidenceQuery(caseId: string) {
  const userId = useSession((s) => s.user?.id);
  return useQuery({
    queryKey: [...caseKeys.all(userId), "missing-evidence", caseId],
    queryFn: () => getMissingEvidence(caseId),
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
  });
}

// #159: linking an evidence upload to the CaseMissingEvidence gap it resolved, and relabeling its
// sync status for the client. Gaps come from GET /cases/:id/missing-evidence — NOT
// CaseIntake.missing/IntakeGap, which is the separate #157 readiness checklist. An earlier version
// of this file read gaps from there by mistake, since that route didn't exist yet when it was
// written; the link itself is explicit (the client taps "fill this gap" and the upload carries
// missingEvidenceId), never an AI guess, so matching here is a plain id lookup, not inference.

/** "Uploading…", "Processing…", "Ready", "Couldn't be read" — the relabeled #159 vocabulary when
 * the API sends it, falling back to the existing PENDING/READY/FAILED status otherwise. */
export function documentSyncLabel(d: CaseDocument): string {
  switch (d.syncStatus) {
    case "uploading":
      return "Uploading…";
    case "processing":
      return "Processing…";
    case "done":
      return "Ready";
    case "failed":
      return "Couldn't be read";
    default:
      break;
  }
  switch (d.status) {
    case "PENDING":
      return "Processing…";
    case "FAILED":
      return "Couldn't be read";
    case "READY":
      return "Ready";
  }
}

/** The gap (if any) this document resolved — the gap whose filledByDocumentId is this document. */
export function gapForDocument(d: CaseDocument, gaps: MissingEvidenceItem[] | undefined): MissingEvidenceItem | null {
  if (!gaps) return null;
  return gaps.find((g) => g.filledByDocumentId === d.id) ?? null;
}

/** CW's pick of what to ask for next, resolved against the gap it names — null if there's no
 * suggestion, or (shouldn't happen, but defensively) it names a gap that isn't in the list. */
export function nextSuggestedGap(missingEvidence: MissingEvidenceResponse | undefined): MissingEvidenceItem | null {
  if (!missingEvidence?.suggestion) return null;
  return missingEvidence.gaps.find((g) => g.id === missingEvidence.suggestion!.gapId) ?? null;
}
