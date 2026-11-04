"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseArea, CaseRegion, OtherParty, Side } from "@/lib/types";

// The Case Creation Chat gathers what the manual form asks for (title, type of issue, region, town,
// side, other people, what happened / what they want, documents), no more. The deeper fact-finding
// is the Interview's job once the case exists.
//
// There is no endpoint yet for an AI chat before a case exists, so the "assistant" here is a
// slot-filler: it reads each message for any of the form's fields, skips what it already has, and
// asks the next thing that's missing. `absorb` + `nextStep` are the seam: a backend extractor can
// replace them and the screen (components/cases/intake-chat.tsx) doesn't change.

export type IntakeStep = "start" | "type" | "region" | "where" | "side" | "others" | "want" | "more" | "check";

export interface IntakeMessage {
  id: number;
  role: "ai" | "user";
  text: string;
}

/** What the chat has gathered, in the same shape the wizard asks for. */
export interface IntakeDraft {
  title: string;
  happened: string;
  wants: string;
  /** Case area codes. */
  areas: string[];
  region: CaseRegion | "";
  where: string;
  side: Side;
  others: OtherParty[];
}

const TYPING_MS = 700;
const TITLE_MAX = 150;
const WHERE_MAX = 80;

const EMPTY: IntakeDraft = { title: "", happened: "", wants: "", areas: [], region: "", where: "", side: "", others: [] };

// ---- Reading a message -------------------------------------------------------------------------

