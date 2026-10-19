import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CASE_CREDITS } from "./pricing";
import { SAMPLE_CASE, SAMPLE_FILES } from "./sample-data";
import type { Case, LawyerStatus, ThreadMessage } from "./types";

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
  /** Messages with the lawyer for the case in `lawyer.caseId`. */
  thread: ThreadMessage[];
  lawyerUnread: boolean;
  sidebarCollapsed: boolean;

  setField: <K extends keyof AuthFields>(key: K, value: AuthFields[K]) => void;
  setAuthMethod: (m: AuthMethod) => void;
  toggleConsent: (i: number) => void;
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
      thread: [],
      lawyerUnread: false,
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
        const first = get().fullName.split(" ")[0] || "there";
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
          thread: [],
          lawyerUnread: false,
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
