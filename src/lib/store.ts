import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CASE_CREDITS } from "./pricing";
import { SAMPLE_CASE } from "./sample-data";
import type { Case, LawyerStatus } from "./types";

export type AuthMethod = "email" | "phone" | "social";

interface AuthFields {
  email: string;
  password: string;
  phone: string;
  otp: string;
  fullName: string;
  city: string;
}

interface AppState extends AuthFields {
  authMethod: AuthMethod;
  consent: [boolean, boolean, boolean];
  signedIn: boolean;
  /** Dismissible success banner at the top of the app shell. */
  banner: string;

  cases: Case[];
  /** Lawyer request for one case at a time (prototype behaviour). */
  lawyer: { status: LawyerStatus; caseId: number | null };
  sidebarCollapsed: boolean;

  setField: <K extends keyof AuthFields>(key: K, value: AuthFields[K]) => void;
  setAuthMethod: (m: AuthMethod) => void;
  toggleConsent: (i: number) => void;
  setBanner: (message: string) => void;
  toggleSidebar: () => void;
  /** Adds a paid case and returns its id. */
  addCase: (data: Omit<Case, "id" | "credits" | "chat">) => number;
  addCredits: (caseId: number, credits: number) => void;
  /** Mock sign in (prototype: any credentials open a demo account). */
  signIn: () => void;
  /** Finish onboarding after consent. */
  completeOnboarding: () => void;
  signOut: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      email: "",
      password: "",
      phone: "",
      otp: "",
      fullName: "",
      city: "",
      authMethod: "email",
      consent: [false, false, false],
      signedIn: false,
      banner: "",
      cases: [],
      lawyer: { status: "none", caseId: null },
      sidebarCollapsed: false,

      setField: (key, value) => set({ [key]: value } as Partial<AppState>),
      setAuthMethod: (authMethod) => set({ authMethod }),
      toggleConsent: (i) =>
        set((s) => ({
          consent: s.consent.map((v, j) => (j === i ? !v : v)) as AppState["consent"],
        })),
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
      signIn: () =>
        set({
          signedIn: true,
          fullName: "Juan Dela Cruz",
          cases: [SAMPLE_CASE],
          banner: "Welcome back, Juan.",
        }),
      completeOnboarding: () =>
        set({
          signedIn: true,
          banner: "Welcome to ilovelawyer. Create your first case to get started.",
        }),
      signOut: () =>
        set({
          signedIn: false,
          cases: [],
          lawyer: { status: "none", caseId: null },
          consent: [false, false, false],
          banner: "",
        }),
    }),
    {
      name: "ilovelawyer-client",
      // Hydrate on the client (see useHydrated) so SSR markup stays stable.
      skipHydration: true,
      partialize: (s) => ({
        signedIn: s.signedIn,
        fullName: s.fullName,
        city: s.city,
        email: s.email,
        cases: s.cases,
        lawyer: s.lawyer,
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
