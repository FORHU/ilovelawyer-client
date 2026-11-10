"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { ApiError } from "@/lib/api/fetch";
import { GMAIL_READONLY_SCOPE } from "@/lib/gmail/api";
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

/** Opens Google's popup for read-only Gmail access (auth-code flow, so the API gets a refresh
 * token) and hands the code to the API. Any Google account can be picked; it doesn't have to be
 * the one the client signs in with. */
export function ConnectGmailButton({ label = "Connect Gmail", className }: { label?: string; className?: string }) {
  const connect = useConnectGmailMutation();
  const [error, setError] = useState<string | null>(null);

  const launch = useGoogleLogin({
    flow: "auth-code",
    scope: GMAIL_READONLY_SCOPE,
    select_account: true,
    // Only Gmail in this grant, never scopes from an earlier sign-in.
    include_granted_scopes: false,
    onSuccess: ({ code }) => {
      setError(null);
      connect.mutate(code, { onError: (err) => setError(messageFor(err)) });
    },
    onError: () => setError("The Google window closed before Gmail was connected."),
    onNonOAuthError: (err) => {
      if (err.type === "popup_closed") setError("The Google window closed before Gmail was connected.");
      else if (err.type === "popup_failed_to_open") setError("Your browser blocked the Google window. Allow pop-ups for this site and try again.");
    },
  });

  return (
    <div className="flex flex-col items-start gap-2.5">
      <Button variant="dark" onClick={() => launch()} disabled={connect.isPending} className={className}>
        <Mail size={14} aria-hidden />
        {connect.isPending ? "Connecting…" : label}
      </Button>
      {error && <ErrorBox message={error} />}
    </div>
  );
}
