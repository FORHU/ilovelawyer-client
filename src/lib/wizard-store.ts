import { useRouter } from "next/navigation";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EMPTY_BUDGET_DRAFT, ownAmountError, type BudgetDraft } from "./cases/budget";
import type { CaseRegion, OtherParty, PartyRole, Side } from "./types";

/** Details, People, Budget, Documents. */
export const WIZARD_STEPS = 4;
const BUDGET_STEP = 3;

const WIZARD_STORAGE_KEY = "ilovelawyer-client-wizard";

// The draft is kept in this tab (sessionStorage, per account) so a refresh doesn't lose it. Picked
// files can't be kept, only the text. Every way into New case starts a fresh one (startNewCase), and
// it's cleared once the case is made and on sign-out; a new tab starts empty.
interface WizardState {
  /** The account the draft belongs to, so another account on this browser never sees it. */
  ownerId: string | null;
  step: number;
  maxStep: number;
  titleErr: boolean;
  regionErr: boolean;
  areasErr: boolean;
  /** "Set my own amount" was chosen but what's typed isn't an amount. */
  budgetErr: boolean;
  title: string;
  /** Which part of the UK, or outside it. Needed to find the right lawyer later. */
  region: CaseRegion | "";
  where: string;
  /** Case area codes, one or more. */
  areas: string[];
  side: Side;
  others: OtherParty[];
  /** Optional: what happened, and what the client wants out of it. Sent as the case's notes. */
  happened: string;
  wants: string;
  /** Optional: what they can spend on a lawyer. Empty: "Not sure". */
  budget: BudgetDraft;
  /** Picked here, uploaded once the case exists (after payment). Kept in memory only. */
  files: File[];

  /** Keeps the draft if it is this account's, otherwise starts it empty. */
  claimFor: (userId: string) => void;
  /** Reset navigation only (the draft survives leaving and re-entering, like the prototype). */
  enter: () => void;
  set: (patch: Partial<Pick<WizardState, "title" | "region" | "where" | "areas" | "side" | "step" | "happened" | "wants">>) => void;
  setBudget: (patch: Partial<BudgetDraft>) => void;
  addOther: () => void;
  updateOther: (id: string, patch: Partial<Pick<OtherParty, "name" | "role">>) => void;
  removeOther: (id: string) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  /** Validates the current step, then advances. Returns true when the last step is done. */
  next: () => boolean;
  back: () => boolean;
  goTo: (n: number) => void;
  reset: () => void;
}

/** What's kept in localStorage (partialize below). */
type PersistedDraft = Pick<WizardState, "ownerId" | "title" | "region" | "where" | "areas" | "side" | "others" | "happened" | "wants" | "budget">;

const blank = {
  ownerId: null as string | null,
  step: 1,
  maxStep: 1,
  titleErr: false,
  regionErr: false,
  areasErr: false,
  budgetErr: false,
  title: "",
  region: "" as CaseRegion | "",
  where: "",
  areas: [] as string[],
  side: "" as Side,
  others: [] as OtherParty[],
  happened: "",
  wants: "",
  budget: EMPTY_BUDGET_DRAFT,
  files: [] as File[],
};

export const useWizard = create<WizardState>()(
  persist(
    (set, get) => ({
  ...blank,

  claimFor: (userId) => {
    if (get().ownerId === userId) return;
    set({ ...blank, ownerId: userId });
  },
  enter: () => set({ step: 1, maxStep: 1, titleErr: false, regionErr: false, areasErr: false, budgetErr: false }),
  set: (patch) => set({ ...patch, ...(patch.region ? { regionErr: false } : {}), ...(patch.areas?.length ? { areasErr: false } : {}) }),
  setBudget: (patch) => set((s) => ({ budget: { ...s.budget, ...patch }, budgetErr: false })),
  addOther: () =>
    set((s) => ({
      others: [
        ...s.others,
        { id: "o" + Date.now(), name: "", role: "Opposing party" as PartyRole },
      ],
    })),
  updateOther: (id, patch) =>
    set((s) => ({ others: s.others.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
  removeOther: (id) => set((s) => ({ others: s.others.filter((o) => o.id !== id) })),
  addFiles: (files) => set((s) => ({ files: [...s.files, ...files] })),
  removeFile: (index) => set((s) => ({ files: s.files.filter((_, i) => i !== index) })),
  next: () => {
    const { step, title, region, areas, budget, maxStep } = get();
    if (step === 1 && (!title.trim() || !region || areas.length === 0)) {
      set({ titleErr: !title.trim(), regionErr: !region, areasErr: areas.length === 0 });
      return false;
    }
    if (step === BUDGET_STEP && ownAmountError(budget)) {
      set({ budgetErr: true });
      return false;
    }
    if (step < WIZARD_STEPS) {
      set({ step: step + 1, maxStep: Math.max(maxStep, step + 1), titleErr: false, regionErr: false, areasErr: false, budgetErr: false });
      return false;
    }
    // The last step creates the case: one more check, for an own amount changed and then left
    // through the step list.
    if (ownAmountError(budget)) {
      set({ step: BUDGET_STEP, budgetErr: true });
      return false;
    }
    return true;
  },
  back: () => {
    const { step } = get();
    if (step > 1) {
      set({ step: step - 1 });
      return false;
    }
    return true;
  },
  goTo: (n) => {
    const { step, budget, maxStep } = get();
    if (n > maxStep) return;
    // Leaving Budget through the step list checks the own amount, as Continue does.
    if (step === BUDGET_STEP && n !== BUDGET_STEP && ownAmountError(budget)) {
      set({ budgetErr: true });
      return;
    }
    set({ step: n });
  },
  // Keeps the owner: the draft is for this account, and the next one starts empty.
  reset: () => set({ ...blank, ownerId: get().ownerId }),
    }),
    {
      name: WIZARD_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      // 2: a case can have several areas (`areas`), where version 1 kept one (`area`).
      version: 2,
      migrate: (persisted, version) => {
        const { area, ...draft } = persisted as PersistedDraft & { area?: string };
        return version < 2 && area ? { ...draft, areas: [area] } : draft;
      },
      // Hydrated by the new-case page once it is on the client, so server markup stays stable.
      skipHydration: true,
      // Drafts used to be kept in localStorage, where one left behind came back on every visit.
      onRehydrateStorage: () => () => {
        try {
          localStorage.removeItem(WIZARD_STORAGE_KEY);
        } catch {
          // Storage blocked: nothing was kept there either.
        }
      },
      partialize: (s) => ({
        ownerId: s.ownerId,
        title: s.title,
        region: s.region,
        where: s.where,
        areas: s.areas,
        side: s.side,
        others: s.others,
        happened: s.happened,
        wants: s.wants,
        budget: s.budget,
      }),
    },
  ),
);

/** Every way into New case calls this first, so the form starts empty. A refresh doesn't go
 * through it, so it keeps what was typed. */
export function startNewCase() {
  useWizard.getState().reset();
}

/** Starts a fresh draft and opens New case: for a button (a link calls startNewCase itself). */
export function useStartNewCase() {
  const router = useRouter();
  return () => {
    startNewCase();
    router.push("/cases/new");
  };
}
