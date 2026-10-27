import type { CaseIntake } from "@/lib/types";

/** Pure helpers for the Overview tab's banners — kept out of overview.tsx so their branching has
 * its own test (overview-copy.test.ts). The intake has one flat status (unlike the old overview's
 * per-section one): RUNNING or FAILED speak for themselves; STALE means the case, chat or
 * documents changed since it was last written. EMPTY and READY show no banner at all — EMPTY's
 * "nothing yet" message is each section's own empty state. */
export function intakeBanner(o: Pick<CaseIntake, "status">): "RUNNING" | "FAILED" | "STALE" | null {
  return o.status === "RUNNING" || o.status === "FAILED" || o.status === "STALE" ? o.status : null;
}
