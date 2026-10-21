import { create } from "zustand";
import { DEFAULT_PACK, PROMO_CODE, type PackId } from "./pricing";

export type PaymentKind = "case" | "topup";
export type PayMethod = "card" | "bank";

interface PaymentState {
  open: boolean;
  kind: PaymentKind;
  /** Case receiving the credits when kind === "topup". */
  caseId: string | null;
  pack: PackId;
  method: PayMethod;
  card: { number: string; expiry: string; cvc: string };
  promoInput: string;
  promoApplied: boolean;
  promoMessage: string;
  error: string;
  processing: boolean;

  openFor: (kind: PaymentKind, caseId?: string | null) => void;
  close: () => void;
  setPack: (p: PackId) => void;
  setMethod: (m: PayMethod) => void;
  setCard: (patch: Partial<PaymentState["card"]>) => void;
  setPromoInput: (v: string) => void;
  applyPromo: () => void;
  setProcessing: (v: boolean) => void;
  setError: (message: string) => void;
}

export const usePayment = create<PaymentState>((set, get) => ({
  open: false,
  kind: "case",
  caseId: null,
  pack: DEFAULT_PACK,
  method: "card",
  card: { number: "", expiry: "", cvc: "" },
  promoInput: "",
  promoApplied: false,
  promoMessage: "",
  error: "",
  processing: false,

  openFor: (kind, caseId = null) =>
    set({
      open: true,
      kind,
      caseId,
      pack: DEFAULT_PACK,
      method: "card",
      promoInput: "",
      promoApplied: false,
      promoMessage: "",
      error: "",
      processing: false,
    }),
  close: () => {
    if (!get().processing) set({ open: false, error: "" });
  },
  setPack: (pack) => set({ pack }),
  setMethod: (method) => set({ method, error: "" }),
  setCard: (patch) => set((s) => ({ card: { ...s.card, ...patch } })),
  setPromoInput: (promoInput) => set({ promoInput }),
  applyPromo: () => {
    const { promoInput, kind } = get();
    if (promoInput.trim().toUpperCase() !== PROMO_CODE) {
      set({ promoApplied: false, promoMessage: "That code isn't valid." });
    } else if (kind === "case") {
      set({ promoApplied: true, promoMessage: "WELCOME5 applied: $5 off your first case." });
    } else {
      set({ promoApplied: false, promoMessage: "WELCOME5 only applies to creating a case." });
    }
  },
  setProcessing: (processing) => set({ processing }),
  setError: (error) => set({ error }),
}));
