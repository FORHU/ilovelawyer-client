import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveTour } from "./api";
import type { SeenKey, TourId, TourStep } from "./tours";

/** The tour on screen. "G" is a single stop the guide pointed at, titled with the question. */
export type ActiveTour = { id: TourId; i: number; dir: 1 | -1 } | { id: "G"; i: 0; dir: 1 | -1; question: string; step: TourStep };

interface TourState {
  /** The account `seen` belongs to, so another account on this browser starts its own tour. */
  ownerId: string | null;
  /** Kept in this browser as well as on the API, so a page loads without waiting and a failed save
   * isn't lost. */
  seen: Partial<Record<SeenKey, true>>;
  /** The API's answer for this account has been read (or couldn't be): tours may start. */
  loaded: boolean;
  tour: ActiveTour | null;
  guideOpen: boolean;
  /** "That's the tour" toast, after a tour is finished rather than skipped. */
  toast: boolean;

  claimFor: (userId: string) => void;
  /** Records tours as seen, here and on the API: COMPLETED when done, DISMISSED when skipped. */
  markSeen: (keys: SeenKey[], status: "COMPLETED" | "DISMISSED") => void;
  /** Brings back a tour the API says was seen (the account used another browser or device). */
  loadSeen: (keys: SeenKey[]) => void;
  unsee: (key: SeenKey) => void;
  start: (id: TourId) => void;
  startGuide: (question: string, step: TourStep) => void;
  setStep: (i: number, dir: 1 | -1) => void;
  /** Ends the tour. `skipped` (Skip, Esc, leaving the page) shows no toast. */
  finish: (skipped: boolean) => void;
  setGuideOpen: (open: boolean) => void;
  hideToast: () => void;
}

/** Saves to the API. A failed save is dropped: the browser still has it, and the user only loses
 * "seen" if they also change browser before the next successful save. */
function remember(key: SeenKey, status: "NOT_STARTED" | "COMPLETED" | "DISMISSED") {
  if (!useTour.getState().ownerId) return;
  void saveTour(key, status).catch(() => {});
}

export const useTour = create<TourState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      seen: {},
      loaded: false,
      tour: null,
      guideOpen: false,
      toast: false,

      claimFor: (userId) => {
        if (get().ownerId === userId) return;
        set({ ownerId: userId, seen: {}, loaded: false, tour: null, guideOpen: false, toast: false });
      },
      markSeen: (keys, status) => {
        set((s) => ({ seen: { ...s.seen, ...Object.fromEntries(keys.map((k) => [k, true])) } }));
        keys.forEach((k) => remember(k, status));
      },
      loadSeen: (keys) => set((s) => ({ loaded: true, seen: { ...s.seen, ...Object.fromEntries(keys.map((k) => [k, true])) } })),
      unsee: (key) => {
        set((s) => {
          const seen = { ...s.seen };
          delete seen[key];
          return { seen };
        });
        remember(key, "NOT_STARTED");
      },
      start: (id) => set({ tour: { id, i: 0, dir: 1 }, guideOpen: false, toast: false }),
      startGuide: (question, step) => set({ tour: { id: "G", i: 0, dir: 1, question, step }, guideOpen: false, toast: false }),
      setStep: (i, dir) => set((s) => (s.tour ? { tour: { ...s.tour, i, dir } as ActiveTour } : s)),
      finish: (skipped) =>
        set((s) => {
          if (!s.tour) return s;
          const real = s.tour.id !== "G";
          if (real) remember(s.tour.id as TourId, skipped ? "DISMISSED" : "COMPLETED");
          return {
            tour: null,
            toast: !skipped && real,
            seen: real ? { ...s.seen, [s.tour.id]: true } : s.seen,
          };
        }),
      // Opening the guide ends the tour, which counts as seen.
      setGuideOpen: (guideOpen) =>
        set((s) => {
          if (!guideOpen) return { guideOpen };
          if (s.tour && s.tour.id !== "G") {
            remember(s.tour.id, "DISMISSED");
            return { guideOpen, tour: null, seen: { ...s.seen, [s.tour.id]: true as const } };
          }
          return { guideOpen, tour: null };
        }),
      hideToast: () => set({ toast: false }),
    }),
    {
      name: "ilovelawyer-client-tour",
      version: 1,
      // Hydrated by the tour layer on the client so SSR markup stays stable.
      skipHydration: true,
      partialize: (s) => ({ ownerId: s.ownerId, seen: s.seen }),
    },
  ),
);
