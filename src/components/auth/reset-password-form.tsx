"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { FormError, PasswordInput, labelClass, primaryButtonClass } from "@/components/auth/form-parts";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { authErrorMessage, isApiError, isLawyerAccountError, wrongSiteUrl } from "@/lib/auth/errors";
import { useResetPasswordMutation, useValidateResetTokenQuery } from "@/lib/auth/mutations";
import { isPasswordValid } from "@/lib/auth/password-policy";
import { useT } from "@/components/site/language-provider";

/** Opened from the "Reset your password" email: {client origin}/reset-password?token=… */
export function ResetPasswordForm() {
  const router = useRouter();
  const t = useT();
  const token = useSearchParams().get("token") ?? "";
  // Checked up front, so an expired link says so before the person types a new password.
  const validateQuery = useValidateResetTokenQuery(token);
  const resetMutation = useResetPasswordMutation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // The API refused the token on submit (it expired, or was used in another tab meanwhile).
  const [spent, setSpent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lawyerLink, setLawyerLink] = useState(false);
  const [siteLink, setSiteLink] = useState<string | null>(null);

  const linkInvalid =
    !token || spent || validateQuery.isError || (validateQuery.isSuccess && !validateQuery.data);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setLawyerLink(false);
    if (!isPasswordValid(password)) {
      setError(t("Password does not meet the requirements below."));
      return;
    }
    if (password !== confirm) {
      setError(t("Passwords do not match."));
      return;
    }
    resetMutation.mutate(
      { token, password },
      {
        // This page stays mounted but hidden after navigating away (cacheComponents): drop the password.
        onSuccess: () => {
          setPassword("");
          setConfirm("");
        },
        onError: (err) => {
          if (isApiError(err) && err.status === 400) setSpent(true);
          setError(authErrorMessage(err, "reset", t));
          setLawyerLink(isLawyerAccountError(err));
          setSiteLink(wrongSiteUrl(err));
        },
      },
    );
  }

  if (linkInvalid) {
    return (
      <AuthFrame heading={t("Link Expired")} subheading={t("This reset link has expired or was already used.")}>
        <div className="flex flex-col gap-6">
          <p className="text-base leading-6.5 text-muted">
            {t("Reset links work once, for one hour. Ask for a new one and use the latest email.")}
          </p>
          <button type="button" onClick={() => router.replace("/login?tab=recover")} className={primaryButtonClass}>
            {t("Request a New Link")}
          </button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame heading={t("Set a New Password")} subheading={t("Choose a new password for your account.")}>
      {validateQuery.isPending ? (
        <p className="text-base text-muted">{t("Checking your link…")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="reset-password" className={labelClass}>
              {t("New Password")}
            </label>
            <PasswordInput
              id="reset-password"
              value={password}
              onChange={setPassword}
              placeholder={t("Create a password")}
              autoComplete="new-password"
            />
            {password && <PasswordRequirements password={password} />}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reset-confirm" className={labelClass}>
              {t("Confirm Password")}
            </label>
            <PasswordInput
              id="reset-confirm"
              value={confirm}
              onChange={setConfirm}
              placeholder={t("Re-enter your password")}
              autoComplete="new-password"
            />
            {confirm && password !== confirm && <p className="text-xs text-error">{t("Passwords do not match.")}</p>}
          </div>

          <FormError message={error} lawyerLink={lawyerLink} siteLink={siteLink} />

          <button
            type="submit"
            disabled={resetMutation.isPending || !isPasswordValid(password) || password !== confirm}
            className={primaryButtonClass}
          >
            {resetMutation.isPending ? t("Saving…") : t("Save Password")}
          </button>
        </form>
      )}
    </AuthFrame>
  );
}
