import { create } from "zustand";
import type { SupportAudience } from "./types";

/** What the client has typed and not yet sent. Kept while the chat is closed (and reopened), so a
 * tap on the backdrop or Escape never costs a long message. In memory only: a reload or sign-out
 * clears it. */
export interface SupportDrafts {
  /** The first message to the team. */
  ticket: string;
  /** A reply in the conversation with the team. */
  team: string;
  visitorEmail: string;
  visitorMessage: string;
}

const NO_DRAFTS: SupportDrafts = { ticket: "", team: "", visitorEmail: "", visitorMessage: "" };

/** Whether the Support Chat is open, and what it was opened for. */
interface SupportState {
  open: boolean;
  audience: SupportAudience;
  /** A flow to start straight away, instead of showing the topics (say, "Close your account"). */
  startFlowId: string | null;
  drafts: SupportDrafts;
  openSupport: (options?: { audience?: SupportAudience; startFlowId?: string }) => void;
  close: () => void;
  setDraft: (key: keyof SupportDrafts, value: string) => void;
}

export const useSupport = create<SupportState>()((set) => ({
  open: false,
  audience: "SIGNED_IN",
  startFlowId: null,
  drafts: NO_DRAFTS,
  openSupport: (options = {}) => set({ open: true, audience: options.audience ?? "SIGNED_IN", startFlowId: options.startFlowId ?? null }),
  close: () => set({ open: false, startFlowId: null }),
  setDraft: (key, value) => set((s) => ({ drafts: { ...s.drafts, [key]: value } })),
}));
