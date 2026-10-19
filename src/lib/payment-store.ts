import { create } from "zustand";

export type PaymentKind = "case" | "topup";

interface PaymentState {
  open: boolean;
  kind: PaymentKind;
  openFor: (kind: PaymentKind) => void;
  close: () => void;
}

export const usePayment = create<PaymentState>((set) => ({
  open: false,
  kind: "case",
  openFor: (kind) => set({ open: true, kind }),
  close: () => set({ open: false }),
}));
