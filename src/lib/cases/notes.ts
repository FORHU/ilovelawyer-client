// The two optional questions in the new-case wizard ("what happened", "what you want") are kept
// together in the API's Case.notes, one labelled paragraph each, so the edit form can split them
// again. Anything the client wrote that doesn't follow this shape lands in `happened`.

const HAPPENED = "What happened:";
const WANTS = "What I want:";

export interface IntakeNotes {
  happened: string;
  wants: string;
}

export function composeNotes({ happened, wants }: IntakeNotes): string {
  const parts: string[] = [];
  if (happened.trim()) parts.push(`${HAPPENED} ${happened.trim()}`);
  if (wants.trim()) parts.push(`${WANTS} ${wants.trim()}`);
  return parts.join("\n\n");
}

export function parseNotes(notes: string): IntakeNotes {
  const text = notes.trim();
  if (!text) return { happened: "", wants: "" };
  const at = text.indexOf(WANTS);
  const before = at === -1 ? text : text.slice(0, at);
  const wants = at === -1 ? "" : text.slice(at + WANTS.length);
  return { happened: before.replace(HAPPENED, "").trim(), wants: wants.trim() };
}

/** Per field, in step with the API's CLIENT_CASE_NOTES_MAX_LENGTH (2000) across both. */
export const NOTES_FIELD_MAX = 900;
