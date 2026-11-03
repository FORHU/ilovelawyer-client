"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useCaseAreasQuery } from "@/lib/cases/case-areas";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { type IntakeDraft, useIntakeChat } from "@/lib/cases/use-intake-chat";
import { useVoiceRecorder } from "@/lib/cases/voice-recorder";
import type { CaseRegion } from "@/lib/types";
import { UK_JURISDICTIONS } from "@/lib/types";

export type IntakeChatProps = {
  hasDraft: boolean;
  creating: boolean;
  error: string;
  /** The client's very first message — goes straight to the real case, no scripted Q&A first. */
  onFirstMessage: (text: string, files: File[]) => void;
  /** Same, but the first message is a recording instead of typed text — sent as a voice message
   * to the newly created case, same pipeline an existing case's Interview tab uses (the reply
   * comes back with its own playable audio, not just a transcript). */
  onFirstVoiceMessage: (blob: Blob) => void;
  onCreate: (draft: IntakeDraft, files: File[]) => void;
  onEditDetails: (draft: IntakeDraft, files: File[]) => void;
  onUseForm: () => void;
};

/** The conversation, held above the per-device views so a device flip (a phone turned sideways)
 * keeps it. Each view gets it as `controller`. */
export type IntakeController = ReturnType<typeof useIntakeController>;
export type IntakeViewProps = IntakeChatProps & { controller: IntakeController };

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
 * conversation (use-intake-chat), the composer's text, voice recording, attachments and what to
 * show for the current step. The views only decide how it is laid out. */
export function useIntakeController({ onFirstMessage, onFirstVoiceMessage }: Pick<IntakeChatProps, "onFirstMessage" | "onFirstVoiceMessage">) {
  const areasQuery = useCaseAreasQuery();
  const areas = areasQuery.data ?? [];
  const chat = useIntakeChat({ areas });
  const { messages, step, typing, files, draft } = chat;
  const { data: limits } = useLimitsQuery();

  const [text, setText] = useState("");
  const empty = messages.length === 0;
  // The very first message records and sends straight away, no editable transcription step — it
  // goes to onFirstVoiceMessage below, never into `chat`'s own scripted Q&A.
  const recorder = useVoiceRecorder(onFirstVoiceMessage);
  const [rejected, setRejected] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing, step]);

  const send = () => {
    if (!text.trim() || typing) return;
    // The first message is the whole point: go straight to the real case, not a scripted
    // back-and-forth that's just the form wearing chat bubbles.
    if (empty) {
      onFirstMessage(text, files);
      return;
    }
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
    recorder,
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
