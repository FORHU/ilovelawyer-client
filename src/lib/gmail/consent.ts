import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { consentKeys, useConsents, type ConsentState } from "@/lib/consent/consents";
import { msg } from "@/lib/i18n/msg";

export { useRefreshConsents } from "@/lib/consent/consents";

// Email-import consent (EPIC #982, #989): the client agrees before connecting Gmail, through the
// API's general consent endpoint (purpose EMAIL_IMPORT, opt-in). Withdrawing it, or disconnecting
// Gmail, revokes our access and stops all reading; connecting again asks again.

/** What the client agrees to. The API stores the answer against version "2026-11" of this text
 * (CONSENT_VERSIONS.EMAIL_IMPORT): change both together. */
// Shown through t(); the API records the English text's version (the Korean is a translation of it).
export const EMAIL_IMPORT_CONSENT_POINTS = [
  msg("Read-only: we can’t send, change or delete your email."),
  msg("We only read your Gmail when you search, open an email, or use Suggest by AI."),
  msg("Suggest by AI sends the sender, recipients, subject, date and a short preview of matching emails to our AI to find the ones about your case. Whole emails aren’t sent unless you add them to your case."),
  msg("Nothing is copied into your case until you choose it. What you add is stored as case documents, which the AI and any lawyer you engage can read."),
  msg("You can disconnect at any time. That ends our access and stops all reading. Documents already added stay in your case until you delete them."),
] as const;

/** Whether the client has agreed to the current email-import text. Undefined while loading. */
export function useEmailImportConsent(): boolean | undefined {
  const { data } = useConsents();
  if (!data) return undefined;
  const state = data.find((c) => c.purpose === "EMAIL_IMPORT");
  return state?.status === "granted" && !state.outdated;
}

/** Records the client's agreement, given at the Gmail connect step. */
export function useAgreeToEmailImportMutation() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return useMutation({
    mutationFn: () =>
      apiFetch<ConsentState[]>("/api/consents/EMAIL_IMPORT", { method: "PUT", body: JSON.stringify({ granted: true, source: "gmail" }) }),
    onSuccess: (list) => queryClient.setQueryData(consentKeys.all(userId), list),
  });
}

/** The API refused because email-import consent is missing (given elsewhere and withdrawn, or an
 * older text): the app re-reads the answers, which brings the consent step back. */
export function isEmailImportConsentError(err: unknown): boolean {
  return err instanceof ApiError && err.code === "CONSENT_REQUIRED" && err.body?.purpose === "EMAIL_IMPORT";
}
