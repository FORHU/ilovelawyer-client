import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseArea, CaseRegion, OtherParty, PartyRole, Side } from "./types";

// The draft is kept in this browser (localStorage, per account) so a refresh or a closed tab doesn't
// lose it. Picked files can't be kept, only the text. It is cleared once the case is made, and on
// sign-out.
interface WizardState {
  /** The account the draft belongs to, so another account on this browser never sees it. */
  ownerId: string | null;
  step: number;
  maxStep: number;
  titleErr: boolean;
  regionErr: boolean;
  title: string;
  /** Which part of the UK, or outside it. Needed to find the right lawyer later. */
  region: CaseRegion | "";
  where: string;
  area: CaseArea;
  side: Side;
  others: OtherParty[];
  /** Optional: what happened, and what the client wants out of it. Sent as the case's notes. */
  happened: string;
  wants: string;
  /** Picked here, uploaded once the case exists (after payment). Kept in memory only. */
  files: File[];

  /** Keeps the draft if it is this account's, otherwise starts it empty. */
  claimFor: (userId: string) => void;
  /** Reset navigation only (the draft survives leaving and re-entering, like the prototype). */
  enter: () => void;
  set: (patch: Partial<Pick<WizardState, "title" | "region" | "where" | "area" | "side" | "step" | "happened" | "wants">>) => void;
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

const blank = {
  ownerId: null as string | null,
  step: 1,
  maxStep: 1,
  titleErr: false,
  regionErr: false,
  title: "",
  region: "" as CaseRegion | "",
  where: "",
  area: "EMPLOYMENT" as CaseArea,
  side: "" as Side,
  others: [] as OtherParty[],
  happened: "",
  wants: "",
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
  enter: () => set({ step: 1, maxStep: 1, titleErr: false, regionErr: false }),
  set: (patch) => set({ ...patch, ...(patch.region ? { regionErr: false } : {}) }),
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
    const { step, title, region, maxStep } = get();
    if (step === 1 && (!title.trim() || !region)) {
      set({ titleErr: !title.trim(), regionErr: !region });
      return false;
    }
    if (step < 3) {
      set({ step: step + 1, maxStep: Math.max(maxStep, step + 1), titleErr: false, regionErr: false });
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
    if (n <= get().maxStep) set({ step: n });
  },
  // Keeps the owner: the draft is for this account, and the next one starts empty.
  reset: () => set({ ...blank, ownerId: get().ownerId }),
    }),
    {
      name: "ilovelawyer-client-wizard",
      version: 1,
      // Hydrated by the new-case page once it is on the client, so server markup stays stable.
      skipHydration: true,
      partialize: (s) => ({
        ownerId: s.ownerId,
        title: s.title,
        region: s.region,
        where: s.where,
        area: s.area,
        side: s.side,
        others: s.others,
        happened: s.happened,
        wants: s.wants,
      }),
    },
  ),
);
