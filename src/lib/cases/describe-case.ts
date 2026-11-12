import type { NewCase } from "./api";
import { guessAreas } from "./use-intake-chat";
import type { CaseArea, UkJurisdiction } from "@/lib/types";

const TITLE_MAX = 150;
// Mirrors ilovelawyer-api's OTHER_CASE_AREA constant: the safe "don't know yet" default when the
// first message points to no area on the list (or the list hasn't loaded), for the AI to correct.
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

// Only strong signals: a UK country's name or a large city that sits in just one part of the UK.
// Never an adjective ("Scottish", "Welsh": a Scottish client can live in London) or a name found in
// more than one part of the UK (Newcastle). "New England" and "New South Wales" aren't the UK.
const REGION_SIGNALS: [RegExp, UkJurisdiction][] = [
  [/\b(?:northern ireland|belfast|derry|londonderry|lisburn)\b/i, "Northern Ireland"],
  [/\b(?:scotland|edinburgh|glasgow|aberdeen|dundee|inverness)\b/i, "Scotland"],
  [
    /(?<!\bnew )\bengland\b|(?<!\bnew south )\bwales\b|\b(?:london|manchester|birmingham|leeds|liverpool|bristol|sheffield|nottingham|leicester|coventry|bradford|cardiff|swansea|newport)\b/i,
    "England and Wales",
  ],
];

/**
 * The part of the UK a first message names, or null. Null as well when it names more than one
 * ("moved from Glasgow to London"): the AI or the client settles it then. Never outside the UK —
 * only the client's own choice says that.
 */
export function regionFromDescription(text: string): UkJurisdiction | null {
  const named = REGION_SIGNALS.filter(([re]) => re.test(text)).map(([, region]) => region);
  return named.length === 1 ? named[0] : null;
}

/** What submitting the client's first free-text message creates — a placeholder case that
 * chat-wonder's create_case tool fills in for real once that text runs as the first message. Its
 * type of issue is what the message plainly points to among `areas` (the site's list, the same
 * guess the scripted intake makes), "Other" when nothing does or the list isn't loaded yet; its
 * part of the UK is "not known yet" unless the message plainly names one (#973). */
export function describeCasePayload(text: string, areas: CaseArea[] = []): NewCase {
  const guessed = guessAreas(text, areas).map((a) => a.code);
  return {
    title: titleFromDescription(text),
    areas: guessed.length ? guessed : [PLACEHOLDER_CASE_AREA],
    ukJurisdiction: regionFromDescription(text),
    outsideUk: false,
    where: "",
    side: null,
    others: [],
  };
}
