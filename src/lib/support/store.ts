import { create } from "zustand";
import type { SupportAudience } from "./types";

/** Whether the Support Chat is open, and what it was opened for. */
interface SupportState {
  open: boolean;
  audience: SupportAudience;
  /** A flow to start straight away, instead of showing the topics (say, "Close your account"). */
  startFlowId: string | null;
  openSupport: (options?: { audience?: SupportAudience; startFlowId?: string }) => void;
  close: () => void;
}

export const useSupport = create<SupportState>()((set) => ({
  open: false,
  audience: "SIGNED_IN",
  startFlowId: null,
  openSupport: (options = {}) => set({ open: true, audience: options.audience ?? "SIGNED_IN", startFlowId: options.startFlowId ?? null }),
  close: () => set({ open: false, startFlowId: null }),
}));

/** The Support Chat is built but off until the whole of it (tickets, actions) has shipped. */
export const SUPPORT_CHAT_ENABLED = process.env.NEXT_PUBLIC_SUPPORT_CHAT_ENABLED === "true";
