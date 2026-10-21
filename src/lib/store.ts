import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSession } from "./auth/session";
import { SAMPLE_FILES } from "./sample-data";
import type { LawyerStatus, ThreadMessage } from "./types";

// Who is signed in lives in ./auth/session, and cases, documents and the AI chat come from the API
// (./cases), as do payments and chat credits (./billing) and the lawyer request itself
// (./lawyer-requests). This store keeps what is still mocked (what happens after the request: a
// lawyer accepting, and the thread with them) plus UI state, persisted per browser.

interface AppState {
  /** The account the persisted data belongs to, so another account signing in on this browser
   * doesn't see it (see claimFor). */
  ownerId: string | null;
  /** Dismissible success banner at the top of the app shell. */
  banner: string;

  /** Lawyer request for one case at a time (prototype behaviour). `requestId` is the real request
   * in the API; what happens after it ("accepted", "closed") is still mocked. */
  lawyer: { status: LawyerStatus; caseId: string | null; requestId: string | null };
  /** Messages with the lawyer for the case in `lawyer.caseId`. */
  thread: ThreadMessage[];
  lawyerUnread: boolean;
  sidebarCollapsed: boolean;

  setBanner: (message: string) => void;
  toggleSidebar: () => void;
  /** A request was just made in the API (the request form). */
  requestLawyer: (caseId: string, requestId: string) => void;
  /** The request was withdrawn in the API. */
  cancelLawyerRequest: () => void;
  /** Lines this browser up with the API: shows a request made on another device, and drops one
   * withdrawn elsewhere. Leaves the mocked later states ("accepted", "closed") alone. */
  syncLawyerRequest: (caseId: string, openRequestId: string | null) => void;
  /** Client message (or shared file) in the lawyer thread. */
  sendToLawyer: (text: string, file?: boolean) => void;
  /** Shares a sample document in the lawyer thread. */
  attachToLawyer: () => void;
  markLawyerRead: () => void;
  /** DEMO ONLY (dev builds): stands in for the lawyer app until real matching exists. */
  demoLawyerAccept: () => void;
  demoLawyerResolve: () => void;
  /** Called when an account signs in: keeps this browser's data if it is that account's, else
   * starts it empty. */
  claimFor: (userId: string) => void;
  /** Clears the account's local data on sign-out. */
  signOut: () => void;
}

const EMPTY_USER_DATA = {
  lawyer: { status: "none" as LawyerStatus, caseId: null, requestId: null },
  thread: [] as ThreadMessage[],
  lawyerUnread: false,
  banner: "",
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      banner: "",
      lawyer: { status: "none", caseId: null, requestId: null },
      thread: [],
      lawyerUnread: false,
      sidebarCollapsed: false,

      setBanner: (banner) => set({ banner }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      requestLawyer: (caseId, requestId) => {
        if (get().lawyer.status !== "none") return;
        set({
          lawyer: { status: "matching", caseId, requestId },
          thread: [],
          lawyerUnread: false,
          banner: "Request sent. Verified lawyers are reviewing your case.",
        });
      },
      cancelLawyerRequest: () =>
        set({
          lawyer: { status: "none", caseId: null, requestId: null },
          thread: [],
          lawyerUnread: false,
          banner: "Request cancelled.",
        }),
      syncLawyerRequest: (caseId, openRequestId) => {
        const { lawyer } = get();
        if (openRequestId && lawyer.status === "none") {
          set({ lawyer: { status: "matching", caseId, requestId: openRequestId }, thread: [], lawyerUnread: false });
        } else if (!openRequestId && lawyer.caseId === caseId && lawyer.status === "matching") {
          set({ lawyer: { status: "none", caseId: null, requestId: null }, thread: [], lawyerUnread: false });
        }
      },
      sendToLawyer: (text, file) => {
        const t = text.trim();
        if (!t) return;
        set((s) => ({ thread: [...s.thread, { role: "user", text: t, file }] }));
      },
      attachToLawyer: () => {
        const shared = get().thread.filter((m) => m.file).map((m) => m.text);
        const name = SAMPLE_FILES.find((f) => !shared.includes(f)) ?? `Document ${shared.length + 1}.pdf`;
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
      claimFor: (userId) => {
        if (get().ownerId === userId) return;
        set({ ...EMPTY_USER_DATA, ownerId: userId });
      },
      signOut: () => set({ ...EMPTY_USER_DATA, ownerId: null }),
    }),
    {
      name: "ilovelawyer-client",
      // v1: auth moved to the API. v2: cases moved to the API. v3: credits moved to the API.
      // v4: lawyer requests are real (requestId). Older local data is dropped.
      version: 4,
      migrate: () => ({ ownerId: null, ...EMPTY_USER_DATA }) as unknown as AppState,
      // Hydrate on the client (see useHydrated) so SSR markup stays stable.
      skipHydration: true,
      partialize: (s) => ({
        ownerId: s.ownerId,
        lawyer: s.lawyer,
        thread: s.thread,
        lawyerUnread: s.lawyerUnread,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);

export function lawyerLabel(status: LawyerStatus) {
  return status === "matching"
    ? "Finding a lawyer"
    : status === "accepted"
      ? "Lawyer chatting"
      : status === "closed"
        ? "Resolved"
        : "";
}
