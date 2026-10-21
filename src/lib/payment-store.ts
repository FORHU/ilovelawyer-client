import { create } from "zustand";
import type { CaseQuote, StripeCheckout } from "./billing/api";

export type PaymentKind = "case" | "topup";

/** A payment started with Stripe whose outcome we don't know yet. While it's set, "Pay" never starts
 * another payment: it shows Stripe's form, or checks this one again. */
export interface OpenPayment {
  paymentId: string;
  checkout: StripeCheckout;
  /** Stripe's form has completed; waiting for the API to confirm. */
  submitted: boolean;
}

interface PaymentState {
  open: boolean;
  kind: PaymentKind;
  /** Case receiving the credits when kind === "topup". */
  caseId: string | null;
  /** Top-up pack id; null means the API's default pack. */
  pack: string | null;
  promoInput: string;
  /** The API's answer to the last code applied. */
  quote: CaseQuote | null;
  /** Dev builds only: ask the dummy provider to decline, to see the failure state. */
  simulateDecline: boolean;
  openPayment: OpenPayment | null;
  error: string;
  processing: boolean;

  openFor: (kind: PaymentKind, caseId?: string | null) => void;
  close: () => void;
  setPack: (p: string) => void;
  setPromoInput: (v: string) => void;
  setQuote: (quote: CaseQuote | null) => void;
  setSimulateDecline: (v: boolean) => void;
  setOpenPayment: (p: OpenPayment | null) => void;
  setProcessing: (v: boolean) => void;
  setError: (message: string) => void;
}

const fresh = {
  pack: null,
  promoInput: "",
  quote: null,
  simulateDecline: false,
  openPayment: null,
  error: "",
  processing: false,
};

export const usePayment = create<PaymentState>((set, get) => ({
  open: false,
  kind: "case",
  caseId: null,
  ...fresh,

  openFor: (kind, caseId = null) => set({ open: true, kind, caseId, ...fresh }),
  // Closing mid-checkout is fine: nothing is charged, and the unpaid checkout expires on its own.
  close: () => {
    if (!get().processing) set({ open: false, error: "", openPayment: null });
  },
  setPack: (pack) => set({ pack }),
  setPromoInput: (promoInput) => set({ promoInput }),
  setQuote: (quote) => set({ quote }),
  setSimulateDecline: (simulateDecline) => set({ simulateDecline }),
  setOpenPayment: (openPayment) => set({ openPayment }),
  setProcessing: (processing) => set({ processing }),
  setError: (error) => set({ error }),
}));
