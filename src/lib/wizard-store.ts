import { create } from "zustand";
import type { CaseArea, CaseRegion, OtherParty, PartyRole, Side } from "./types";

interface WizardState {
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
  /** Picked here, uploaded once the case exists (after payment). Kept in memory only. */
  files: File[];

  /** Reset navigation only (the draft survives leaving and re-entering, like the prototype). */
  enter: () => void;
  set: (patch: Partial<Pick<WizardState, "title" | "region" | "where" | "area" | "side" | "step">>) => void;
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
  files: [] as File[],
};

export const useWizard = create<WizardState>((set, get) => ({
  ...blank,

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
  reset: () => set({ ...blank }),
}));
