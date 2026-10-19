import { create } from "zustand";

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

  setField: <K extends keyof AuthFields>(key: K, value: AuthFields[K]) => void;
  setAuthMethod: (m: AuthMethod) => void;
  toggleConsent: (i: number) => void;
  setBanner: (message: string) => void;
  /** Mock sign in (prototype: any credentials open a demo account). */
  signIn: () => void;
  /** Finish onboarding after consent. */
  completeOnboarding: () => void;
}

export const useApp = create<AppState>((set) => ({
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

  setField: (key, value) => set({ [key]: value } as Partial<AppState>),
  setAuthMethod: (authMethod) => set({ authMethod }),
  toggleConsent: (i) =>
    set((s) => ({
      consent: s.consent.map((v, j) => (j === i ? !v : v)) as AppState["consent"],
    })),
  setBanner: (banner) => set({ banner }),
  signIn: () =>
    set({ signedIn: true, fullName: "Juan Dela Cruz", banner: "Welcome back, Juan." }),
  completeOnboarding: () =>
    set({
      signedIn: true,
      banner: "Welcome to ilovelawyer. Create your first case to get started.",
    }),
}));
