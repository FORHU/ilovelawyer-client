"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowUp, FileText, MessageCircleMore, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { BottomSheet, SheetRow } from "@/components/mobile/bottom-sheet";
import { ChatBar, ChatScreen, ComposerButton, ComposerPill } from "@/components/mobile/chat";
import { useBodyScrollLock } from "@/components/mobile/use-body-scroll-lock";
import { LawyerMessage } from "./lawyer-message";
import type { LawyerMessagesProps } from "./lawyer-messages";
import { MESSAGE_MAX_LENGTH, useLawyerMessages } from "./use-lawyer-messages";

/** The phone's thread with a lawyer: a card on the page (who, the latest message, an unread count)
 * that opens the conversation as a full screen. Messages are marked read when that screen opens. */
export function LawyerMessagesMobile(props: LawyerMessagesProps) {
  const { requestId, claimId, lawyerName, closed } = props;
  const [open, setOpen] = useState(false);
  const { thread, messages, unread } = useLawyerMessages({ requestId, claimId, markReadWhen: open });
  const last = messages.at(-1);
  const preview = last ? (last.body ?? last.document?.filename ?? "") : "";

  return (
    <section data-tour="lawyer-messages" className="flex flex-col gap-3 rounded-modal border border-line p-4">
      <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
        <MessageCircleMore size={18} className="text-muted" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Messages with {lawyerName}</span>
        {unread > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] text-white" aria-label={`${unread} unread`}>
            {unread}
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-[14px] leading-[1.5] text-ink-2">
        {thread.isLoading
          ? "Loading messages…"
          : thread.isError
            ? "Couldn't load your messages."
            : last
              ? `${last.author.side === "CLIENT" ? "You: " : ""}${preview}`
              : props.beforeHire
                ? "Ask them anything before you hire."
                : "No messages yet. Ask them anything."}
      </p>
      <Button variant="outline" size="lg" className="w-full" onClick={() => setOpen(true)}>
        {closed ? "Read messages" : "Open messages"}
      </Button>
      {open && <MessagesScreen {...props} onClose={() => setOpen(false)} />}
    </section>
  );
}

/** The conversation, over the whole screen. Opened from the card; the back button closes it. */
function MessagesScreen({ c, requestId, claimId, lawyerName, closed, beforeHire = false, onClose }: LawyerMessagesProps & { onClose: () => void }) {
  const { thread, messages, post, draft, setDraft, documentId, setDocumentId, error, send } = useLawyerMessages({ requestId, claimId, markReadWhen: false });
  const [picking, setPicking] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  useBodyScrollLock();

  // Opens at the latest message, and keeps it in view as new ones arrive.
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages.length]);
  // The box grows with what is typed, up to a few lines.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  const shared = c.documents.find((d) => d.id === documentId);
  // Documents go only to the lawyer you hired (phase 5b).
  const canShare = !beforeHire && c.documents.length > 0;

  return createPortal(
    <div ref={panel} role="dialog" aria-modal="true" aria-label={`Messages with ${lawyerName}`} tabIndex={-1} className="fixed inset-0 z-50 flex flex-col bg-white outline-none">
      <header className="keyboard-hide flex shrink-0 items-center gap-1 border-b border-line px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" aria-label="Back" onClick={onClose} data-no-tap className="flex size-11 shrink-0 items-center justify-center rounded-full active:bg-chip">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 py-2">
          <h2 className="truncate font-display text-[18px] leading-[1.25] tracking-[-0.01em]">{lawyerName}</h2>
          <p className="truncate text-[12px] text-ink-2">{beforeHire ? "Before you hire · they see an anonymised summary" : "Your lawyer"}</p>
        </div>
      </header>

      <ChatScreen>
        <div ref={log} role="log" aria-label={`Messages with ${lawyerName}`} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-4 px-4 py-4">
            {thread.isLoading ? (
              <p className="text-[14px] text-muted">Loading messages…</p>
            ) : thread.isError ? (
              <ErrorBox message="Couldn't load your messages." />
            ) : messages.length === 0 ? (
              <p className="text-[14px] text-muted">No messages yet.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {messages.map((m) => (
                  <LawyerMessage key={m.id} message={m} large />
                ))}
              </ul>
            )}
          </div>
        </div>

        <ChatBar>
          {closed ? (
            <p className="py-2 text-center text-[13px] text-muted">This engagement has ended. You can still read your messages, but not reply.</p>
          ) : (
            <>
              {beforeHire && <p className="mb-2 px-1 text-[12.5px] leading-[1.4] text-muted">Don&apos;t share contact details. Keep the conversation here until you hire a lawyer.</p>}
              {error && <ErrorBox message={error} />}
              {shared && (
                <div className="mb-2 flex">
                  <span className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-chip pl-3 pr-1 text-[13px] text-ink">
                    <FileText size={13} className="shrink-0 text-gold" aria-hidden="true" />
                    <span className="truncate">{shared.name}</span>
                    <button type="button" aria-label={`Don't share ${shared.name}`} onClick={() => setDocumentId("")} data-no-tap className="flex size-9 items-center justify-center rounded-full active:bg-ink/10">
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                </div>
              )}
              <form onSubmit={send}>
                <ComposerPill>
                  {canShare && (
                    <ComposerButton aria-label="Share a document" onClick={() => setPicking(true)}>
                      <Paperclip size={20} aria-hidden="true" />
                    </ComposerButton>
                  )}
                  {/* Enter adds a new line; only the send button sends. */}
                  <textarea
                    ref={box}
                    rows={1}
                    value={draft}
                    maxLength={MESSAGE_MAX_LENGTH}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Write to ${lawyerName}…`}
                    aria-label="Message to your lawyer"
                    enterKeyHint="enter"
                    // 24px of text + 10px above and below = 44px, the height of the round buttons beside it.
                    className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-base leading-6 text-ink outline-none placeholder:text-muted"
                  />
                  <ComposerButton type="submit" tone="send" aria-label="Send" disabled={post.isPending || (!draft.trim() && !documentId)}>
                    <ArrowUp size={20} aria-hidden="true" />
                  </ComposerButton>
                </ComposerPill>
              </form>
            </>
          )}
        </ChatBar>
      </ChatScreen>

      <BottomSheet open={picking} onClose={() => setPicking(false)} title="Share a document">
        <SheetRow
          selected={documentId === ""}
          onSelect={() => {
            setDocumentId("");
            setPicking(false);
          }}
        >
          No document
        </SheetRow>
        {c.documents.map((d) => (
          <SheetRow
            key={d.id}
            icon={<FileText size={18} />}
            selected={documentId === d.id}
            onSelect={() => {
              setDocumentId(d.id);
              setPicking(false);
            }}
          >
            {d.name}
          </SheetRow>
        ))}
      </BottomSheet>
    </div>,
    document.body,
  );
}
