import { msg } from "@/lib/i18n/msg";
import type { IntakeFormFields } from "@/lib/types";
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

/** What the story already told us about a detail, from the intake's case fields: only the names
 * and the place. Its other fields are written about the client for their lawyer ("The client was an
 * employee of…"), which reads wrong said back to the client, so those wait for the client's answer. */
function fromStory(detail: QuestionDetail, f: IntakeFormFields): string {
  switch (detail) {
    case "otherSide":
      return f.parties.map((p) => p.name).join(", ");
    case "place":
      return f.venue ?? "";
    case "witnesses":
      return f.witnesses.map((p) => p.name).join(", ");
    default:
      return "";
  }
}

/** An amount written as a currency sign and bare digits ("₩3000000") with its thousands separated
 * ("₩3,000,000"). Only after a sign, so years and other numbers are left alone. */
export function withSeparators(text: string, locale?: string): string {
  return text.replace(/([₩₱£$€])\s?(\d{4,})(?![\d.,])/g, (_, sign: string, digits: string) => sign + new Intl.NumberFormat(locale).format(Number(digits)));
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
      rows.push({ detail, label, value: withSeparators(said.join(" · "), "en"), state: "filled" });
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
