import { msg } from "@/lib/i18n/msg";
import type { IntakeFormFields, IntakeItem } from "@/lib/types";
import type { QuestionDetail, QuestionsState } from "./questions";

// "Your case" beside the questions and evidence (components/steps/case-rail.tsx): each detail the
// case needs, as what the client said, filling in as they answer.

/** The details in the order a case file reads, each with the client's own name for it. */
const DETAILS: readonly { detail: QuestionDetail; label: string }[] = [
  { detail: "otherSide", label: msg("The other side") },
  { detail: "relationship", label: msg("Relationship") },
  { detail: "terms", label: msg("Your role and pay") },
  { detail: "reasonGiven", label: msg("Reason given") },
  { detail: "status", label: msg("Where things stand") },
  { detail: "place", label: msg("Where") },
  { detail: "witnesses", label: msg("Witnesses") },
  { detail: "goal", label: msg("What you want") },
];

export interface CaseFileRow {
  detail: QuestionDetail;
  label: string;
  /** What the client said (or the story already told us); null while asked or skipped. */
  value: string | null;
  state: "filled" | "asking" | "skipped";
}

/** A question's detail, from its id: the detail's own, or "<detail>.followUp". */
function detailOf(id: string): string {
  return id.split(".")[0] ?? id;
}

const joined = (items: IntakeItem[]) => items.map((i) => i.text).join(" · ");

/** What the story already told us about a detail, from the intake's case fields. */
function fromStory(detail: QuestionDetail, f: IntakeFormFields): string {
  switch (detail) {
    case "otherSide":
      return f.parties.map((p) => p.name).join(", ");
    case "relationship":
      return joined(f.relationship);
    case "terms":
      return joined(f.roleAndTerms);
    case "reasonGiven":
      return joined(f.reasonGiven);
    case "place":
      return f.venue ?? "";
    case "witnesses":
      return f.witnesses.map((p) => p.name).join(", ");
    case "goal":
      return joined(f.clientGoals);
    case "status":
      return "";
  }
}

/**
 * The case file's rows: a detail shows once there's something to say about it. The answers come
 * first (a detail and its follow-up joined, in the client's words), then what the story already
 * told us; the question being asked now shows as asking, one skipped as skipped. Details nobody has
 * mentioned yet aren't listed: the questions are the way to them.
 */
export function caseFileOf(questions: Pick<QuestionsState, "history" | "current"> | null | undefined, fields: IntakeFormFields | null | undefined): CaseFileRow[] {
  const rows: CaseFileRow[] = [];
  for (const { detail, label } of DETAILS) {
    const asked = (questions?.history ?? []).filter((h) => detailOf(h.id) === detail);
    const said = asked.filter((h) => !h.skipped && h.answer?.trim()).map((h) => h.answer!.trim());
    if (said.length) {
      rows.push({ detail, label, value: said.join(" · "), state: "filled" });
      continue;
    }
    if (questions?.current && detailOf(questions.current.id) === detail) {
      rows.push({ detail, label, value: null, state: "asking" });
      continue;
    }
    const story = fields ? fromStory(detail, fields).trim() : "";
    if (story) rows.push({ detail, label, value: story, state: "filled" });
    else if (asked.length) rows.push({ detail, label, value: null, state: "skipped" });
  }
  return rows;
}
