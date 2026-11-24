import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { ApiError, apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";
import { msg } from "@/lib/i18n/msg";
import { CONSENTS_STALE_MS, consentKeys, fetchConsents, useConsents, type ConsentState } from "./consents";

// Separate consent for sensitive information (ilovelawyer-client#173, API #699; PIPA Art. 23, UK
// GDPR Art. 9, the Philippine Data Privacy Act). A client's case often includes health, criminal
// records and the like, so before the AI reads what they write or upload they agree to that on its
// own, apart from the Terms. The API refuses the AI chat (403 CONSENT_REQUIRED, purpose
// SENSITIVE_INFO) and holds uploaded documents until they have; everything else works without it.

/** What the client agrees to. The API stores the answer against version "2026-11" of this text
 * (CONSENT_VERSIONS.SENSITIVE_INFO): change both together. */
// Shown through t(); the API records the English text's version (the Korean is a translation of it).
export const SENSITIVE_INFO_POINTS = [
  msg("Sensitive information means things like your health, a criminal record, your sex life, your beliefs, union or political membership, or your racial or ethnic origin."),
  msg("It is used only to run your case: the AI reads your messages and documents to ask questions and prepare your overview, and a lawyer you choose to engage can see what is in your case."),
  msg("It goes to our AI service providers and is stored on servers outside your country. Who they are, and where, is in our Privacy Policy."),
  msg("If you don’t agree, you can still create cases, upload documents and ask a lawyer to help. The AI won’t read your messages or documents, so the chat isn’t available."),
  msg("You can change your mind at any time in Settings under AI use. Withdrawing stops the AI reading your case from then on."),
] as const;

export type SensitiveInfoStatus = "granted" | "withdrawn" | "not_set";

function statusOf(list: ConsentState[] | undefined): SensitiveInfoStatus | undefined {
  const state = list?.find((c) => c.purpose === "SENSITIVE_INFO");
  // An older text still counts: the API keeps allowing it, and asking again waits for a text change.
  return state?.status ?? (list ? "not_set" : undefined);
}

/** The client's answer. Undefined while it loads. */
export function useSensitiveInfoStatus(): SensitiveInfoStatus | undefined {
  return statusOf(useConsents().data);
}

/** Grants or withdraws it. A grant releases the documents the API held back, so the cases are
 * read again. `source` says where the answer was given. */
export function useSetSensitiveInfoMutation() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ granted, source }: { granted: boolean; source: "case_step" | "settings" }) =>
      apiFetch<ConsentState[]>("/api/consents/SENSITIVE_INFO", { method: "PUT", body: JSON.stringify({ granted, source }) }),
    onSuccess: (list, { granted }) => {
      queryClient.setQueryData(consentKeys.all(userId), list);
      if (granted) void queryClient.invalidateQueries({ queryKey: caseKeys.all(userId) });
    },
  });
}

/** The API refused because sensitive information hasn't been agreed to: re-read the answer, which
 * brings the step back the next time the client sends. */
export function isSensitiveInfoConsentError(err: unknown): boolean {
  return err instanceof ApiError && err.code === "CONSENT_REQUIRED" && err.body?.purpose === "SENSITIVE_INFO";
}

// ---- The step itself ----------------------------------------------------------------------------

interface PromptState {
  /** Settles the open step with the client's answer; null while it isn't showing. */
  settle: ((agreed: boolean) => void) | null;
  /** The answer being waited on, so a second ask while it's open shares it. */
  waiting: Promise<boolean> | null;
  ask: () => Promise<boolean>;
  /** Closes the step: true if agreed, false if declined or dismissed. */
  close: (agreed: boolean) => void;
}

/** The consent step's modal state (components/consent/sensitive-info-modal.tsx shows it). */
export const useSensitiveInfoPrompt = create<PromptState>((set, get) => ({
  settle: null,
  waiting: null,
  ask: () => {
    const open = get().waiting;
    if (open) return open;
    const waiting = new Promise<boolean>((resolve) => set({ settle: resolve }));
    set({ waiting });
    return waiting;
  },
  close: (agreed) => {
    get().settle?.(agreed);
    set({ settle: null, waiting: null });
  },
}));

/**
 * Makes sure the client has answered before something reaches the AI. Resolves true once they have
 * agreed, false if not. A client who already agreed passes straight through; one who never answered
 * is asked. One who declined earlier is asked again only when `askAgain` is set, which a message to
 * the AI does (that is exactly what the answer is needed for) and an upload or a new case does not
 * (those work without it, so they don't nag). If the answer can't be read the API decides: it
 * refuses what needs it, and the screen then asks.
 */
export function useSensitiveInfoGate() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return async function ensure({ askAgain = false }: { askAgain?: boolean } = {}): Promise<boolean> {
    let status: SensitiveInfoStatus | undefined;
    try {
      const list = await queryClient.fetchQuery({ queryKey: consentKeys.all(userId), queryFn: fetchConsents, staleTime: CONSENTS_STALE_MS });
      status = statusOf(list);
    } catch {
      return true;
    }
    if (status === "granted") return true;
    if (status === "withdrawn" && !askAgain) return false;

    // The step saves an answer itself; closing it without one leaves the question open.
    return useSensitiveInfoPrompt.getState().ask();
  }
}
