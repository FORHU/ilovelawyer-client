"use client";

import { useRef, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { ApiError } from "@/lib/api/fetch";
import { GMAIL_READONLY_SCOPE } from "@/lib/gmail/api";
import { EMAIL_IMPORT_CONSENT_POINTS, useAgreeToEmailImportMutation, useEmailImportConsent } from "@/lib/gmail/consent";
import { useConnectGmailMutation } from "@/lib/gmail/queries";

function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "GMAIL_SCOPE_MISSING") return "Gmail wasn't connected because reading your email was left unticked. Connect again and allow it.";
    if (err.code === "GMAIL_CONSENT_REQUIRED") return "Google needs you to approve Gmail access once more. Click Connect Gmail again.";
    if (err.code === "GMAIL_UNAVAILABLE" || err.status === 503) return "Gmail import isn't available right now.";
    return err.message;
  }
  return "Couldn't connect Gmail. Try again.";
}

/** What the client agrees to before connecting (#989), as a list. */
export function EmailImportConsentPoints() {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-[1.55] text-ink-2">
      {EMAIL_IMPORT_CONSENT_POINTS.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

/**
 * Opens Google's popup for read-only Gmail access (auth-code flow, so the API gets a refresh
 * token) and hands the code to the API. Any Google account can be picked; it doesn't have to be
 * the one the client signs in with.
 *
 * Until the client has agreed to email import (#989), the terms are listed above the button with
 * an "I agree" box, and the button stays off until it's ticked. The agreement is recorded as the
 * popup opens (the popup has to open straight from the click, or the browser blocks it), and the
 * connect waits for it, since the API refuses to connect without it.
 */
export function ConnectGmailButton({ label = "Connect Gmail", className }: { label?: string; className?: string }) {
  const connect = useConnectGmailMutation();
  const agree = useAgreeToEmailImportMutation();
  const consented = useEmailImportConsent();
  const [ticked, setTicked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agreement = useRef<Promise<unknown>>(Promise.resolve());

  const launch = useGoogleLogin({
    flow: "auth-code",
    scope: GMAIL_READONLY_SCOPE,
    select_account: true,
    // Only Gmail in this grant, never scopes from an earlier sign-in.
    include_granted_scopes: false,
    onSuccess: async ({ code }) => {
      setError(null);
      try {
        await agreement.current;
      } catch (err) {
        setError(messageFor(err));
        return;
      }
      connect.mutate(code, { onError: (err) => setError(messageFor(err)) });
    },
    onError: (res) =>
      setError(
        res.error === "access_denied"
          ? "Google didn't let this account connect. Access was declined, or only approved test accounts can connect for now."
          : "The Google window closed before Gmail was connected.",
      ),
    onNonOAuthError: (err) => {
      if (err.type === "popup_closed") setError("The Google window closed before Gmail was connected.");
      else if (err.type === "popup_failed_to_open") setError("Your browser blocked the Google window. Allow pop-ups for this site and try again.");
    },
  });

  const needsAgreement = consented === false;
  const start = () => {
    setError(null);
    agreement.current = needsAgreement ? agree.mutateAsync() : Promise.resolve();
    // Kept from rejecting unhandled until onSuccess awaits it.
    agreement.current.catch(() => undefined);
    launch();
  };

  return (
    <div className="flex flex-col items-start gap-3">
      {needsAgreement && (
        <>
          <EmailImportConsentPoints />
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-ink">
            <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-ink" />
            I agree to ilovelawyer reading my Gmail as described above.
          </label>
        </>
      )}
      <Button
        variant="dark"
        onClick={start}
        disabled={consented === undefined || (needsAgreement && !ticked) || connect.isPending || agree.isPending}
        className={className}
      >
        <Mail size={14} aria-hidden />
        {connect.isPending ? "Connecting…" : label}
      </Button>
      {error && <ErrorBox message={error} />}
    </div>
  );
}
