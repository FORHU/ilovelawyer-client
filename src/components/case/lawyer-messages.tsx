"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { cn } from "@/lib/cn";
import type { EngagementMessage } from "@/lib/client-handoff";
import { formatDateTime } from "@/lib/format";
import type { Case } from "@/lib/types";
import { useEngagementMessagesQuery, useMarkEngagementMessagesReadMutation, usePostEngagementMessageMutation } from "@/lib/lawyer-requests/messages";

const MESSAGE_MAX_LENGTH = 5000;

function Message({ message }: { message: EngagementMessage }) {
  const mine = message.author.side === "CLIENT";
  return (
    <li className={cn("flex max-w-[85%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
      <span className="text-[11.5px] text-muted">
        {mine ? "You" : `${message.author.name} · Your lawyer`} · {formatDateTime(message.createdAt)}
      </span>
      {message.body && (
        <p className={cn("whitespace-pre-wrap break-words rounded-card px-3.5 py-2 text-[13px] leading-[1.6]", mine ? "bg-gold text-white" : "bg-subtle text-ink")}>
          {message.body}
        </p>
      )}
      {message.document && (
        <div className="flex items-center gap-2.5 rounded-card border border-line px-3 py-2">
          <FileText size={16} className="shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">{message.document.filename}</div>
            <div className="text-[11.5px] text-muted">
              Shared by {message.document.submittedBy.name} · {new Date(message.document.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * The thread with one lawyer (FORHU/ilovelawyer-client#21, ilovelawyer-api#517). With the lawyer
 * they hired, the client can write, share a document already on the case (the lawyer sees who
 * shared it and when), or both. Since phase 5b each lawyer on the request has a thread from when they
 * join (`claimId`, `beforeHire`): text only, the lawyer sees an anonymised summary and not the
 * client's name, and a hint asks not to share contact details. Seeing the thread marks it read.
 * Read-only once the engagement has closed.
 */
export function LawyerMessages({
  c,
  requestId,
  lawyerName,
  closed,
  claimId,
  beforeHire = false,
}: {
  c: Case;
  requestId: string;
  lawyerName: string;
  closed: boolean;
  /** The lawyer's thread; left out, the hired lawyer's. */
  claimId?: string;
  beforeHire?: boolean;
}) {
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
    if (unread > 0 && !marking) markRead();
  }, [unread, marking, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <div className="flex flex-col gap-3 rounded-modal border border-line p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
        <MessageCircleMore size={16} className="text-muted" aria-hidden="true" />
        Messages with {lawyerName}
      </div>
      <p className="text-[12.5px] leading-[1.6] text-ink-2">
        {beforeHire
          ? "Ask them anything before you hire. They can see an anonymised summary of your case, not your name or documents."
          : "They can already see your case and documents. Ask them anything here."}
      </p>

      <div className="max-h-[420px] overflow-y-auto">
        {thread.isLoading ? (
          <p className="text-[13px] text-muted">Loading messages…</p>
        ) : thread.isError ? (
          <ErrorBox message="Couldn't load your messages." />
        ) : messages.length === 0 ? (
          <p className="text-[13px] text-muted">No messages yet.</p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      {closed ? (
        <p className="text-[12.5px] text-muted">This engagement has ended. You can still read your messages, but not reply.</p>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-2">
          {beforeHire && <p className="text-[12px] text-muted">Don&apos;t share contact details. Keep the conversation here until you hire a lawyer.</p>}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send(e);
            }}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={3}
            placeholder={`Write to ${lawyerName}…`}
            aria-label="Message to your lawyer"
            className="w-full resize-none rounded-card border border-line-input bg-transparent px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-ink"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Documents go only to the lawyer you hired (phase 5b). */}
            {!beforeHire && c.documents.length > 0 ? (
              <select
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                aria-label="Share a document"
                className="max-w-[60%] rounded-card border border-line-input bg-transparent px-2.5 py-1.5 text-[12.5px] text-ink-2"
              >
                <option value="">Share a document…</option>
                {c.documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <span />
            )}
            <Button type="submit" size="sm" disabled={post.isPending || (!draft.trim() && !documentId)}>
              {post.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
          {error && <ErrorBox message={error} />}
        </form>
      )}
    </div>
  );
}
