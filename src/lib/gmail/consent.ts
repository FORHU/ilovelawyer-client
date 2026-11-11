import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";

// Email-import consent (EPIC #982, #989): the client agrees before connecting Gmail, through the
// API's general consent endpoint (purpose EMAIL_IMPORT, opt-in). Withdrawing it, or disconnecting
// Gmail, revokes our access and stops all reading; connecting again asks again.

/** What the client agrees to. The API stores the answer against version "2026-11" of this text
 * (CONSENT_VERSIONS.EMAIL_IMPORT): change both together. */
export const EMAIL_IMPORT_CONSENT_POINTS = [
  "Read-only: we can’t send, change or delete your email.",
  "We only read your Gmail when you search, open an email, or use Suggest by AI.",
  "Suggest by AI sends the sender, recipients, subject, date and a short preview of matching emails to our AI to find the ones about your case. Whole emails aren’t sent unless you add them to your case.",
  "Nothing is copied into your case until you choose it. What you add is stored as case documents, which the AI and any lawyer you engage can read.",
  "You can disconnect at any time. That ends our access and stops all reading. Documents already added stay in your case until you delete them.",
] as const;

interface ConsentState {
  purpose: string;
  status: "granted" | "withdrawn" | "not_set";
  outdated: boolean;
}

const consentKeys = { all: (userId: string | undefined) => ["consents", userId ?? "signed-out"] as const };

/** Whether the client has agreed to the current email-import text. Undefined while loading. */
export function useEmailImportConsent(): boolean | undefined {
  const userId = useSession((s) => s.user?.id);
  const { data } = useQuery({
    queryKey: consentKeys.all(userId),
    queryFn: () => apiFetch<ConsentState[]>("/api/consents"),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
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

/** Re-reads the consent answers, after something that changes them (Disconnect withdraws it). */
export function useRefreshConsents() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return useCallback(() => queryClient.invalidateQueries({ queryKey: consentKeys.all(userId) }), [queryClient, userId]);
}

/** The API refused because email-import consent is missing (given elsewhere and withdrawn, or an
 * older text): the app re-reads the answers, which brings the consent step back. */
export function isEmailImportConsentError(err: unknown): boolean {
  return err instanceof ApiError && err.code === "CONSENT_REQUIRED" && err.body?.purpose === "EMAIL_IMPORT";
}
