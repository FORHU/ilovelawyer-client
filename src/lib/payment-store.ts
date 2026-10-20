import { create } from "zustand";
import type { CaseQuote } from "./billing/api";

export type PaymentKind = "case" | "topup";
export type PayMethod = "card" | "bank";

interface PaymentState {
  open: boolean;
  kind: PaymentKind;
  /** Case receiving the credits when kind === "topup". */
  caseId: string | null;
  /** Top-up pack id; null means the API's default pack. */
  pack: string | null;
  method: PayMethod;
  /** Only ever kept in this form: card details are never sent anywhere (the payment is a dummy). */
  card: { number: string; expiry: string; cvc: string };
  promoInput: string;
  /** The API's answer to the last code applied. */
  quote: CaseQuote | null;
  error: string;
  processing: boolean;

  openFor: (kind: PaymentKind, caseId?: string | null) => void;
  close: () => void;
  setPack: (p: string) => void;
  setMethod: (m: PayMethod) => void;
  setCard: (patch: Partial<PaymentState["card"]>) => void;
  setPromoInput: (v: string) => void;
  setQuote: (quote: CaseQuote | null) => void;
  setProcessing: (v: boolean) => void;
  setError: (message: string) => void;
}

export const usePayment = create<PaymentState>((set, get) => ({
  open: false,
  kind: "case",
  caseId: null,
  pack: null,
  method: "card",
  card: { number: "", expiry: "", cvc: "" },
  promoInput: "",
  quote: null,
  error: "",
  processing: false,

  openFor: (kind, caseId = null) =>
    set({
      open: true,
      kind,
      caseId,
      pack: null,
      method: "card",
      card: { number: "", expiry: "", cvc: "" },
      promoInput: "",
      quote: null,
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
  setQuote: (quote) => set({ quote }),
  setProcessing: (processing) => set({ processing }),
  setError: (error) => set({ error }),
}));
