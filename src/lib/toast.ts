import { create } from "zustand";

/** A short confirmation over the page, gone after a few seconds (components/ui/toaster.tsx). */
export interface Toast {
  id: number;
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

/** Shows a success toast from anywhere: toast.success("Request sent", { description, link }). */
export const toast = {
  success(title: string, rest: Omit<Toast, "id" | "title"> = {}) {
    const id = nextId++;
    useToasts.setState((s) => ({ toasts: [...s.toasts, { id, title, ...rest }] }));
    return id;
  },
};
