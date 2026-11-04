"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useCaseAreasQuery } from "@/lib/cases/case-areas";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { type IntakeDraft, useIntakeChat } from "@/lib/cases/use-intake-chat";
import { useDictation } from "@/lib/voice/use-dictation";
import type { CaseRegion } from "@/lib/types";
import { UK_JURISDICTIONS } from "@/lib/types";
import { useFileDrop } from "@/lib/use-file-drop";
import { clearSearchText, readSearchText } from "@/lib/marketing/search-prefill";

export type IntakeChatProps = {
  hasDraft: boolean;
  creating: boolean;
  error: string;
  /** The client's very first message — goes straight to the real case, no scripted Q&A first.
   * Also what a spoken first message becomes once transcribed — there's no separate voice path. */
  onFirstMessage: (text: string, files: File[]) => void;
  onCreate: (draft: IntakeDraft, files: File[]) => void;
  onEditDetails: (draft: IntakeDraft, files: File[]) => void;
  onUseForm: () => void;
  /** The phone's header, where the Check step puts its Edit and Create icons. */
  headerSlot?: HTMLElement | null;
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
export function useIntakeController({ onFirstMessage }: Pick<IntakeChatProps, "onFirstMessage">) {
  const areasQuery = useCaseAreasQuery();
  const areas = areasQuery.data ?? [];
  const chat = useIntakeChat({ areas });
  const { messages, step, typing, files, draft } = chat;
  const { data: limits } = useLimitsQuery();

  // Starts with what they typed into the landing page's search, to edit before sending. Read here
  // and cleared after mount, so it lands once and a render that never commits can't lose it.
  const [text, setText] = useState(() => readSearchText() ?? "");
  useEffect(() => {
    clearSearchText();
  }, []);
  const empty = messages.length === 0;
  // The mic (shown only on the empty, pre-first-message screen) records, transcribes, and sends
  // straight away — a spoken first message goes to onFirstMessage exactly like a typed one, never
  // into `chat`'s own scripted Q&A.
  const recorder = useDictation({ onText: (text) => submitFirst(text) });
  const [rejected, setRejected] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the conversation itself: scrollIntoView also scrolls every ancestor, including the page,
    // which is what let the whole screen be dragged past its bottom into blank space.
    const log = endRef.current?.closest<HTMLElement>('[role="log"]');
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.length, typing, step]);

  // A plain first message goes straight to the real case, not a scripted back-and-forth that's just
  // the form wearing chat bubbles. With documents attached nothing is created yet: the chat probes
  // for what a case needs first, and the files go up when the case is created from the check card.
  function submitFirst(raw: string) {
    if (files.length === 0) {
      onFirstMessage(raw, files);
      return;
    }
    chat.submitText(raw);
    setText("");
  }

  // Documents alone are enough to start: the chat then asks what happened.
  const filesOnly = empty && files.length > 0 && !text.trim();
  // On the documents question, the files are the answer, so sending them is the same as Continue.
  const filesAnswer = step === "more" && files.length > 0 && !text.trim();
  const canSend = (!!text.trim() || filesOnly || filesAnswer) && !typing;

  const send = () => {
    if (!canSend) return;
    if (filesOnly) {
      chat.submitFiles();
      return;
    }
    if (filesAnswer) {
      chat.confirmFiles();
      return;
    }
    if (empty) {
      submitFirst(text);
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

  // Open on the first screen too: files picked before the first message are uploaded to the case
  // once it is created (see onFirstMessage in cases/new/page.tsx).
  const canAttach = empty || step === "more" || step === "check";

  // Dropping files anywhere on the chat attaches them, wherever the paperclip would.
  const { dragging, dragProps } = useFileDrop(addFiles, !canAttach);

  const choiceStep = step === "type" || step === "region" || step === "side";
  const placeholder = choiceStep ? PLACEHOLDER.choice : PLACEHOLDER[step];
  const areaNames = draft.areas
    .map((c) => areas.find((a) => a.code === c)?.name)
    .filter(Boolean)
    .join(", ");
  const titleMissing = !draft.title.trim();

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
    canSend,
    onKey,
    addFiles,
    choiceStep,
    placeholder,
    areaNames,
    titleMissing,
    canAttach,
    dragging,
    dragProps,
    empty,
  };
}
