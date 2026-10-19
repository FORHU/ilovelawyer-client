import { create } from "zustand";
import { SAMPLE_FILES } from "./sample-data";
import type { CaseArea, OtherParty, PartyRole, Side } from "./types";

interface WizardState {
  step: number;
  maxStep: number;
  titleErr: boolean;
  title: string;
  where: string;
  area: CaseArea;
  side: Side;
  others: OtherParty[];
  files: string[];

  /** Reset navigation only (the draft survives leaving and re-entering, like the prototype). */
  enter: () => void;
  set: (patch: Partial<Pick<WizardState, "title" | "where" | "area" | "side" | "step">>) => void;
  addOther: () => void;
  updateOther: (id: string, patch: Partial<Pick<OtherParty, "name" | "role">>) => void;
  removeOther: (id: string) => void;
  addSampleFile: () => void;
  removeFile: (name: string) => void;
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
  title: "",
  where: "",
  area: "Employment" as CaseArea,
  side: "" as Side,
  others: [] as OtherParty[],
  files: [] as string[],
};

export const useWizard = create<WizardState>((set, get) => ({
  ...blank,

  enter: () => set({ step: 1, maxStep: 1, titleErr: false }),
  set: (patch) => set(patch),
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
  addSampleFile: () => {
    const next = SAMPLE_FILES.find((f) => !get().files.includes(f));
    if (next) set((s) => ({ files: [...s.files, next] }));
  },
  removeFile: (name) => set((s) => ({ files: s.files.filter((f) => f !== name) })),
  next: () => {
    const { step, title, maxStep } = get();
    if (step === 1 && !title.trim()) {
      set({ titleErr: true });
      return false;
    }
    if (step < 3) {
      set({ step: step + 1, maxStep: Math.max(maxStep, step + 1), titleErr: false });
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
