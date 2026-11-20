import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { msg } from "@/lib/i18n/msg";
import { DARK_QUERY, THEME_STORAGE_KEY } from "./theme-boot";

// Light and dark mode for the whole site: the app (globals.css has its dark tokens), the sign-in
// pages, and the landing (landing.css has its light tokens). The choice lives in this browser's
// localStorage; "system" follows the device. <html data-theme> always holds the resolved "light"
// or "dark": the boot script (theme-boot.ts) sets it before first paint, useSiteTheme keeps it
// current after.

export type ThemeChoice = "light" | "dark" | "system";

export const THEME_CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: msg("Light") },
  { value: "dark", label: msg("Dark") },
  { value: "system", label: msg("Match my device") },
];

function readChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

export const useTheme = create<{ choice: ThemeChoice; setChoice: (choice: ThemeChoice) => void }>((set) => ({
  choice: typeof window === "undefined" ? "system" : readChoice(),
  setChoice: (choice) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      // Private mode or blocked storage: the choice holds for this visit only.
    }
    set({ choice });
  },
}));

const noSubscribe = () => () => {};

/** The choice, for a control that shows it: null while the page hydrates, the stored one after. The
 * server can't read this browser's storage, so a server-rendered page (the landing, sign-in) would
 * otherwise hydrate with the server's "system" marked and keep it. */
export function useThemeChoice(): ThemeChoice | null {
  const choice = useTheme((s) => s.choice);
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  return mounted ? choice : null;
}

export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Keeps <html data-theme> in step with the choice, and with the device on "system". Mounted once,
 * in the root providers, so every page follows it. */
export function useSiteTheme() {
  const choice = useTheme((s) => s.choice);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.dataset.theme = resolveTheme(choice);
    };
    apply();
    if (choice !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [choice]);
}
