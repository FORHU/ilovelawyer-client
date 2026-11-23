import type { CaseDocument, CaseIntake, IntakeGap } from "@/lib/types";

// #159: linking an evidence upload to the Overview gap (CaseIntake.missing) it resolves, and
// relabeling its sync status for the client. ilovelawyer-api's gap-linking write path wasn't
// landed yet when this was written, so `CaseDocument.filledGapId` and `.syncStatus` are read
// defensively — absent on an API that doesn't send them yet.

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

/** The gap (if any) this document resolved, by `filledGapId`. */
export function gapForDocument(d: CaseDocument, intake: CaseIntake | undefined): IntakeGap | null {
  if (!d.filledGapId || !intake) return null;
  return intake.missing.find((g) => g.id === d.filledGapId) ?? null;
}

/** The next most useful thing to upload: the first Overview gap no document has resolved yet.
 * Null once every known gap has something filled against it, or there's nothing missing. */
export function nextSuggestedGap(intake: CaseIntake | undefined, documents: CaseDocument[]): IntakeGap | null {
  if (!intake?.missing.length) return null;
  const filled = new Set(documents.map((d) => d.filledGapId).filter((id): id is string => !!id));
  return intake.missing.find((g) => !filled.has(g.id)) ?? null;
}
