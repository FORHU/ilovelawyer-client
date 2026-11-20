import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSession } from "@/lib/auth/session";
import { currentSite } from "@/lib/tenant/current-site";
import type { LawyerReadiness } from "@/lib/cases/readiness";
import type { IneligibleReason, LawyerRequest, LawyerRequestEligibility } from "@/lib/lawyer-requests/api";
import type { Case } from "@/lib/types";
import { takesCase, useMarketplaceCase, type ClientLawyer } from "./marketplace";

// Find a lawyer first (Path A): the client picks a lawyer before they have a case. The lawyer is
// held here while they tell us about it on New case, then kept against the case it became, so
// once the case has what a lawyer needs (lib/cases/readiness.ts) the Interview offers to send it
// to that lawyer by name. In localStorage, as a case can take a few visits to get there.

/** What's needed to name the lawyer and to check they take the case (takesCase). */
export type ChosenLawyer = Pick<ClientLawyer, "id" | "name" | "caseAreas" | "qualifiedJurisdictions">;

interface ChosenLawyerState {
  /** Chosen for the next new case, by this client. */
  pending: (ChosenLawyer & { ownerId: string }) | null;
  /** Chosen for a case, by case id. */
  byCase: Record<string, ChosenLawyer>;
  choose: (lawyer: ChosenLawyer, ownerId: string) => void;
  clearPending: () => void;
  /** The case is made: the pending lawyer (if it's this client's) goes with it. */
  attach: (caseId: string, ownerId: string) => void;
  /** Sent, or the client went another way. */
  forget: (caseId: string) => void;
  /** Signed out: nothing of this account stays in the browser. */
  clear: () => void;
}

export const CHOSEN_LAWYER_STORAGE_KEY = "ilovelawyer.chosen-lawyer";

const only = ({ id, name, caseAreas, qualifiedJurisdictions }: ChosenLawyer): ChosenLawyer => ({ id, name, caseAreas, qualifiedJurisdictions });

export const useChosenLawyer = create<ChosenLawyerState>()(
  persist(
    (set) => ({
      pending: null,
      byCase: {},
      choose: (lawyer, ownerId) => set({ pending: { ...only(lawyer), ownerId } }),
      clearPending: () => set({ pending: null }),
      attach: (caseId, ownerId) =>
        set((s) => {
          if (!s.pending || s.pending.ownerId !== ownerId) return s;
          return { pending: null, byCase: { ...s.byCase, [caseId]: only(s.pending) } };
        }),
      forget: (caseId) =>
        set((s) => {
          if (!(caseId in s.byCase)) return s;
          const rest = { ...s.byCase };
          delete rest[caseId];
          return { byCase: rest };
        }),
      clear: () => set({ pending: null, byCase: {} }),
    }),
    { name: CHOSEN_LAWYER_STORAGE_KEY, storage: createJSONStorage(() => localStorage) },
  ),
);

// However the session ends (signing out, deleting the account, or a refresh that failed, see
// apiFetch), what's remembered for the account goes with it. Here, not in session.ts, which
// marketplace.ts (imported above) already imports.
useSession.subscribe((s, prev) => {
  if (prev.user && !s.user) useChosenLawyer.getState().clear();
});

/** The lawyer this client chose for their next case, if any. */
export function usePendingLawyer(ownerId: string | undefined) {
  return useChosenLawyer((s) => (ownerId && s.pending?.ownerId === ownerId ? s.pending : null));
}

/** Whether the chosen lawyer takes the case: "unknown" until the case has its area (and, on the UK,
 * its part of the UK), then "fits" or "mismatch". Another site (KR) has no parts: area alone. */
export function chosenLawyerFit(lawyer: ChosenLawyer, c: Pick<Case, "areas" | "ukJurisdiction">): "unknown" | "fits" | "mismatch" {
  if (c.areas.length === 0 || (currentSite() === "UK" && !c.ukJurisdiction)) return "unknown";
  return takesCase(lawyer, c) ? "fits" : "mismatch";
}

/** The client went another way on Find a lawyer: drop this lawyer and browse again, with the
 * marketplace set to this case. */
