import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Case } from "@/lib/types";
import { takesCase, type ClientLawyer } from "./marketplace";

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
    }),
    { name: CHOSEN_LAWYER_STORAGE_KEY, storage: createJSONStorage(() => localStorage) },
  ),
);

/** The lawyer this client chose for their next case, if any. */
export function usePendingLawyer(ownerId: string | undefined) {
  return useChosenLawyer((s) => (ownerId && s.pending?.ownerId === ownerId ? s.pending : null));
}

/** Whether the chosen lawyer takes the case: "unknown" until the case has its area and part of the
 * UK, then "fits" or "mismatch". */
export function chosenLawyerFit(lawyer: ChosenLawyer, c: Pick<Case, "areas" | "ukJurisdiction">): "unknown" | "fits" | "mismatch" {
  if (!c.ukJurisdiction || c.areas.length === 0) return "unknown";
  return takesCase(lawyer, c) ? "fits" : "mismatch";
}
