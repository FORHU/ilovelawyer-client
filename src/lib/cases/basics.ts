import { parseNotes } from "@/lib/cases/notes";
import { caseRegion, type Case, type CaseIntake } from "@/lib/types";
import { msg } from "@/lib/i18n/msg";

export interface Basic {
  key: string;
  label: string;
  met: boolean;
}

/** The five basics a lawyer wants to see, worked out from what the client has already given (the case
 * form and the overview). The fallback for the Overview's readiness banner when the API has no
 * lawyer-readiness result to show (the check is off, or hasn't run): it only says which of these
 * are covered, never that the case is ready for a lawyer. */
export function caseBasics(
  c: Pick<Case, "areas" | "ukJurisdiction" | "outsideUk" | "others" | "notes"> & { where?: string },
  intake: Pick<CaseIntake, "people" | "timeline" | "goals" | "summary">,
  regionQuestion = true,
): Basic[] {
  const notes = parseNotes(c.notes);
  return [
    { key: "problem", label: msg("The problem"), met: c.areas.length > 0 || !!intake.summary },
    // Answered once the client has said where, outside the UK included; not while nobody has (#973).
    // A site that doesn't ask about the UK's parts takes the town or city.
    regionQuestion
      ? { key: "where", label: msg("Where in the UK"), met: caseRegion(c) !== "" }
      : { key: "where", label: msg("Where"), met: !!c.where?.trim() },
    { key: "other-side", label: msg("The other side"), met: c.others.length > 0 || intake.people.length > 0 },
    { key: "what-happened", label: msg("What happened and when"), met: intake.timeline.length > 0 || !!notes.happened },
    { key: "what-you-want", label: msg("What you want"), met: intake.goals.length > 0 || !!notes.wants },
  ];
}