export function pickAnotherLawyer(caseId: string, push: (href: string) => void) {
  useMarketplaceCase.getState().set(caseId);
  useChosenLawyer.getState().forget(caseId);
  push("/lawyers");
}

/** Why the case can't go to a lawyer yet, in NOT_AVAILABLE_TEXT's terms (get-lawyer-action.tsx). */
export type NotReadyReason = Exclude<IneligibleReason, "REQUEST_ALREADY_OPEN">;

/** What the case shows for a lawyer chosen first (Find a lawyer), on the Overview and in the header:
 * - `sent`: a request is with one lawyer by name, and only them for now. Read from the request, not
 *   the store, which is cleared on send.
 * - `not-ready`: the case can't go to a lawyer yet (`reason`), or is missing what one needs
 *   (`missing`, from the readiness check).
 * - `mismatch`: the case is known well enough to say the lawyer doesn't take it.
 * - `ready`: send it to them. With the fit still unknown, the API checks on send.
 * - `none`: no lawyer chosen, a request already open, or still loading: the usual way to get a lawyer. */
export type ChosenLawyerCardState =
  | { kind: "none" }
  | { kind: "sent"; lawyer: { id: string; name: string }; routingExpiresAt: string | null }
  | { kind: "not-ready"; lawyer: ChosenLawyer; reason: NotReadyReason | null; missing: LawyerReadiness["criteria"] }
  | { kind: "mismatch"; lawyer: ChosenLawyer }
  | { kind: "ready"; lawyer: ChosenLawyer };

export interface ChosenLawyerCardInput {
  chosen: ChosenLawyer | null;
  theCase: Pick<Case, "areas" | "ukJurisdiction"> | undefined;
  eligibility: LawyerRequestEligibility | undefined;
  /** Undefined until it's loaded, or while there's no AI answer to check against. */
  readiness: LawyerReadiness | undefined;
  /** Whether the site runs the readiness check at all (the AI chat and requests both open). */
  readinessExpected: boolean;
  openRequest: Pick<LawyerRequest, "requestedLawyer" | "requestedOnly" | "routingExpiresAt"> | null | undefined;
}

const BLOCKED_BY: Record<NonNullable<LawyerReadiness["blockedBy"]>, NotReadyReason> = {
  OUTSIDE_UK: "NOT_UK_CASE",
  PERSONAL_INJURY: "PERSONAL_INJURY_EXCLUDED",
};

export function chosenLawyerCardState({ chosen, theCase, eligibility, readiness, readinessExpected, openRequest }: ChosenLawyerCardInput): ChosenLawyerCardState {
  if (openRequest) {
    return openRequest.requestedOnly && openRequest.requestedLawyer
      ? { kind: "sent", lawyer: openRequest.requestedLawyer, routingExpiresAt: openRequest.routingExpiresAt ?? null }
      : { kind: "none" };
  }
  if (!chosen || !eligibility) return { kind: "none" };
  if (!eligibility.eligible) {
    // An open request the client hasn't loaded yet: it'll show as one in a moment.
    if (!eligibility.reason || eligibility.reason === "REQUEST_ALREADY_OPEN") return { kind: "none" };
    return { kind: "not-ready", lawyer: chosen, reason: eligibility.reason, missing: [] };
  }
  if (readiness?.blockedBy) return { kind: "not-ready", lawyer: chosen, reason: BLOCKED_BY[readiness.blockedBy], missing: [] };
  // A check that couldn't run this time doesn't hold the client back: the API checks on send.
  const checked = readiness && !readiness.unavailable;
  if (readinessExpected && (!readiness || (checked && readiness.enabled && !readiness.ready))) {
    return { kind: "not-ready", lawyer: chosen, reason: null, missing: readiness?.criteria.filter((c) => !c.met) ?? [] };
  }
  // Only once it's ready: a case made from the chat starts with a guessed area (or "OTHER") that the
  // AI corrects as it goes, so an early mismatch would be wrong.
  if (theCase && chosenLawyerFit(chosen, theCase) === "mismatch") return { kind: "mismatch", lawyer: chosen };
  return { kind: "ready", lawyer: chosen };
}
