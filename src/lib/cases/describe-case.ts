import type { NewCase } from "./api";

const TITLE_MAX = 150;
// Mirrors ilovelawyer-api's OTHER_CASE_AREA constant — a literal here since this page never
// needs the full area list, just a safe "don't know yet" default the AI corrects right after.
const PLACEHOLDER_CASE_AREA = "OTHER";

/** A short title for a case the client described in free text, not picked from a form. */
export function titleFromDescription(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "New case";
  if (trimmed.length <= TITLE_MAX) return trimmed;
  const cut = trimmed.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

/** What submitting the client's first free-text message creates — a placeholder case that
 * chat-wonder's create_case tool fills in for real once that text runs as the first message. */
export function describeCasePayload(text: string): NewCase {
  return {
    title: titleFromDescription(text),
    areas: [PLACEHOLDER_CASE_AREA],
    ukJurisdiction: null,
    where: "",
    side: null,
    others: [],
  };
}
