import { create } from "zustand";

/** A short message over the page, gone after a few seconds (components/ui/toaster.tsx). */
export interface Toast {
  id: number;
  /** "success" (the default): something was done. "info": nothing went wrong, it just can't happen
   * yet. "error": it failed. */
  tone?: "success" | "info" | "error";
  title: string;
  description?: string;
  /** Where to go next, e.g. the case the request was sent for. */
  link?: { href: string; label: string };
}

let nextId = 1;

export const useToasts = create<{ toasts: Toast[]; dismiss: (id: number) => void }>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

type ToastOptions = Omit<Toast, "id" | "title" | "tone">;

function show(tone: NonNullable<Toast["tone"]>, title: string, rest: ToastOptions) {
  const id = nextId++;
  useToasts.setState((s) => ({ toasts: [...s.toasts, { id, tone, title, ...rest }] }));
  return id;
}

/** Shows a toast from anywhere: toast.success("Request sent", { description, link }), toast.info(…),
 * toast.error(…). */
export const toast = {
  success: (title: string, rest: ToastOptions = {}) => show("success", title, rest),
  info: (title: string, rest: ToastOptions = {}) => show("info", title, rest),
  error: (title: string, rest: ToastOptions = {}) => show("error", title, rest),
};
