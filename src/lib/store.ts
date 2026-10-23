import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_FILES } from "./sample-data";
import type { LawyerStatus, ThreadMessage } from "./types";

// Who is signed in lives in ./auth/session, and cases, documents and the AI chat come from the API
// (./cases), as do payments and chat credits (./billing) and the lawyer request itself
// (./lawyer-requests). This store keeps what is still mocked (what happens after the request: a
// lawyer accepting, and the thread with them) plus UI state, persisted per browser.

/** One case's lawyer request as this browser tracks it. */
interface CaseLawyer {
  status: Exclude<LawyerStatus, "none">;
  requestId: string | null;
}

const NO_THREAD: ThreadMessage[] = [];

/** `map` without `key`. */
function without<T>(map: Record<string, T>, key: string) {
  return Object.fromEntries(Object.entries(map).filter(([k]) => k !== key));
}

interface AppState {
  /** The account the persisted data belongs to, so another account signing in on this browser
   * doesn't see it (see claimFor). */
  ownerId: string | null;
  /** Dismissible success banner at the top of the app shell. */
  banner: string;

  /** The lawyer request of each case that has one. `requestId` is the real request in the API; what
   * happens after it ("accepted", "closed") is still mocked. A case without an entry has none. */
  lawyers: Record<string, CaseLawyer>;
  /** Messages with the lawyer, per case. */
  threads: Record<string, ThreadMessage[]>;
  lawyerUnread: Record<string, boolean>;
  sidebarCollapsed: boolean;

  setBanner: (message: string) => void;
  toggleSidebar: () => void;
  /** A request was just made in the API (the request form). */
  requestLawyer: (caseId: string, requestId: string) => void;
  /** The case's request was withdrawn in the API. */
  cancelLawyerRequest: (caseId: string) => void;
  /** Lines this browser up with the API: shows a request made on another device, and drops one
   * withdrawn elsewhere. Leaves the mocked later states ("accepted", "closed") alone. */
  syncLawyerRequest: (caseId: string, openRequestId: string | null) => void;
  /** Client message (or shared file) in the lawyer thread. */
  sendToLawyer: (caseId: string, text: string, file?: boolean) => void;
  /** Shares a sample document in the lawyer thread. */
  attachToLawyer: (caseId: string) => void;
  markLawyerRead: (caseId: string) => void;
  /** Called when an account signs in: keeps this browser's data if it is that account's, else
   * starts it empty. */
  claimFor: (userId: string) => void;
  /** Clears the account's local data on sign-out. */
  signOut: () => void;
}

const EMPTY_USER_DATA = {
  lawyers: {} as Record<string, CaseLawyer>,
  threads: {} as Record<string, ThreadMessage[]>,
  lawyerUnread: {} as Record<string, boolean>,
  banner: "",
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      banner: "",
      lawyers: {},
      threads: {},
      lawyerUnread: {},
      sidebarCollapsed: false,

      setBanner: (banner) => set({ banner }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      requestLawyer: (caseId, requestId) => {
        if (get().lawyers[caseId]) return;
        set((s) => ({
          lawyers: { ...s.lawyers, [caseId]: { status: "matching", requestId } },
          threads: { ...s.threads, [caseId]: [] },
          lawyerUnread: { ...s.lawyerUnread, [caseId]: false },
          banner: "Request sent. Verified lawyers are reviewing your case.",
        }));
      },
      cancelLawyerRequest: (caseId) =>
        set((s) => ({
          lawyers: without(s.lawyers, caseId),
          threads: without(s.threads, caseId),
          lawyerUnread: without(s.lawyerUnread, caseId),
          banner: "Request cancelled.",
        })),
      syncLawyerRequest: (caseId, openRequestId) => {
        const current = get().lawyers[caseId];
        if (openRequestId && !current) {
          set((s) => ({
            lawyers: { ...s.lawyers, [caseId]: { status: "matching", requestId: openRequestId } },
            threads: { ...s.threads, [caseId]: [] },
            lawyerUnread: { ...s.lawyerUnread, [caseId]: false },
          }));
        } else if (!openRequestId && current?.status === "matching") {
          set((s) => ({ lawyers: without(s.lawyers, caseId), threads: without(s.threads, caseId), lawyerUnread: without(s.lawyerUnread, caseId) }));
        }
      },
      sendToLawyer: (caseId, text, file) => {
        const t = text.trim();
        if (!t) return;
        set((s) => ({ threads: { ...s.threads, [caseId]: [...(s.threads[caseId] ?? NO_THREAD), { role: "user", text: t, file }] } }));
      },
      attachToLawyer: (caseId) => {
        const thread = get().threads[caseId] ?? NO_THREAD;
        const shared = thread.filter((m) => m.file).map((m) => m.text);
        const name = SAMPLE_FILES.find((f) => !shared.includes(f)) ?? `Document ${shared.length + 1}.pdf`;
        set((s) => ({ threads: { ...s.threads, [caseId]: [...thread, { role: "user", text: name, file: true }] } }));
      },
      markLawyerRead: (caseId) => {
        if (get().lawyerUnread[caseId]) set((s) => ({ lawyerUnread: { ...s.lawyerUnread, [caseId]: false } }));
      },
      claimFor: (userId) => {
        if (get().ownerId === userId) return;
        set({ ...EMPTY_USER_DATA, ownerId: userId });
      },
      signOut: () => set({ ...EMPTY_USER_DATA, ownerId: null }),
    }),
    {
      name: "ilovelawyer-client",
      // v1: auth moved to the API. v2: cases moved to the API. v3: credits moved to the API.
      // v4: lawyer requests are real (requestId). v5: lawyer state is per case, not one slot. Older
      // local data is dropped.
      version: 5,
      migrate: () => ({ ownerId: null, ...EMPTY_USER_DATA }) as unknown as AppState,
      // Hydrate on the client (see useHydrated) so SSR markup stays stable.
      skipHydration: true,
      partialize: (s) => ({
        ownerId: s.ownerId,
        lawyers: s.lawyers,
        threads: s.threads,
        lawyerUnread: s.lawyerUnread,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);

/** The lawyer status of this case ("none" when it has no request). */
export function useLawyerStatusOf(caseId: string): LawyerStatus {
  return useApp((s) => s.lawyers[caseId]?.status ?? "none");
}

/** The messages with this case's lawyer. */
export function useLawyerThread(caseId: string): ThreadMessage[] {
  return useApp((s) => s.threads[caseId] ?? NO_THREAD);
}
