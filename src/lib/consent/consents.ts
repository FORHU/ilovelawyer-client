import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";

// The client's answers to the API's consent purposes (GET /api/consents), shared by every consent
// step in the app: email import (lib/gmail/consent.ts) and sensitive information
// (lib/consent/sensitive-info.ts).

export type ConsentPurpose = "AI_PROCESSING" | "EMAIL_IMPORT" | "SENSITIVE_INFO";

export interface ConsentState {
  purpose: string;
  status: "granted" | "withdrawn" | "not_set";
  outdated: boolean;
}

export const consentKeys = { all: (userId: string | undefined) => ["consents", userId ?? "signed-out"] as const };

export const CONSENTS_STALE_MS = 5 * 60_000;

export function fetchConsents() {
  return apiFetch<ConsentState[]>("/api/consents");
}

/** The answers for every purpose. Undefined data while loading. */
export function useConsents() {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: consentKeys.all(userId), queryFn: fetchConsents, enabled: !!userId, staleTime: CONSENTS_STALE_MS });
}

/** Re-reads the consent answers, after something that changes them (Disconnect withdraws one). */
export function useRefreshConsents() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return useCallback(() => queryClient.invalidateQueries({ queryKey: consentKeys.all(userId) }), [queryClient, userId]);
}
