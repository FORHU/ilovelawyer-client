"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import {
  useCancelMessageMutation,
  useDeleteMessageMutation,
  useIntakeQuery,
  useMessagesQuery,
  useSendMessageMutation,
  useUploadDocumentsMutation,
} from "@/lib/cases/queries";
import { canDeleteMessage, pendingTurnId, stopNotice } from "@/lib/cases/chat-actions";
import { useDictation } from "@/lib/voice/use-dictation";
import { useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { useSocketConnected } from "@/lib/socket";
import type { Case, ChatMessage } from "@/lib/types";

export const PROMPTS = [
  "Tell you what happened",
  "Add a date or event",
  "Add someone involved",
  "I have a question for a lawyer",
];

/** Up to this many of the case's own documents can go with one message (the API's own cap). */
const MAX_ATTACHED_DOCUMENTS = 5;

/** Everything the Interview chat does, shared by its desktop and mobile views: messages, sending,
 * attachments, voice messages and credits. The views only decide how it is laid out. */
export function useConsultation(c: Case) {
  const credits = c.credits;
  const { data: openRequest } = useOpenLawyerRequestQuery(c.id);
  const { data, error: loadError } = useMessagesQuery(c.id);
  const { data: intake } = useIntakeQuery(c.id, c.documents.some((d) => d.status === "PENDING"));
  const sendMessage = useSendMessageMutation(c.id);
  const upload = useUploadDocumentsMutation(c.id);
  const cancel = useCancelMessageMutation(c.id);
  const remove = useDeleteMessageMutation(c.id);
  // The reply arrives over the socket, so while it's down the wait is the connection's, not the AI's.
  const connected = useSocketConnected();

  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [attachedIds, setAttachedIds] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  // The message asking "delete this?" — one at a time.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The mic records, transcribes, and sends straight away as a normal text message — no audio
  // message, no editable review step, no AI voice reply (there's no voice turn to reply to).
  const recorder = useDictation({ onText: (text) => send(text) });

  const messages = data?.messages ?? [];
  const documentById = new Map(c.documents.map((d) => [d.id, d]));
  const thinking = sendMessage.isPending || !!data?.replying;
  const out = credits <= 0;
  const lastFailed = messages.at(-1)?.replyStatus === "FAILED";
  const latestAnswer = messages.findLast((m) => m.role === "ai");
  // Just after Send, before the API's message is in the list, there's nothing to stop yet. One press
  // per answer: after it succeeds the button stays off until the refetch drops `thinking` (send()
  // resets it for the next answer).
  const pendingId = pendingTurnId(messages);
  const canStop = thinking && !!pendingId && !cancel.isPending && !cancel.isSuccess;
  const missing = intake?.missing.length ?? 0;
  // A just-dropped/pasted file is attached right away but may still be reading; sending before
  // that finishes would just bounce off the API's READY check.
  const attachmentPending = attachedIds.some((id) => documentById.get(id)?.status === "PENDING");
  // A document whose extraction ends FAILED can never become READY — excluded from what's
  // actually sent (rather than blocking Send and "Uploading…" forever), but still shown as its
  // own removable chip so it isn't just silently dropped with no explanation. Derived at render
  // time, not synced into state via an effect, so a chip disappears the moment its status changes
  // instead of waiting a tick.
  const failedAttachedIds = attachedIds.filter((id) => documentById.get(id)?.status === "FAILED");
  const sendableAttachedIds = attachedIds.filter((id) => !failedAttachedIds.includes(id));

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, thinking]);

  // Grows with what's typed, up to a cap (then scrolls inside itself) — so a long message stays
  // readable instead of scrolling sideways in a single line.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const removeAttached = (id: string) => setAttachedIds((prev) => prev.filter((x) => x !== id));

  const send = (raw: string) => {
    const text = raw.trim();
    if ((!text && sendableAttachedIds.length === 0) || thinking || credits <= 0 || attachmentPending) return;
    const documentIds = sendableAttachedIds;
    // Restored in full on error below, including a failed attachment that was still showing as
    // its own chip — not just what was actually sendable.
    const allAttachedIds = attachedIds;
    // Dropping/pasting a file in with nothing typed still needs something for the API to accept
    // (it requires non-empty text) and for the AI to read. This must not read as something the
    // client said — it ends up verbatim in the transcript, the lawyer brief and the intake
    // extraction as a quote, so it names the actual files rather than putting words in anyone's
    // mouth ("Here's a document." reads exactly like the client wrote it).
    const body =
      text ||
      `[Attached: ${documentIds
        .map((id) => documentById.get(id)?.name ?? "a document")
        .join(", ")}]`;
    setInput("");
    setNotice("");
    setAttachedIds([]);
    cancel.reset();
    sendMessage.mutate(
      { text: body, documentIds: documentIds.length ? documentIds : undefined },
      {
        onError: (err) => {
          setInput(text);
          setAttachedIds(allAttachedIds);
          setNotice(err instanceof Error ? err.message : "Couldn't send that. Try again.");
        },
      },
    );
  };

  /** The Stop button: the API keeps what was written and gives the credit back. */
  const stop = () => {
    if (!pendingId || cancel.isPending) return;
    setNotice("");
    cancel.mutate(pendingId, {
      onSuccess: (res) => setNotice(stopNotice(res)),
      onError: (err) => setNotice(err instanceof Error ? err.message : "Couldn't stop it. Try again."),
    });
  };

  const removeMessage = (id: string) => {
    setNotice("");
    remove.mutate(id, {
      onSuccess: () => setConfirmingId(null),
      onError: (err) => {
        setConfirmingId(null);
        setNotice(err instanceof Error ? err.message : "Couldn't delete that. Try again.");
      },
    });
  };

  const canDelete = (m: ChatMessage) => canDeleteMessage(m, thinking);

  const attach = (files: File[]) => {
    if (!files.length) return;
    setNotice("");
    upload.mutate(files, {
      onSuccess: ({ added, failed }) => {
        const parts: string[] = [];
        if (added.length) {
          const one = added.length === 1;
          parts.push(`Added ${added.map((d) => d.name).join(", ")}. The AI will use ${one ? "it" : "them"} once ${one ? "it's" : "they're"} read.`);
          // Attached and ready to send without an extra click — up to the existing cap.
          setAttachedIds((prev) => [...new Set([...prev, ...added.map((d) => d.id)])].slice(0, MAX_ATTACHED_DOCUMENTS));
        }
        if (failed.length) parts.push(failed.map((f) => f.reason).join(" "));
        setNotice(parts.join(" "));
      },
    });
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (out) return;
    attach(Array.from(e.dataTransfer.files ?? []));
  };

  const onDragEnter = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (out || !e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragging(false);
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData?.items ?? [])
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (!files.length || out) return;
    e.preventDefault();
    attach(files);
  };

  return {
    credits, openRequest, loadError, sendMessage, upload, connected,
    input, setInput, notice, attachedIds, dragging, scroller, textareaRef, recorder,
    messages, documentById, thinking, out, lastFailed, latestAnswer, missing,
    attachmentPending, failedAttachedIds, sendableAttachedIds,
    removeAttached, send, attach, onDrop, onDragEnter, onDragLeave, onPaste,
    stop, canStop,
    confirmingId, setConfirmingId, removeMessage, deleting: remove.isPending, canDelete,
  };
}

/** The Interview chat, held above the per-device views so a device flip (a phone turned sideways)
 * keeps what was typed. Each view gets it as `consultation`. */
export type Consultation = ReturnType<typeof useConsultation>;
