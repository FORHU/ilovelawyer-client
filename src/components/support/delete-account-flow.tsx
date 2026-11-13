"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { useDeleteAccountMutation } from "@/lib/auth/mutations";
import type { ActionResult } from "@/lib/support/actions";
import { downloadMyData } from "@/lib/support/actions-api";
import { BLOCKED_TEXT, blockingFromError, isWrongPassword, stepAfterCheck } from "@/lib/support/deletion-flow";
import { useDeletionCheckQuery } from "@/lib/support/queries";
import type { SupportBlockingRequest } from "@/lib/support/types";
import { PasswordField } from "./password-field";

type Step = "WARN" | "EXPORT" | "PASSWORD" | "CONFIRM";

const blockedResult = (requests: SupportBlockingRequest[]): ActionResult => ({ ok: false, text: BLOCKED_TEXT, card: { kind: "BLOCKING", requests } });

const HEADINGS: Record<Step, string> = {
  WARN: "Before you delete your account",
  EXPORT: "Download your data first",
  PASSWORD: "Confirm with your password",
  CONFIRM: "Delete your account?",
};

/** "Delete my account", in the chat: the warning, a chance to download your data, a check that no
 * lawyer request is still open, your password (a password account only), and one last explicit
 * button. The delete button is the only red one, and appears only on the last step. */
export function DeleteAccountFlow({ safetyCopy, onDone }: { safetyCopy: string[]; onDone: (result: ActionResult) => void }) {
  const check = useDeletionCheckQuery();
  const remove = useDeleteAccountMutation();
  const [step, setStep] = useState<Step>("WARN");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const hasPassword = check.data?.hasPassword ?? false;
  const credits = check.data?.creditsRemaining ?? 0;

  const cont = async () => {
    setBusy(true);
    setError(null);
    const fresh = await check.refetch();
    setBusy(false);
    if (!fresh.data) return setError("I couldn't check your account just now. Try again.");
    const next = stepAfterCheck(fresh.data);
    if (next === "BLOCKED") return onDone(blockedResult(fresh.data.blocking));
    setPassword("");
    setStep(next);
  };

  const runDownload = async () => {
    if (busy || (hasPassword && password === "")) return;
    setBusy(true);
    setError(null);
    try {
      await downloadMyData(hasPassword ? password : undefined);
      setDownloaded(true);
      setPassword("");
      setStep("WARN");
    } catch (err) {
      setError(isWrongPassword(err) ? "That password isn't right. Try again." : "Couldn't prepare your download. Try again.");
    }
    setBusy(false);
  };

  const confirm = () => {
    if (remove.isPending || (step === "PASSWORD" && password === "")) return;
    setError(null);
    remove.mutate(step === "PASSWORD" ? password : undefined, {
      onError: (err) => {
        const requests = blockingFromError(err);
        if (requests) return onDone(blockedResult(requests));
        setError(isWrongPassword(err) ? "That password isn't right. Try again." : "Your account wasn't deleted. Try again in a moment.");
      },
    });
  };

  if (check.isError && !check.data) {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-4">
        <ErrorBox message="I couldn't check your account just now." />
        <Button variant="soft" size="lg" onClick={() => void check.refetch()}>
          Try again
        </Button>
        <Button variant="quiet" size="lg" className="underline decoration-line-input underline-offset-4" onClick={() => onDone({ ok: false, text: "No problem. Your account hasn't been changed." })}>
          Never mind
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === "EXPORT") void runDownload();
        else confirm();
      }}
      aria-labelledby="support-delete-title"
      className="flex flex-col gap-3 rounded-card border border-error-line bg-white p-4"
    >
      <h3 id="support-delete-title" ref={heading} tabIndex={-1} className="text-[15px] font-semibold text-ink outline-none">
        {HEADINGS[step]}
      </h3>

      {step === "WARN" && (
        <>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-[1.5] text-ink">
            {safetyCopy.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {downloaded && (
            <p role="status" className="rounded-card border border-success-line bg-success-bg px-3.5 py-2.5 text-[14px] leading-[1.5] text-success-ink">
              Your download has started.
            </p>
          )}
          {error && <ErrorBox message={error} />}
          <div className="flex flex-col gap-2 pt-1">
            <Button variant="soft" size="lg" disabled={check.isPending || busy} onClick={() => (hasPassword ? setStep("EXPORT") : void runDownload())}>
              <Download size={16} aria-hidden />
              Download my data first
            </Button>
            <Button variant="dark" size="lg" disabled={check.isPending || busy} onClick={() => void cont()}>
              {busy ? "Checking…" : "Continue"}
            </Button>
            <Button variant="quiet" size="lg" className="underline decoration-line-input underline-offset-4" disabled={busy} onClick={() => onDone({ ok: false, text: "No problem. Your account hasn't been changed." })}>
              Never mind
            </Button>
          </div>
        </>
      )}

      {step === "EXPORT" && (
        <>
          <PasswordField id="support-delete-export-password" value={password} onChange={setPassword} error={error} hint="We ask for your password before we hand over your data." />
          <Button type="submit" variant="dark" size="lg" disabled={busy || password === ""}>
            {busy ? "Preparing your download…" : "Download my data"}
          </Button>
          <Button
            variant="quiet"
            size="lg"
            disabled={busy}
            onClick={() => {
              setPassword("");
              setError(null);
              setStep("WARN");
            }}
          >
            Back
          </Button>
        </>
      )}

      {(step === "PASSWORD" || step === "CONFIRM") && (
        <>
          <p className="text-[14px] leading-[1.5] text-ink">
            Your account will be deleted in 30 days. Until then, signing in again cancels it.
            {credits > 0 && ` You have ${credits} unused Chat ${credits === 1 ? "Credit" : "Credits"}, and they won't be refunded.`}
          </p>
          {step === "PASSWORD" && (
            <PasswordField id="support-delete-password" value={password} onChange={setPassword} error={error} hint="We ask for your password so nobody else can close your account." />
          )}
          {step === "CONFIRM" && error && <ErrorBox message={error} />}
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <Button type="submit" variant="danger" size="lg" disabled={remove.isPending || (step === "PASSWORD" && password === "")}>
              {remove.isPending ? "Deleting…" : "Delete my account"}
            </Button>
            <Button variant="soft" size="lg" disabled={remove.isPending} onClick={() => onDone({ ok: false, text: "No problem. Your account hasn't been changed." })}>
              Keep my account
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
