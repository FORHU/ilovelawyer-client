import type { CaseOverview } from "@/lib/types";

/** Pure helpers for the Overview tab's banners (#45) — kept out of overview.tsx so their
 * branching has its own test (overview-copy.test.ts). */

/** Which banner sits above the sections. The API reports a status per section, not one for the
 * whole overview: a running job is RUNNING; a first run that failed before saving anything is
 * FAILED (every section reads FAILED with no generatedAt); any STALE section means the documents
 * changed since it was written. A partial failure after that shows on its own section instead. */
export function overviewBanner(o: Pick<CaseOverview, "job" | "generatedAt" | "sections">): "RUNNING" | "FAILED" | "STALE" | null {
  if (o.job) return "RUNNING";
  const statuses = Object.values(o.sections);
  if (!o.generatedAt && statuses.includes("FAILED")) return "FAILED";
  if (statuses.includes("STALE")) return "STALE";
  return null;
}

/** "You've added 2 documents since this was written", singular/plural and added/removed handled
 * for every combination, including neither (STALE with an unchanged id set, such as a document
 * read again). */
export function staleChangeText(changedSince: { added: number; removed: number } | null): string {
  const parts: string[] = [];
  if (changedSince?.added) parts.push(`added ${changedSince.added}`);
  if (changedSince?.removed) parts.push(`removed ${changedSince.removed}`);
  if (!parts.length) return "This was written before your latest change";
  const total = (changedSince?.added ?? 0) + (changedSince?.removed ?? 0);
  return `You've ${parts.join(" and ")} document${total === 1 ? "" : "s"} since this was written`;
}
