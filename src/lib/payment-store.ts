import { create } from "zustand";
import type { StripeCheckout, TopUpQuote } from "./billing/api";

/** A payment started with Stripe whose outcome we don't know yet. While it's set, "Pay" never starts
 * another payment: it shows Stripe's form, or checks this one again. */
export interface OpenPayment {
  paymentId: string;
  checkout: StripeCheckout;
  /** Stripe's form has completed; waiting for the API to confirm. */
  submitted: boolean;
}

/** The top-up modal: buying chat credits for one case. Cases themselves are free. */
interface PaymentState {
  open: boolean;
  /** Case receiving the credits. */
  caseId: string | null;
  /** Top-up pack id; null means the API's default pack. */
  pack: string | null;
  promoInput: string;
  /** The API's answer to the last code applied, for the pack it was asked for. */
  quote: TopUpQuote | null;
  /** Dev builds only: ask the dummy provider to decline, to see the failure state. */
  simulateDecline: boolean;
  openPayment: OpenPayment | null;
  error: string;
  processing: boolean;

  openFor: (caseId: string) => void;
  close: () => void;
  /** Clears the quote: a code is checked again against the new pack. */
  setPack: (p: string) => void;
  setPromoInput: (v: string) => void;
  setQuote: (quote: TopUpQuote | null) => void;
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
  caseId: null,
  ...fresh,

  openFor: (caseId) => set({ open: true, caseId, ...fresh }),
  // Closing mid-checkout is fine: nothing is charged, and the unpaid checkout expires on its own.
  close: () => {
    if (!get().processing) set({ open: false, error: "", openPayment: null });
  },
  setPack: (pack) => set({ pack, quote: null }),
  setPromoInput: (promoInput) => set({ promoInput }),
  setQuote: (quote) => set({ quote }),
  setSimulateDecline: (simulateDecline) => set({ simulateDecline }),
  setOpenPayment: (openPayment) => set({ openPayment }),
  setProcessing: (processing) => set({ processing }),
  setError: (error) => set({ error }),
}));
