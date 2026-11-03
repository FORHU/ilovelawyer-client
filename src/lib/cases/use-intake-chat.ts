"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseArea, CaseRegion, OtherParty, Side } from "@/lib/types";

// The AI intake is scripted for now: there is no endpoint yet for a chat before a case exists, or
// for the AI to fill the case from what was said. This hook is the seam. Swap its `say` calls for
// the real replies and the screen (components/cases/intake-chat.tsx) doesn't change.

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

// Words that suggest a kind of issue, matched against the admin-managed area names.
const AREA_HINTS: [RegExp, RegExp][] = [
  [/\b(job|fired|dismiss|redundan|employer|work|boss|wage|salary)/i, /employ/i],
  [/\b(landlord|rent|tenan|evict|flat|house|mortgage|property|neighbour)/i, /property|housing|landlord/i],
  [/\b(divorce|custody|child|partner|marriage|separat)/i, /family/i],
  [/\b(refund|faulty|shop|bought|supplier|scam|owes? me|invoice|contract)/i, /consumer|contract|debt/i],
  [/\b(visa|immigra|asylum|leave to remain|deport)/i, /immigra/i],
  [/\b(police|arrest|charged|court|fine|prosecut)/i, /crimin/i],
  [/\b(will|probate|inherit|estate|died)/i, /will|probate/i],
  [/\b(defam|libel|slander|privacy|online abuse|harass)/i, /reputation|privacy|defam/i],
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

/** A short working name from the first thing said: its first sentence, trimmed. */
export function titleFrom(text: string): string {
  const first = text.trim().split(/(?<=[.!?])\s|\n/)[0] ?? "";
  const clean = first.replace(/[.!?]+$/, "").trim();
  if (clean.length <= TITLE_MAX) return clean;
  return `${clean.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

const SIDE_Q = "Which side are you on?";
const OTHERS_Q = "Is anyone else involved, like an employer, a landlord or a company? Type a name, or skip.";
const WANT_Q =
  "What would you like to come of it? For example, your job back or money you're owed. Type it below, or skip.";

const names = (codes: string[], areas: CaseArea[]) =>
  codes.map((c) => areas.find((a) => a.code === c)?.name).filter(Boolean) as string[];

export function useIntakeChat({ areas }: { areas: CaseArea[] }) {
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [step, setStep] = useState<IntakeStep>("start");
  const [typing, setTyping] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [draft, setDraft] = useState<IntakeDraft>({
    title: "",
    happened: "",
    wants: "",
    areas: [],
    region: "",
    where: "",
    side: "",
    others: [],
  });

  const nextId = useRef(1);
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
      push("ai", text);
      setStep(next);
      setTyping(false);
    }, TYPING_MS);
  }, []);

  const patchDraft = (patch: Partial<IntakeDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const choose = "Please choose one of the options below.";

  const submitText = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    push("user", text);

    switch (step) {
      case "start": {
        const guess = guessAreas(text, areas);
        setDraft((d) => ({
          ...d,
          happened: text,
          title: d.title || titleFrom(text),
          areas: guess.map((a) => a.code),
        }));
        say(
          guess.length
            ? `Thanks, and I'm sorry you're dealing with this. It sounds like this might be about ${guess.map((a) => a.name).join(" and ")}. Which of these fits? You can pick more than one.`
            : "Thanks, and I'm sorry you're dealing with this. Which of these best describes it? You can pick more than one.",
          "type",
        );
        break;
      }
      case "where":
        patchDraft({ where: text });
        say(SIDE_Q, "side");
        break;
      case "others":
        setDraft((d) => ({
          ...d,
          others: [...d.others, { id: `o${Date.now()}`, name: text, role: "Opposing party" }],
        }));
        say("Added. Is anyone else involved? Type another name, or press Done.", "others");
        break;
      case "want":
        patchDraft({ wants: text });
        say("Do you have any documents, like a contract or messages? Use the paperclip to add files, or skip.", "more");
        break;
      case "more":
        patchDraft({ happened: `${draft.happened}\n\n${text}`.trim() });
        say("I've added that. Check the details below, then create your case.", "check");
        break;
      case "check":
        patchDraft({ happened: `${draft.happened}\n\n${text}`.trim() });
        say("I've added that. Check the details below, then create your case.", "check");
        break;
      default:
        say(choose, step);
    }
  };

  const toggleArea = (code: string) =>
    setDraft((d) => ({
      ...d,
      areas: d.areas.includes(code) ? d.areas.filter((c) => c !== code) : [...d.areas, code],
    }));

  const confirmAreas = () => {
    if (typing || draft.areas.length === 0) return;
    push("user", names(draft.areas, areas).join(", "));
    say("Which part of the UK is this in?", "region");
  };

  const chooseRegion = (region: CaseRegion, label: string) => {
    if (typing) return;
    push("user", label);
    patchDraft({ region });
    say("Which town or city was this in? Type it below, or skip.", "where");
  };

  const chooseSide = (side: Side, label: string) => {
    if (typing) return;
    push("user", label);
    patchDraft({ side });
    say(OTHERS_Q, "others");
  };

  /** Skips the optional questions (what you want, documents). */
  const skip = () => {
    if (typing) return;
    push("user", step === "others" ? "Done" : "Skip");
    if (step === "where") {
      say(SIDE_Q, "side");
    } else if (step === "others") {
      say(WANT_Q, "want");
    } else if (step === "want") {
      say("Do you have any documents, like a contract or messages? Use the paperclip to add files, or skip.", "more");
    } else {
      say("Thanks, that's what I need for now. Please check your case below. Nothing is created until you press Create case.", "check");
    }
  };

  /** Done with documents (or none): on to the check card. */
  const confirmFiles = () => {
    if (typing) return;
    push("user", files.length ? `${files.length} ${files.length === 1 ? "file" : "files"} attached` : "No documents");
    say("Thanks, that's what I need for now. Please check your case below. Nothing is created until you press Create case.", "check");
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
    addFiles,
    removeFile,
    patchDraft,
  };
}