// Words that suggest a kind of issue, matched against the admin-managed area names.
const AREA_HINTS: [RegExp, RegExp][] = [
  // Only words that mean the kind of issue on their own: not "work", "contract" or "will", which are
  // everyday words ("the machine doesn't work", "my landlord will not...").
  [/\b(job|fired|dismiss\w*|redundan\w*|employer|boss|wage|salary|sacked|unfair dismissal|work(?:ed|ing)? for)\b/i, /employ/i],
  [/\b(landlord|rent|tenan\w*|evict\w*|flat|house|mortgage|property|neighbou?r)\b/i, /property|housing|landlord/i],
  [/\b(divorce|custody|child|children|partner|marriage|separat\w*)\b/i, /family/i],
  [/\b(refund|faulty|shop|bought|supplier|scam\w*|owes? me|invoice|breach of contract)\b/i, /consumer|contract|debt/i],
  [/\b(visa|immigra\w*|asylum|leave to remain|deport\w*)\b/i, /immigra/i],
  [/\b(police|arrest\w*|charged|prosecut\w*)\b/i, /crimin/i],
  [/\b(?:(?:a|my|his|her|their|the late \w+'s) will|probate|inherit\w*|executor|died|passed away|deceased)\b/i, /will|probate/i],
  [/\b(defam\w*|libel|slander|privacy|online abuse|harass\w*)\b/i, /reputation|privacy|defam/i],
];

export function guessAreas(text: string, areas: CaseArea[]): CaseArea[] {
  const found: CaseArea[] = [];
  for (const [words, name] of AREA_HINTS) {
    if (!words.test(text)) continue;
    const area = areas.find((a) => name.test(a.name));
    if (area && !found.includes(area)) found.push(area);
  }
  return found;
}

const REGION_RULES: [RegExp, CaseRegion][] = [
  [/\bnorthern ireland\b|\bbelfast\b|\bulster\b/i, "Northern Ireland"],
  [/\bscotland\b|\bscottish\b|\bedinburgh\b|\bglasgow\b|\baberdeen\b/i, "Scotland"],
  [/\boutside (?:of )?(?:the )?uk\b|\babroad\b|\boverseas\b/i, "OUTSIDE_UK"],
  [
    /\bengland\b|\bwales\b|\bwelsh\b|\bcardiff\b|\bswansea\b|\blondon\b|\bmanchester\b|\bbirmingham\b|\bleeds\b|\bliverpool\b|\bbristol\b|\bsheffield\b|\bnewcastle\b|\bnottingham\b/i,
    "England and Wales",
  ],
];

export function guessRegion(text: string): CaseRegion | "" {
  return REGION_RULES.find(([re]) => re.test(text))?.[1] ?? "";
}

const NOT_A_PLACE = /^(?:i|my|the|a|an|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|england|wales|scotland|northern|the uk|uk)$/i;

/** "I live in Leeds" → "Leeds". Only a capitalised word after in / near / based in. */
function guessWhere(text: string): string {
  const m = /\b(?:in|near|based in|living in|live in)\s+([A-Z][\p{L}'-]+(?:\s[A-Z][\p{L}'-]+)?)/u.exec(text);
  const place = m?.[1]?.trim() ?? "";
  return place && !NOT_A_PLACE.test(place) ? place : "";
}

const RESPONDENT = /\b(sued|claim against me|against me|taking me to court|accused me|accused of|served me|charged with)\b/i;
const CLAIMANT =
  /\b(i (?:was|got|have been|am being) (?:fired|dismissed|sacked|made redundant|evicted|cheated|scammed|ignored)|owes? me|refus\w* to (?:refund|pay|return)|want to (?:sue|claim|complain)|i(?:'m| am) (?:making|bringing) a (?:claim|complaint))\b/i;

function guessSide(text: string): Side {
  if (RESPONDENT.test(text)) return "RESPONDENT";
  if (CLAIMANT.test(text)) return "CLAIMANT";
  return "";
}

/**
 * "my employer Acme Ltd" / "Against Acme Ltd I…" → "Acme Ltd". Only the lead-in words may be
 * capitalised (a sentence can start with them); the name still has to start with a capital.
 */
function guessOthers(text: string): string[] {
  const re =
    /\b(?:[Mm]y (?:employer|landlord|boss|ex[- ]?partner|neighbou?r|supplier|letting agent)|[Aa]gainst|[Ss]ued by)\s+(?:is |called |named )?([A-Z][\p{L}&'.-]*(?:\s+(?!I\b)[A-Z][\p{L}&'.-]*){0,3})/gu;
  return [...text.matchAll(re)].map((m) => m[1]?.replace(/[.'-]+$/, "").trim() ?? "").filter(Boolean);
}

/** An answer to "Is anyone else involved?" that names nobody. */
const NO_ONE = /^\s*(?:no(?:pe| one| body)?|none|nobody|nothing|n\/?a|not really)\s*[.!]?\s*$/i;

/** "I want my job back." → the whole sentence. */
function guessWants(text: string): string {
  const m = /(?:^|[.!?]\s+)((?:i(?: want| would like|['’]d like| hope| need)|i(?:['’]m| am) hoping|i(?:['’]m| am) looking)[^.!?\n]*)/i.exec(text);
  return m?.[1]?.trim() ?? "";
}

/** A short working name from the first thing said: its first sentence, trimmed. */
export function titleFrom(text: string): string {
  const first = text.trim().split(/(?<=[.!?])\s|\n/)[0] ?? "";
  const clean = first.replace(/[.!?]+$/, "").trim();
  if (clean.length <= TITLE_MAX) return clean;
  return `${clean.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

const SIDE_SHORT: Record<string, string> = { CLAIMANT: "bringing the complaint", RESPONDENT: "responding to one" };

function addOthers(d: IntakeDraft, names: string[]): IntakeDraft {
  const have = new Set(d.others.map((o) => o.name.toLowerCase()));
  const fresh = names.filter((n) => !have.has(n.toLowerCase()));
  if (!fresh.length) return d;
  return {
    ...d,
    others: [...d.others, ...fresh.map((name, i) => ({ id: `o${Date.now()}${i}`, name, role: "Opposing party" as const }))],
  };
}

/**
 * Reads one message for anything the form asks, filling only what is still empty (never
 * overwriting an answer already given). Returns the new draft and a note of what it picked up.
 */
function absorb(text: string, d: IntakeDraft, areas: CaseArea[], areasConfirmed: boolean): { draft: IntakeDraft; got: string[] } {
  const got: string[] = [];
  let next = d;

  // The type of issue is a guess until the client confirms it, so a later, clearer message revises it.
  if (!next.areas.length || !areasConfirmed) {
    const guess = guessAreas(text, areas);
    if (guess.length && guess.map((a) => a.code).join() !== next.areas.join()) {
      next = { ...next, areas: guess.map((a) => a.code) };
      got.push(guess.map((a) => a.name).join(" and "));
    }
  }
  if (!next.region) {
    const region = guessRegion(text);
    if (region) {
      next = { ...next, region };
      got.push(region === "OUTSIDE_UK" ? "outside the UK" : region);
    }
  }
  if (!next.where) {
    const where = guessWhere(text);
    if (where) {
      next = { ...next, where: where.slice(0, WHERE_MAX) };
      got.push(where);
    }
  }
  if (!next.side) {
    const side = guessSide(text);
    if (side) {
      next = { ...next, side };
      got.push(`you're ${SIDE_SHORT[side]}`);
    }
  }
  const people = guessOthers(text);
  const before = next.others.length;
  next = addOthers(next, people);
  if (next.others.length > before) got.push(next.others.slice(before).map((o) => o.name).join(" and "));
  if (!next.wants) {
    const wants = guessWants(text);
    if (wants) next = { ...next, wants };
  }
  return { draft: next, got };
}

// ---- Deciding what to ask ----------------------------------------------------------------------

/**
 * The next thing still missing. Required first (type, part of the UK), then each optional question
 * once, skipping any the client has already answered along the way.
 */
function nextStep(d: IntakeDraft, asked: ReadonlySet<IntakeStep>, hasFiles: boolean): IntakeStep {
  if (!asked.has("type") || !d.areas.length) return "type";
  if (!d.region) return "region";
  if (!d.where && !asked.has("where")) return "where";
  if (!d.side && !asked.has("side")) return "side";
  if (!d.others.length && !asked.has("others")) return "others";
  if (!d.wants && !asked.has("want")) return "want";
  if (!hasFiles && !asked.has("more")) return "more";
  return "check";
}

function question(step: IntakeStep, d: IntakeDraft, areas: CaseArea[]): string {
  switch (step) {
    case "type": {
      const picked = d.areas.map((c) => areas.find((a) => a.code === c)?.name).filter(Boolean);
      return picked.length
        ? `It sounds like this is about ${picked.join(" and ")}. Is that right? Change the selection if not, then press Continue.`
        : "Which of these best describes it? You can pick more than one.";
    }
    case "region":
      return "Which part of the UK is this in? The law is different in each.";
    case "where":
      return "Which town or city was this in? Type it below, or skip.";
    case "side":
      return "Which side are you on?";
    case "others":
      return "Is anyone else involved, like an employer, a landlord or a company? Type a name, or skip.";
    case "want":
      return "What would you like to come of it? For example, your job back or money you're owed. Type it below, or skip.";
    case "more":
      return "Do you have any documents, like a contract or messages? Use the paperclip to add files, or continue without.";
    case "check":
      return "That's what I need to set up your case. Please check it below. Nothing is created until you press Create case. The interview afterwards goes into the detail.";
    default:
      return "Tell me a bit more about what happened.";
  }
}

const ack = (got: string[]) => (got.length ? `Thanks, I've noted: ${got.join(", ")}. ` : "Thanks. ");

/** The conversation as it stands, to save as a draft and pick up again (lib/cases/drafts.ts). */
export interface IntakeSnapshot {
  messages: IntakeMessage[];
  step: IntakeStep;
  draft: IntakeDraft;
  asked: IntakeStep[];
}

export function useIntakeChat({ areas, initial, initialFiles }: { areas: CaseArea[]; initial?: IntakeSnapshot | null; initialFiles?: File[] }) {
  const [messages, setMessages] = useState<IntakeMessage[]>(() => initial?.messages ?? []);
  const [step, setStep] = useState<IntakeStep>(() => initial?.step ?? "start");
  const [typing, setTyping] = useState(false);
  const [files, setFiles] = useState<File[]>(() => initialFiles ?? []);
  const [draft, setDraft] = useState<IntakeDraft>(() => initial?.draft ?? EMPTY);

  const nextId = useRef(Math.max(0, ...(initial?.messages.map((m) => m.id) ?? [])) + 1);
  const asked = useRef<Set<IntakeStep>>(new Set(initial?.asked));
  const askedSteps = useCallback(() => [...asked.current], []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const push = (role: IntakeMessage["role"], text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, role, text }]);

  const say = useCallback((text: string, next: IntakeStep) => {
    setTyping(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, role: "ai", text }]);
      setStep(next);
      setTyping(false);
    }, TYPING_MS);
  }, []);

  /** Moves on to the next missing question, with `lead` in front of it. */
  const ahead = (d: IntakeDraft, lead: string, fileCount = files.length) => {
    const next = nextStep(d, asked.current, fileCount > 0);
    say(lead + question(next, d, areas), next);
  };

  const patchDraft = (patch: Partial<IntakeDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const update = (d: IntakeDraft) => {
    setDraft(d);
    return d;
  };

  const submitText = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    push("user", text);

    // Anything the message says about any field is picked up, whatever question was open.
    const { draft: read, got } = absorb(text, draft, areas, asked.current.has("type"));

    switch (step) {
      case "start": {
        const words = text.split(/\s+/).length;
        // Too thin to work with: ask for more rather than marching on to the questions.
        if (words < 4 && !got.length) {
          update({ ...draft, happened: [draft.happened, text].filter(Boolean).join("\n") });
          say("Could you tell me a bit more about what happened? A sentence or two is plenty.", "start");
          return;
        }
        // A thin first message that was kept stays in what happened, with this one after it.
        const d = update({ ...read, happened: [draft.happened, text].filter(Boolean).join("\n"), title: draft.title || titleFrom(text) });
        const lead = "Thanks, and I'm sorry you're dealing with this. ";
        ahead(d, got.length ? `${lead}I've noted: ${got.join(", ")}. ` : lead);
        return;
      }
      case "type": {
        // Typed instead of choosing: use it if it names a kind of issue.
        const guess = guessAreas(text, areas);
        if (guess.length) {
          update({ ...read, areas: [...new Set([...read.areas, ...guess.map((a) => a.code)])] });
          say(`I've selected ${guess.map((a) => a.name).join(" and ")}. Press Continue, or change it.`, "type");
        } else {
          update(read);
          say("I couldn't tell which kind of issue that is. Please choose from the options below.", "type");
        }
        return;
      }
      case "region": {
        const d = update(read);
        if (d.region) {
          ahead(d, ack(got));
        } else {
          say("I couldn't tell which part of the UK that is. Please choose one of the options below.", "region");
        }
        return;
      }
      case "where": {
        asked.current.add("where");
        const d = update({ ...read, where: read.where || text.slice(0, WHERE_MAX) });
        ahead(d, ack([d.where]));
        return;
      }
      case "side": {
        if (read.side) {
          asked.current.add("side");
          ahead(update(read), ack(got));
        } else {
          update(read);
          say("Please choose one of the options below.", "side");
        }
        return;
      }
      case "others": {
        asked.current.add("others");
        // "No one" is an answer, not a name. Split on commas and new lines only, since "and" is
        // part of names ("Marks and Spencer"), and skip what absorb already read out of the same
        // text ("my landlord John Smith" -> "John Smith").
        if (NO_ONE.test(text)) {
          ahead(update(read), "Okay. ");
          return;
        }
        const names = text
          .split(/[,;\n]/)
          .map((n) => n.trim())
          .filter((n) => n && !read.others.some((o) => n.toLowerCase().includes(o.name.toLowerCase())));
        const d = update(addOthers(read, names));
        ahead(d, ack(d.others.map((o) => o.name)));
        return;
      }
      case "want": {
        asked.current.add("want");
        const d = update({ ...read, wants: text });
        ahead(d, "Got it. ");
        return;
      }
      default: {
        // "more" and "check": more detail for the case. Added to what happened, not asked about again.
        asked.current.add("more");
        const d = update({ ...read, happened: `${draft.happened}\n\n${text}`.trim() });
        ahead(d, `${ack(got)}I've added that. `);
      }
    }
  };

  const toggleArea = (code: string) =>
    setDraft((d) => ({
      ...d,
      areas: d.areas.includes(code) ? d.areas.filter((c) => c !== code) : [...d.areas, code],
    }));

  const confirmAreas = () => {
    if (typing || draft.areas.length === 0) return;
    asked.current.add("type");
    push("user", draft.areas.map((c) => areas.find((a) => a.code === c)?.name).filter(Boolean).join(", "));
    ahead(draft, "");
  };

  const chooseRegion = (region: CaseRegion, label: string) => {
    if (typing) return;
    push("user", label);
    ahead(update({ ...draft, region }), "");
  };

  const chooseSide = (side: Side, label: string) => {
    if (typing) return;
    asked.current.add("side");
    push("user", label);
    ahead(update({ ...draft, side }), "");
  };

  /** Skips an optional question (town, other people, what you want). */
  const skip = () => {
    if (typing) return;
    push("user", step === "others" ? "Done" : "Skip");
    asked.current.add(step);
    ahead(draft, "");
  };

  /** Done with documents (or none): on to the check card. */
  const confirmFiles = () => {
    if (typing) return;
    asked.current.add("more");
    push("user", files.length ? `${files.length} ${files.length === 1 ? "file" : "files"} attached` : "No documents");
    ahead(draft, "");
  };

  /** Documents sent with nothing typed: noted as the first message, then the story is asked for. */
  const submitFiles = () => {
    if (!files.length || typing) return;
    push("user", `${files.length} ${files.length === 1 ? "file" : "files"} attached`);
    say("Thanks, I've got your documents. Could you tell me a bit about what happened?", "start");
  };

  const addFiles = (picked: File[]) => setFiles((f) => [...f, ...picked]);
  const removeFile = (index: number) => setFiles((f) => f.filter((_, i) => i !== index));

  return {
    messages,
    step,
    typing,
    files,
    draft,
    submitText,
    toggleArea,
    confirmAreas,
    chooseRegion,
    chooseSide,
    skip,
    confirmFiles,
    submitFiles,
    addFiles,
    removeFile,
    patchDraft,
    askedSteps,
  };
}
