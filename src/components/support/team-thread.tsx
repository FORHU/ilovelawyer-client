"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Info, LifeBuoy } from "lucide-react";
import { ComposerButton, ComposerPill } from "@/components/mobile/chat";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { useSupport } from "@/lib/support/store";
import { TICKET_MESSAGE_MAX, ticketContext } from "@/lib/support/ticket";
import { useMarkSupportReadMutation, usePostSupportMessageMutation } from "@/lib/support/ticket-queries";
import type { SupportThread, SupportThreadMessage } from "@/lib/support/types";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Enter sends with a mouse and keyboard. On a phone there is no Shift key, and a message to the
 * team is often several lines, so Enter is a new line there and the arrow button sends. */
const enterSends = () => window.matchMedia("(pointer: fine)").matches;

/** The tallest the reply box grows before it scrolls. */
const COMPOSER_MAX_PX = 128;

/** One message in the conversation with the team. The client's are on the right in the app's gold;
 * the team's are on the left on white, with who wrote them above, so the two are told apart by more
 * than colour. The app's own notes (a closed conversation) sit in the middle. */
function ThreadMessage({ message }: { message: SupportThreadMessage }) {
  if (message.author === "SYSTEM") {
    return (
      <li className="flex items-start gap-2 self-center rounded-card bg-chip px-3.5 py-2.5 text-[13px] leading-[1.5] text-ink-2">
        <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          <span className="sr-only">Note: </span>
          {message.body}
        </span>
      </li>
    );
  }
  const mine = message.author === "CLIENT";
  return (
    <li className={cn("flex max-w-[86%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
      <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
        {!mine && <LifeBuoy size={13} className="text-gold" aria-hidden />}
        {mine ? "You" : "Support team"} · {formatDateTime(message.createdAt)}
      </span>
      <p
        className={cn(
          "whitespace-pre-wrap break-words rounded-card px-3.5 py-2.5 text-[15px] leading-[1.5]",
          mine ? "bg-gold text-white" : "border border-line-chip bg-white text-ink",
        )}
      >
        <span className="sr-only">{mine ? "You: " : "Support team: "}</span>
        {message.body}
      </p>
    </li>
  );
}

/** The client's conversation with the team, in the same sheet as the assistant. Opening it marks the
 * team's replies as read (clearing the red dot on the Guide), and a reply that arrives while it is
 * open is marked read too. A message sent joins the open conversation, or starts a new one if the
 * last was closed. A reply that is typed and not sent is kept as a draft. */
export function TeamThread({
  thread,
  responseTimeLine,
  flowPath,
  pathname,
  onBack,
}: {
  thread: SupportThread | null | undefined;
  responseTimeLine: string;
  flowPath: string[];
  pathname: string | null;
  onBack: () => void;
}) {
  const post = usePostSupportMessageMutation();
  const markRead = useMarkSupportReadMutation();
  const [text, setText] = useState(() => useSupport.getState().drafts.team);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  // Arriving here (from the help topics, or from sending the first message) puts focus on the
  // conversation, so a screen reader starts reading it rather than the page behind.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const unread = thread?.unreadCount ?? 0;
  const { mutate: markAsRead, isPending: marking } = markRead;
  useEffect(() => {
    if (unread > 0 && !marking) markAsRead();
  }, [unread, marking, markAsRead]);

  const count = thread?.messages.length ?? 0;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [count]);

  // The box grows with what is typed, to a limit, then scrolls.
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_PX)}px`;
  }, [text]);

  const closed = thread?.status === "RESOLVED";

  const change = (value: string) => {
    setText(value);
    useSupport.getState().setDraft("team", value);
  };

  const send = () => {
    const body = text.trim();
    if (post.isPending || body === "") return;
    setError(null);
    post.mutate(
      { body, context: closed || !thread ? ticketContext(flowPath, pathname) : undefined },
      {
        onSuccess: () => change(""),
        onError: () => setError("We couldn't send that. Check your connection and try again."),
      },
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && enterSends()) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4">
        <h3 ref={heading} tabIndex={-1} className="sr-only outline-none">
          Conversation with the support team
        </h3>
        {!thread && <p className="text-[14px] leading-[1.5] text-ink-2">You haven&apos;t written to the team yet.</p>}
        {thread?.status === "OPEN" && (
          <p role="status" className="rounded-card border border-warn-line bg-warn-bg px-3.5 py-2.5 text-[14px] leading-[1.5] text-warn-ink">
            {responseTimeLine}
          </p>
        )}
        {closed && (
          <p role="status" className="rounded-card bg-chip px-3.5 py-2.5 text-[14px] leading-[1.5] text-ink-2">
            This conversation is closed. Send a message to start a new one.
          </p>
        )}
        <ol role="log" aria-label="Messages with the support team" className="flex flex-col gap-3">
          {thread?.messages.map((message) => (
            <ThreadMessage key={message.id} message={message} />
          ))}
        </ol>
      </div>

      <div className="shrink-0 border-t border-line bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5">
        {error && (
          <div className="mb-2">
            <ErrorBox message={error} />
          </div>
        )}
        <form onSubmit={submit}>
          <ComposerPill className="items-end">
            <label htmlFor="support-team-input" className="sr-only">
              Message the support team
            </label>
            <textarea
              ref={input}
              id="support-team-input"
              value={text}
              onChange={(e) => change(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={TICKET_MESSAGE_MAX}
              placeholder={closed || !thread ? "Write to the team…" : "Reply to the team…"}
              className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-[16px] leading-[1.4] text-ink outline-none placeholder:text-ink-2"
            />
            <ComposerButton type="submit" tone="send" aria-label="Send message" disabled={post.isPending || text.trim() === ""}>
              <ArrowUp size={20} aria-hidden />
            </ComposerButton>
          </ComposerPill>
        </form>
        <Button variant="quiet" size="lg" className="mt-1 w-full underline decoration-line-input underline-offset-4" onClick={onBack}>
          Back to help topics
        </Button>
      </div>
    </>
  );
}
