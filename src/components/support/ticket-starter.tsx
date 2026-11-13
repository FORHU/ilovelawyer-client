"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Field, TextArea } from "@/components/ui/input";
import { TICKET_MESSAGE_MAX, ticketContext } from "@/lib/support/ticket";
import { usePostSupportMessageMutation } from "@/lib/support/ticket-queries";

/** "Talk to a person" for a signed-in client: the first message of a Support Ticket. It carries the
 * help topics tried, the page the client is on and the case, if there is one. Never the case's
 * documents or chats. */
export function TicketStarter({
  flowPath,
  pathname,
  onOpened,
  onBack,
}: {
  flowPath: string[];
  pathname: string | null;
  onOpened: () => void;
  onBack: () => void;
}) {
  const post = usePostSupportMessageMutation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (post.isPending || message.trim() === "") return;
    setError(null);
    post.mutate(
      { body: message.trim(), context: ticketContext(flowPath, pathname) },
      { onSuccess: onOpened, onError: () => setError("We couldn't send that. Check your connection and try again.") },
    );
  };

  return (
    <form onSubmit={submit} aria-label="Write to the team" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <Field label="What would you like to tell the team?" htmlFor="support-ticket-message">
        <TextArea
          id="support-ticket-message"
          required
          rows={4}
          maxLength={TICKET_MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-describedby="support-ticket-hint"
          className="text-[16px]"
        />
      </Field>
      <p id="support-ticket-hint" className="text-[13px] leading-[1.5] text-ink-2">
        We&apos;ll include the help topics you looked at and the page you&apos;re on. We don&apos;t send your case documents or chats.
      </p>
      {error && <ErrorBox message={error} />}
      <Button type="submit" variant="dark" size="lg" disabled={post.isPending || message.trim() === ""}>
        {post.isPending ? "Sending…" : "Send to the team"}
      </Button>
      <Button variant="quiet" size="lg" disabled={post.isPending} onClick={onBack}>
        Back to topics
      </Button>
    </form>
  );
}
