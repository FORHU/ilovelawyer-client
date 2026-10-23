import { create } from "zustand";
import { persist } from "zustand/middleware";

// Who is signed in lives in ./auth/session, and cases, documents, the AI chat and lawyer requests
// come from the API (./cases, ./lawyer-requests). This store only keeps UI state: a dismissible
// banner and the sidebar's collapsed flag, persisted per browser.

interface AppState {
  /** The account the persisted data belongs to, so another account signing in on this browser
   * doesn't see it (see claimFor). */
  ownerId: string | null;
  /** Dismissible success banner at the top of the app shell. */
  banner: string;
  sidebarCollapsed: boolean;

  setBanner: (message: string) => void;
  toggleSidebar: () => void;
  /** Called when an account signs in: keeps this browser's data if it is that account's, else
   * starts it empty. */
  claimFor: (userId: string) => void;
  /** Clears the account's local data on sign-out. */
  signOut: () => void;
}

const EMPTY_USER_DATA = { banner: "" };

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      banner: "",
      sidebarCollapsed: false,

      setBanner: (banner) => set({ banner }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      claimFor: (userId) => {
        if (get().ownerId === userId) return;
        set({ ...EMPTY_USER_DATA, ownerId: userId });
      },
      signOut: () => set({ ...EMPTY_USER_DATA, ownerId: null }),
    }),
    {
      name: "ilovelawyer-client",
      // v1: auth moved to the API. v2: cases moved to the API. v3: credits moved to the API.
      // v4: lawyer requests became real (requestId), but still mirrored their later states
      // (accepted/closed) locally. v5: the lawyer request's whole lifecycle reads from the API
      // (lib/lawyer-requests/api.ts) instead — older local data is dropped.
      version: 5,
      migrate: () => ({ ownerId: null, ...EMPTY_USER_DATA }) as unknown as AppState,
      // Hydrate on the client (see useHydrated) so SSR markup stays stable.
      skipHydration: true,
      partialize: (s) => ({
        ownerId: s.ownerId,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
