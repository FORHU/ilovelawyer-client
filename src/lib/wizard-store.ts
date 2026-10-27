import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseRegion, OtherParty, PartyRole, Side } from "./types";

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
  areasErr: boolean;
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
  /** Picked here, uploaded once the case exists (after payment). Kept in memory only. */
  files: File[];

  /** Keeps the draft if it is this account's, otherwise starts it empty. */
  claimFor: (userId: string) => void;
  /** Reset navigation only (the draft survives leaving and re-entering, like the prototype). */
  enter: () => void;
  set: (patch: Partial<Pick<WizardState, "title" | "region" | "where" | "areas" | "side" | "step" | "happened" | "wants">>) => void;
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
type PersistedDraft = Pick<WizardState, "ownerId" | "title" | "region" | "where" | "areas" | "side" | "others" | "happened" | "wants">;

const blank = {
  ownerId: null as string | null,
  step: 1,
  maxStep: 1,
  titleErr: false,
  regionErr: false,
  areasErr: false,
  title: "",
  region: "" as CaseRegion | "",
  where: "",
  areas: [] as string[],
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
  enter: () => set({ step: 1, maxStep: 1, titleErr: false, regionErr: false, areasErr: false }),
  set: (patch) => set({ ...patch, ...(patch.region ? { regionErr: false } : {}), ...(patch.areas?.length ? { areasErr: false } : {}) }),
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
    const { step, title, region, areas, maxStep } = get();
    if (step === 1 && (!title.trim() || !region || areas.length === 0)) {
      set({ titleErr: !title.trim(), regionErr: !region, areasErr: areas.length === 0 });
      return false;
    }
    if (step < 3) {
      set({ step: step + 1, maxStep: Math.max(maxStep, step + 1), titleErr: false, regionErr: false, areasErr: false });
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
      // 2: a case can have several areas (`areas`), where version 1 kept one (`area`).
      version: 2,
      migrate: (persisted, version) => {
        const { area, ...draft } = persisted as PersistedDraft & { area?: string };
        return version < 2 && area ? { ...draft, areas: [area] } : draft;
      },
      // Hydrated by the new-case page once it is on the client, so server markup stays stable.
      skipHydration: true,
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
      }),
    },
  ),
);
