import { create } from "zustand";

/** The signed-in account, as ilovelawyer-api's /api/users/me (and the sign-in responses) return it. */
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  role: "USER" | "LAWYER" | "ADMIN";
  avatarUrl?: string | null;
}

/** "unknown" until the first page-load check has run (see restoreSession). */
export type SessionStatus = "unknown" | "signedIn" | "signedOut";

interface SessionState {
  status: SessionStatus;
  /** Short-lived; kept in memory only, never in localStorage. A reload gets a new one from the
   * refresh cookie. */
  accessToken: string | null;
  user: SessionUser | null;
  setSession: (user: SessionUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
}

export const useSession = create<SessionState>()((set) => ({
  status: "unknown",
  accessToken: null,
  user: null,
  setSession: (user, accessToken) => set({ status: "signedIn", user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ status: "signedOut", user: null, accessToken: null }),
}));
