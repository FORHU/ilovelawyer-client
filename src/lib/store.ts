import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSession } from "./auth/session";
import { CASE_CREDITS } from "./pricing";
import { SAMPLE_FILES } from "./sample-data";
import type { Case, LawyerStatus, ThreadMessage } from "./types";

// Who is signed in lives in ./auth/session (from the API). This store keeps the app data that is
// still mocked (cases, the lawyer thread) plus UI state, persisted per browser.

interface AppState {
  /** The account the persisted cases belong to. They're still local-only, so another account
   * signing in on this browser must not see them (see claimFor). */
  ownerId: string | null;
  /** Dismissible success banner at the top of the app shell. */
  banner: string;

  cases: Case[];
  /** Lawyer request for one case at a time (prototype behaviour). */
  lawyer: { status: LawyerStatus; caseId: number | null };
  /** Messages with the lawyer for the case in `lawyer.caseId`. */
  thread: ThreadMessage[];
  lawyerUnread: boolean;
  sidebarCollapsed: boolean;

  setBanner: (message: string) => void;
  toggleSidebar: () => void;
  /** Adds a paid case and returns its id. */
  addCase: (data: Omit<Case, "id" | "credits" | "chat">) => number;
  addCredits: (caseId: number, credits: number) => void;
  /** User asks the AI: costs 1 credit. No-op without credits. Returns whether it was sent. */
  askAi: (caseId: number, text: string) => boolean;
  /** Appends the AI answer (and the lawyer offer while no request exists). */
  answerAi: (caseId: number, text: string) => void;
  /** Attaching a document is free; it is added to the case and the AI acknowledges it. */
  attachToChat: (caseId: number) => void;
  addCaseFile: (caseId: number) => void;
  /** Free lawyer request for a case. */
  requestLawyer: (caseId: number) => void;
  cancelLawyerRequest: () => void;
  /** Client message (or shared file) in the lawyer thread. */
  sendToLawyer: (text: string, file?: boolean) => void;
  /** Shares a sample document in the lawyer thread and adds it to the case documents. */
  attachToLawyer: () => void;
  markLawyerRead: () => void;
  /** DEMO ONLY (dev builds): stands in for the lawyer app until real matching exists. */
  demoLawyerAccept: () => void;
  demoLawyerResolve: () => void;
  /** @internal */
  _patchCase: (id: number, fn: (c: Case) => Case) => void;
  /** Called when an account signs in: keeps this browser's data if it is that account's, else
   * starts it empty. */
  claimFor: (userId: string) => void;
  /** Clears the account's local data on sign-out. */
  signOut: () => void;
}

