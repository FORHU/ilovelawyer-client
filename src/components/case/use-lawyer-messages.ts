"use client";

import { useEffect, useRef, useState } from "react";
import { useEngagementMessagesQuery, useMarkEngagementMessagesReadMutation, usePostEngagementMessageMutation } from "@/lib/lawyer-requests/messages";

export const MESSAGE_MAX_LENGTH = 5000;

/** The thread with one lawyer, shared by its desktop and mobile views: the messages, the draft, and
 * sending. Seeing the thread marks it read; `markReadWhen` says when it is being seen (always on a
 * desktop, where the thread is on the page; on a phone, once the full screen is open, so the badge
 * isn't cleared by messages nobody has looked at). */
export function useLawyerMessages({ requestId, claimId, markReadWhen = true }: { requestId: string; claimId?: string; markReadWhen?: boolean }) {
  const thread = useEngagementMessagesQuery(requestId, claimId);
  const post = usePostEngagementMessageMutation(requestId, claimId);
  const { mutate: markRead, isPending: marking } = useMarkEngagementMessagesReadMutation(requestId, claimId);
  const [draft, setDraft] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const messages = thread.data?.data ?? [];
  const unread = thread.data?.unread ?? 0;

  useEffect(() => {
    if (markReadWhen && unread > 0 && !marking) markRead();
  }, [markReadWhen, unread, marking, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function send(e?: { preventDefault: () => void }) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body && !documentId) return;
    setError("");
    post.mutate(
      { ...(body ? { body } : {}), ...(documentId ? { documentId } : {}) },
      {
        onSuccess: () => {
          setDraft("");
          setDocumentId("");
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Couldn't send your message. Try again."),
      },
    );
  }

  return { thread, messages, unread, post, draft, setDraft, documentId, setDocumentId, error, endRef, send };
}
