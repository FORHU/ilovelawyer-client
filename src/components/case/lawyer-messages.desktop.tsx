"use client";

import { MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { LawyerMessage } from "./lawyer-message";
import type { LawyerMessagesProps } from "./lawyer-messages";
import { MESSAGE_MAX_LENGTH, useLawyerMessages } from "./use-lawyer-messages";

export function LawyerMessagesDesktop({ c, requestId, lawyerName, closed, claimId, beforeHire = false }: LawyerMessagesProps) {
  const { thread, messages, post, draft, setDraft, documentId, setDocumentId, error, endRef, send } = useLawyerMessages({ requestId, claimId });

  return (
    <div data-tour="lawyer-messages" className="flex flex-col gap-3 rounded-modal border border-line p-4">
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
              <LawyerMessage key={m.id} message={m} />
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
