import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSession } from "./auth/session";
import { SAMPLE_FILES } from "./sample-data";
import type { LawyerStatus, ThreadMessage } from "./types";

// Who is signed in lives in ./auth/session, and cases, documents and the AI chat come from the API
// (./cases), as do payments and chat credits (./billing) and the lawyer request with its status
// (./lawyer-requests). This store keeps only what is still mocked (a lawyer accepting, and the
// thread with them; dev builds only) plus UI state, persisted per browser.

interface AppState {
  /** The account the persisted data belongs to, so another account signing in on this browser
   * doesn't see it (see claimFor). */
  ownerId: string | null;
  /** Dismissible success banner at the top of the app shell. */
  banner: string;

  /** DEV-ONLY mock of a lawyer taking the case ("accepted", "closed"), for the case in `caseId`.
   * Applies only while that case has an open request in the API (see lawyerPhase). */
  lawyer: { status: LawyerStatus; caseId: string | null };
  /** Mocked messages with the lawyer for the case in `lawyer.caseId`. */
  thread: ThreadMessage[];
  lawyerUnread: boolean;
  sidebarCollapsed: boolean;

  setBanner: (message: string) => void;
  toggleSidebar: () => void;
  /** Client message (or shared file) in the lawyer thread. */
  sendToLawyer: (text: string, file?: boolean) => void;
  /** Shares a sample document in the lawyer thread. */
  attachToLawyer: () => void;
  markLawyerRead: () => void;
  /** DEMO ONLY (dev builds): stands in for the lawyer app until real matching exists. */
  demoLawyerAccept: (caseId: string) => void;
  demoLawyerResolve: () => void;
  /** Called when an account signs in: keeps this browser's data if it is that account's, else
   * starts it empty. */
  claimFor: (userId: string) => void;
  /** Clears the account's local data on sign-out. */
  signOut: () => void;
}

const EMPTY_USER_DATA = {
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
      lawyer: { status: "none", caseId: null },
      thread: [],
      lawyerUnread: false,
      sidebarCollapsed: false,

      setBanner: (banner) => set({ banner }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
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
      demoLawyerAccept: (caseId) => {
        const first = useSession.getState().user?.name?.split(" ")[0] || "there";
        set({
          lawyer: { status: "accepted", caseId },
          lawyerUnread: true,
          thread: [
            { role: "event", text: "Atty. Maria Reyes accepted your request" },
            {
              role: "lawyer",
              text: `Hi ${first}, I've read your case and the documents you attached. Can you tell me in your own words what happened, and when?`,
            },
          ],
        });
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
      // v4: lawyer requests are real (requestId). v5: their status comes from the API too.
      // Older local data is dropped.
      version: 5,
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

const LAWYER_LABELS: Record<LawyerStatus, string> = {
  none: "",
  matching: "Finding a lawyer",
  quoted: "Lawyer responded",
  expired: "No lawyer found",
  accepted: "Lawyer chatting",
  closed: "Resolved",
};

export function lawyerLabel(status: LawyerStatus) {
  return LAWYER_LABELS[status];
}
