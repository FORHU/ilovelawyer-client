import { ApiError } from "@/lib/api/fetch";
import type { T } from "@/lib/i18n/translate";
import type { CaseIntake } from "@/lib/types";

// The client's "Download case summary" (ilovelawyer-client#137): a PDF of what the client told us,
// built by the API from the stored intake. These are the rules for when it can be had and what to
// say when it can't, kept free of React so they can be tested.

/** What the cached intake says about downloading now. "unknown": nothing cached (the header menu
 * on another tab), so the API decides. */
export type SummaryAvailability = "ready" | "empty" | "preparing" | "unknown";

/** A refresh still running counts as preparing even when an older intake exists: the summary would
 * be out of date the moment it saved. A STALE or FAILED intake with a saved version is still ready —
 * the PDF prints its "as of" date. */
export function summaryAvailability(intake: CaseIntake | undefined): SummaryAvailability {
  if (!intake) return "unknown";
  if (intake.status === "RUNNING") return "preparing";
  if (intake.status === "EMPTY" || !intake.generatedAt) return "empty";
  return "ready";
}

/** What went wrong, as the message's tone needs it: "info" is nothing to fix, just not yet. */
export interface SummaryProblem {
  tone: "info" | "error";
  text: string;
}

export function emptySummaryProblem(t: T): SummaryProblem {
  return { tone: "info", text: t("There's nothing to put in a case summary yet. Tell us about your case in the chat first.") };
}

export function preparingSummaryProblem(t: T): SummaryProblem {
  return { tone: "info", text: t("Your overview is still being prepared. Try again in a moment.") };
}

/** The export failed: the API's two "not yet" codes read as the same messages the cached check
 * gives; a network or server error keeps apiFetch's own (already translated) message. Only the
 * API's own JSON 404 ("Case not found": not this client's case) says so; a 404 with no JSON body is
 * a route that isn't there (an API without the export yet), which is our fault, not a missing case. */
export function summaryProblemOf(err: unknown, t: T): SummaryProblem {
  if (err instanceof ApiError) {
    if (err.code === "INTAKE_EMPTY") return emptySummaryProblem(t);
    if (err.code === "INTAKE_RUNNING") return preparingSummaryProblem(t);
    if (err.status === 404 && typeof err.body?.message === "string") return { tone: "error", text: t("We couldn't find this case.") };
    if (err.status === 0 || err.status >= 500) return { tone: "error", text: err.message };
  }
  return { tone: "error", text: t("Couldn't prepare your case summary. Try again.") };
}

/** The name to save under if the file link sends none: case-summary-<title>-<YYYY-MM-DD>.pdf. Letters
 * and digits of any script stay (a Korean title is still readable); everything else becomes a dash. */
export function caseSummaryFilename(title: string, now: Date = new Date()): string {
  const slug =
    title
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "case";
  return `case-summary-${slug}-${now.toISOString().slice(0, 10)}.pdf`;
}
