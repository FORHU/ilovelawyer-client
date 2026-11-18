"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Field, TextArea, TextInput } from "@/components/ui/input";
import { useSupport } from "@/lib/support/store";
import { openVisitorTicket } from "@/lib/support/ticket-api";
import { TICKET_MESSAGE_MAX, ticketContext, visitorErrorMessage } from "@/lib/support/ticket";
import { Turnstile, TURNSTILE_ENABLED } from "./turnstile";

export const VISITOR_CONFIRMATION = "We'll reply by email within one working day.";

const QUIET = "underline decoration-line-input underline-offset-4";

/** "Talk to a person" for someone who isn't signed in: an email address to answer, the message, and
 * a check that they are a person. The answer is the same whether or not the address has an account.
 * What is typed is kept as a draft until it is sent, or until the sign-in page is left. */
export function VisitorTicketForm({
  flowPath,
  pathname,
  onSent,
  onBack,
}: {
  flowPath: string[];
  pathname: string | null;
  onSent: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(() => useSupport.getState().drafts.visitorEmail);
  const [message, setMessage] = useState(() => useSupport.getState().drafts.visitorMessage);
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const confirmation = useRef<HTMLDivElement>(null);

  // They chose to write: the cursor is in the first box. Once sent, focus goes to the confirmation,
  // which a screen reader then reads out (the form it replaces took focus with it).
  useEffect(() => {
    if (sent) confirmation.current?.focus();
    else document.getElementById("support-visitor-email")?.focus();
  }, [sent]);

  const ready = email.trim() !== "" && message.trim() !== "" && (!TURNSTILE_ENABLED || token !== "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setError(null);
    try {
      await openVisitorTicket({ email: email.trim(), message: message.trim(), turnstileToken: token, context: ticketContext(flowPath, pathname) });
      useSupport.getState().setDraft("visitorEmail", "");
      useSupport.getState().setDraft("visitorMessage", "");
      setSent(true);
      onSent();
    } catch (err) {
      setError(visitorErrorMessage(err));
      // A token is good for one try: ask for a fresh check.
      setToken("");
      setResetKey((n) => n + 1);
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div ref={confirmation} tabIndex={-1} role="status" className="flex flex-col gap-2 rounded-card border border-success-line bg-success-bg p-4 text-success-ink outline-none">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <CheckCircle2 size={18} aria-hidden />
          Message sent
        </p>
        <p className="text-[14px] leading-[1.5]">{VISITOR_CONFIRMATION}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} aria-label="Write to the team" className="flex flex-col gap-3 rounded-card border border-line bg-white p-4">
      <p className="text-[14px] leading-[1.5] text-ink">Tell us what&apos;s happened. A person will reply by email.</p>
      <Field label="Your email address" htmlFor="support-visitor-email">
        <TextInput
          id="support-visitor-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            useSupport.getState().setDraft("visitorEmail", e.target.value);
          }}
          className="text-[16px]"
        />
      </Field>
      <Field label="Your message" htmlFor="support-visitor-message">
        <TextArea
          id="support-visitor-message"
          required
          rows={4}
          maxLength={TICKET_MESSAGE_MAX}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            useSupport.getState().setDraft("visitorMessage", e.target.value);
          }}
          aria-describedby="support-visitor-message-hint"
          className="text-[16px]"
        />
      </Field>
      <p id="support-visitor-message-hint" className="text-[13px] leading-[1.5] text-ink-2">
        Please don&apos;t include passwords. We&apos;ll use your email address only to reply.
      </p>
      <Turnstile onToken={setToken} resetKey={resetKey} />
      {error && <ErrorBox message={error} />}
      <Button type="submit" variant="dark" size="lg" disabled={busy || !ready}>
        {busy ? "Sending…" : "Send to the team"}
      </Button>
      <Button variant="quiet" size="lg" className={QUIET} disabled={busy} onClick={onBack}>
        Back to topics
      </Button>
    </form>
  );
}
