import { parseNotes } from "@/lib/cases/notes";
import type { Case, CaseIntake } from "@/lib/types";

export interface Basic {
  key: string;
  label: string;
  met: boolean;
}

/** The five basics a lawyer wants to see, worked out from what the client has already given (the case
 * form and the overview). The fallback for the Overview's readiness banner when the API has no
 * lawyer-readiness result to show (the check is off, or hasn't run): it only says which of these
 * are covered, never that the case is ready for a lawyer. */
export function caseBasics(c: Pick<Case, "areas" | "ukJurisdiction" | "others" | "notes">, intake: Pick<CaseIntake, "people" | "timeline" | "goals" | "summary">): Basic[] {
  const notes = parseNotes(c.notes);
  return [
    { key: "problem", label: "The problem", met: c.areas.length > 0 || !!intake.summary },
    { key: "where", label: "Where in the UK", met: c.ukJurisdiction !== null },
    { key: "other-side", label: "The other side", met: c.others.length > 0 || intake.people.length > 0 },
    { key: "what-happened", label: "What happened and when", met: intake.timeline.length > 0 || !!notes.happened },
    { key: "what-you-want", label: "What you want", met: intake.goals.length > 0 || !!notes.wants },
  ];
}
