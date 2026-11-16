"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { ApiError } from "@/lib/api/fetch";
import type { ActionResult } from "@/lib/support/actions";
import { downloadMyData } from "@/lib/support/actions-api";
import { isWrongPassword } from "@/lib/support/deletion-flow";
import { useDeletionCheckQuery } from "@/lib/support/queries";
import { PasswordField } from "./password-field";

/** "Export my data": the ZIP of everything the account holds. A password account confirms with its
 * password first; a Google account just downloads. */
export function ExportFlow({ onDone }: { onDone: (result: ActionResult) => void }) {
  const check = useDeletionCheckQuery();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPassword = check.data?.hasPassword ?? false;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !check.data || (needsPassword && password === "")) return;
    setBusy(true);
    setError(null);
    try {
      await downloadMyData(needsPassword ? password : undefined);
      onDone({ ok: true });
    } catch (err) {
      setBusy(false);
      setError(isWrongPassword(err) ? "That password isn't right. Try again." : err instanceof ApiError ? err.message : "Couldn't prepare your download. Try again.");
    }
  };

  return (
    <form onSubmit={submit} aria-label="Export my data" className="flex flex-col gap-3 rounded-card border border-line bg-white p-4">
      {check.isError ? (
        <>
          <ErrorBox message="I couldn't check your account just now." />
          <Button variant="soft" size="lg" onClick={() => void check.refetch()}>
            Try again
          </Button>
        </>
      ) : (
        <>
          <p className="text-[14px] leading-[1.5] text-ink">A ZIP file with your account, your cases and the files you uploaded. It can take a moment to prepare.</p>
          {needsPassword && (
            <PasswordField id="support-export-password" value={password} onChange={setPassword} error={error} hint="We ask for your password before we hand over your data." />
          )}
          {!needsPassword && error && <ErrorBox message={error} />}
          <Button type="submit" variant="dark" size="lg" disabled={busy || check.isPending || (needsPassword && password === "")}>
            {busy ? "Preparing your download…" : "Download my data"}
          </Button>
          <Button variant="quiet" size="lg" className="underline decoration-line-input underline-offset-4" disabled={busy} onClick={() => onDone({ ok: false, text: "No problem. Nothing has been downloaded." })}>
            Never mind
          </Button>
        </>
      )}
    </form>
  );
}