const EMPTY_USER_DATA = {
  cases: [] as Case[],
  lawyer: { status: "none" as LawyerStatus, caseId: null },
  thread: [] as ThreadMessage[],
  lawyerUnread: false,
  banner: "",
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      banner: "",
      cases: [],
      lawyer: { status: "none", caseId: null },
      thread: [],
      lawyerUnread: false,
      sidebarCollapsed: false,

      setBanner: (banner) => set({ banner }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      addCase: (data) => {
        const id = get().cases.reduce((m, c) => Math.max(m, c.id), 0) + 1;
        set((s) => ({
          cases: [...s.cases, { ...data, id, credits: CASE_CREDITS, chat: [] }],
        }));
        return id;
      },
      addCredits: (caseId, credits) =>
        set((s) => ({
          cases: s.cases.map((c) => (c.id === caseId ? { ...c, credits: c.credits + credits } : c)),
        })),
      askAi: (caseId, text) => {
        const c = get().cases.find((x) => x.id === caseId);
        const msg = text.trim();
        if (!c || !msg || c.credits <= 0) return false;
        get()._patchCase(caseId, (x) => ({
          ...x,
          credits: x.credits - 1,
          chat: [...x.chat.filter((m) => m.role !== "offer"), { role: "user", text: msg }],
        }));
        return true;
      },
      answerAi: (caseId, text) => {
        const noRequest = get().lawyer.status === "none";
        get()._patchCase(caseId, (x) => ({
          ...x,
          chat: [
            ...x.chat.filter((m) => m.role !== "offer"),
            { role: "ai", text },
            ...(noRequest ? [{ role: "offer" as const }] : []),
          ],
        }));
      },
      attachToChat: (caseId) => {
        const c = get().cases.find((x) => x.id === caseId);
        if (!c) return;
        const name = nextSampleFile(c.files);
        const noRequest = get().lawyer.status === "none";
        get()._patchCase(caseId, (x) => ({
          ...x,
          files: [...x.files, name],
          chat: [
            ...x.chat.filter((m) => m.role !== "offer"),
            { role: "file", text: name },
            {
              role: "ai",
              text: `Got it. I've added "${name}" to this case and will use it when answering your questions.`,
            },
            ...(noRequest ? [{ role: "offer" as const }] : []),
          ],
        }));
      },
      addCaseFile: (caseId) => {
        const c = get().cases.find((x) => x.id === caseId);
        if (!c) return;
        const name = SAMPLE_FILES.find((f) => !c.files.includes(f));
        if (name) get()._patchCase(caseId, (x) => ({ ...x, files: [...x.files, name] }));
      },
      requestLawyer: (caseId) => {
        if (get().lawyer.status !== "none") return;
        set({
          lawyer: { status: "matching", caseId },
          thread: [],
          lawyerUnread: false,
          banner: "Request sent. Verified lawyers are reviewing your case.",
        });
      },
      cancelLawyerRequest: () =>
        set({
          lawyer: { status: "none", caseId: null },
          thread: [],
          lawyerUnread: false,
          banner: "Request cancelled.",
        }),
      sendToLawyer: (text, file) => {
        const t = text.trim();
        if (!t) return;
        set((s) => ({ thread: [...s.thread, { role: "user", text: t, file }] }));
      },
      attachToLawyer: () => {
        const { lawyer, cases } = get();
        const c = cases.find((x) => x.id === lawyer.caseId);
        if (!c) return;
        const name = nextSampleFile(c.files);
        get()._patchCase(c.id, (x) => ({ ...x, files: [...x.files, name] }));
        set((s) => ({ thread: [...s.thread, { role: "user", text: name, file: true }] }));
      },
      markLawyerRead: () => set({ lawyerUnread: false }),
      demoLawyerAccept: () => {
        const first = useSession.getState().user?.name?.split(" ")[0] || "there";
        set((s) => ({
          lawyer: { ...s.lawyer, status: "accepted" },
          lawyerUnread: true,
          thread: [
            { role: "event", text: "Atty. Maria Reyes accepted your request" },
            {
              role: "lawyer",
              text: `Hi ${first}, I've read your case and the documents you attached. Can you tell me in your own words what happened, and when?`,
            },
          ],
        }));
      },
      demoLawyerResolve: () =>
        set((s) => ({ lawyer: { ...s.lawyer, status: "closed" }, lawyerUnread: true })),
      _patchCase: (id, fn) =>
        set((s) => ({ cases: s.cases.map((c) => (c.id === id ? fn(c) : c)) })),
      claimFor: (userId) => {
        if (get().ownerId === userId) return;
        set({ ...EMPTY_USER_DATA, ownerId: userId });
      },
      signOut: () => set({ ...EMPTY_USER_DATA, ownerId: null }),
    }),
    {
      name: "ilovelawyer-client",
      // v1: auth moved to the API. v0 data (mock sign-in fields, demo cases) belongs to no real
      // account, so it is dropped rather than shown to whoever signs in first.
      version: 1,
      migrate: () => ({ ownerId: null, ...EMPTY_USER_DATA }) as unknown as AppState,
      // Hydrate on the client (see useHydrated) so SSR markup stays stable.
      skipHydration: true,
      partialize: (s) => ({
        ownerId: s.ownerId,
        cases: s.cases,
        lawyer: s.lawyer,
        thread: s.thread,
        lawyerUnread: s.lawyerUnread,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);

export function nextSampleFile(files: string[]) {
  return SAMPLE_FILES.find((f) => !files.includes(f)) ?? `Document ${files.length + 1}.pdf`;
}

export function lawyerLabel(status: LawyerStatus) {
  return status === "matching"
    ? "Finding a lawyer"
    : status === "accepted"
      ? "Lawyer chatting"
      : status === "closed"
        ? "Resolved"
        : "";
}
