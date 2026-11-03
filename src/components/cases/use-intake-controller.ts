"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useCaseAreasQuery } from "@/lib/cases/case-areas";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { type IntakeDraft, useIntakeChat } from "@/lib/cases/use-intake-chat";
import { useDictation } from "@/lib/voice/use-dictation";
import type { CaseRegion } from "@/lib/types";
import { UK_JURISDICTIONS } from "@/lib/types";

export type IntakeChatProps = {
  hasDraft: boolean;
  creating: boolean;
  error: string;
  onCreate: (draft: IntakeDraft, files: File[]) => void;
  onEditDetails: (draft: IntakeDraft, files: File[]) => void;
  onUseForm: () => void;
};

export const REGIONS: { value: CaseRegion; label: string }[] = [
  ...UK_JURISDICTIONS.map((j) => ({ value: j, label: j })),
  { value: "OUTSIDE_UK", label: "Outside the UK" },
];

export const STARTERS = ["I lost my job", "A problem with my landlord", "Someone owes me money"];

const PLACEHOLDER = {
  start: "Tell me what's going on…",
  want: "Type your answer…",
  where: "Type a town or city…",
  others: "Type a name or company…",
  more: "Add anything else…",
  check: "Add anything else…",
  choice: "Choose an option above",
} as const;

/** Everything the case-creation chat does, shared by its desktop and mobile views: the
 * conversation (use-intake-chat), the composer's text, dictation, attachments and what to show
 * for the current step. The views only decide how it is laid out. */
export function useIntakeController() {
  const areasQuery = useCaseAreasQuery();
  const areas = areasQuery.data ?? [];
  const chat = useIntakeChat({ areas });
  const { messages, step, typing, files, draft } = chat;
  const { data: limits } = useLimitsQuery();

  const [text, setText] = useState("");
  // Spoken words land in the box, after anything already typed, to be edited before sending.
  const voice = useDictation({ onText: (spoken) => setText((t) => (t.trim() ? `${t.trim()} ${spoken}` : spoken)) });
  const [rejected, setRejected] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing, step]);

  const send = () => {
    if (!text.trim() || typing) return;
    chat.submitText(text);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const addFiles = (picked: File[]) => {
    const { accepted, rejected: turnedAway } = checkFiles(picked, limits);
    setRejected(turnedAway);
    if (accepted.length) chat.addFiles(accepted);
  };

  const choiceStep = step === "type" || step === "region" || step === "side";
  const placeholder = choiceStep ? PLACEHOLDER.choice : PLACEHOLDER[step];
  const areaNames = draft.areas
    .map((c) => areas.find((a) => a.code === c)?.name)
    .filter(Boolean)
    .join(", ");
  const titleMissing = !draft.title.trim();
  const canAttach = step === "more" || step === "check";
  const empty = messages.length === 0;

  // Grows with what's typed, up to a cap, like the composers people already know.
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text, empty]);

  return {
    areasQuery,
    areas,
    chat,
    messages,
    step,
    typing,
    files,
    draft,
    text,
    setText,
    voice,
    rejected,
    endRef,
    box,
    send,
    onKey,
    addFiles,
    choiceStep,
    placeholder,
    areaNames,
    titleMissing,
    canAttach,
    empty,
  };
}
