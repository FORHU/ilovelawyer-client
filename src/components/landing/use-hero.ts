"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { preload } from "react-dom";
import { useRouter } from "next/navigation";
import { heroImageSrc, matchProblem } from "@/lib/marketing/problems";
import { saveSearchText } from "@/lib/marketing/search-prefill";
import { useLandingContent } from "./landing-content";
import { useReducedMotion } from "./use-reduced-motion";

const NO_HEADLINE = -1;
const HOLD_FIRST_MS = 7000;
const HOLD_MS = 5000;

/** What the frame loop reads each tick without re-rendering anything. */
export interface HeroLive {
  selected: number;
  /** A problem queued to be selected once the search box has finished typing it. */
  pending: number | null;
  selectedAt: number;
  userAt: number;
  busy: boolean;
  paused: boolean;
}

/** Everything the hero does, shared by its desktop and mobile views: which problem is selected,
 * the search box and its typewriter placeholder, and loading the photos. */
export function useHero() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { hero, problems, startProblem } = useLandingContent();

  const [selected, setSelected] = useState(startProblem);
  const [previous, setPrevious] = useState(-1);
  const [headline, setHeadline] = useState(startProblem);
  const [query, setQuery] = useState("");
  const [pausedByUser, setPausedByUser] = useState<boolean | null>(null);
  const [size, setSize] = useState<{ W: number; H: number } | null>(null);
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set([startProblem]));

  const paused = pausedByUser ?? reduced;
  preload(heroImageSrc(problems[startProblem]), { as: "image", fetchPriority: "high" });

  const input = useRef<HTMLInputElement>(null);
  const focused = useRef(false);
  const headlineTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typing = useRef<{ n: number; dir: 1 | -1; key?: number; text: string }>({ n: 0, dir: 1, text: "" });
  const pick = useRef(0);
  const images = useRef(new Map<number, Promise<void>>());
  const live = useRef<HeroLive>({ selected: startProblem, pending: null, selectedAt: 0, userAt: -Infinity, busy: false, paused });

  useEffect(() => {
    live.current.paused = paused;
    live.current.busy = focused.current || query !== "";
  }, [paused, query]);

  const loadImage = useCallback((i: number) => {
    const known = images.current.get(i);
    if (known) return known;
    const img = new Image();
    img.src = heroImageSrc(problems[i]);
    const ready = img
      .decode()
      .catch(() => {})
      .then(() => setLoaded((s) => new Set(s).add(i)));
    images.current.set(i, ready);
    return ready;
  }, [problems]);

  const holdHeadline = useCallback((ms: number) => {
    clearTimeout(headlineTimer.current);
    headlineTimer.current = setTimeout(() => {
      if (!live.current.busy) setHeadline(NO_HEADLINE);
    }, ms);
  }, []);

  /** Selects a problem once its photo can show, so the crossfade never fades to nothing. */
  const select = useCallback(
    (k: number, byUser: boolean) => {
      if (k === live.current.selected) return;
      const now = performance.now();
      if (byUser) {
        live.current.userAt = now;
        live.current.pending = null;
        typing.current = { n: problems[k].say.length, dir: 1, key: k, text: problems[k].say };
      }
      const id = ++pick.current;
      void loadImage(k).then(() => {
        if (id !== pick.current) return;
        setPrevious(live.current.selected);
        live.current.selected = k;
        live.current.selectedAt = performance.now();
        setSelected(k);
        setHeadline(k);
        holdHeadline(HOLD_MS);
      });
    },
    [holdHeadline, loadImage, problems],
  );

  // The search box's placeholder types out how someone might say the selected problem. It is
  // written straight to the input: re-rendering the hero per letter would be wasted work.
  useEffect(() => {
    live.current.selectedAt = performance.now();
    holdHeadline(HOLD_FIRST_MS);
    const clearHeadline = headlineTimer;
    if (reduced) return () => clearTimeout(clearHeadline.current);
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const T = typing.current;
      const { pending, selected: current, busy } = live.current;
      const showing = pending ?? current;
      const want = problems[showing].say;
      if (T.key === undefined) {
        T.key = showing;
        T.text = want;
      }
      if (T.key !== showing && T.dir !== -1) T.dir = -1;
      let wait = 28 + Math.random() * 26;
      if (busy || document.hidden) {
        wait = 400;
      } else if (T.dir === 1) {
        if (T.n < T.text.length) {
          T.n++;
          if (T.n >= T.text.length && pending !== null && T.key === pending) {
            live.current.pending = null;
            select(pending, false);
          }
        } else {
          wait = 300;
        }
      } else {
        T.n = Math.max(0, T.n - 1);
        wait = 12;
        if (T.n <= 0) {
          T.dir = 1;
          T.key = showing;
          T.text = want;
          wait = 350;
        }
      }
      if (input.current && !focused.current) input.current.placeholder = `${T.text.slice(0, T.n)}|`;
      timer = setTimeout(tick, wait);
    };
    timer = setTimeout(tick, 900);
    return () => {
      clearTimeout(timer);
      clearTimeout(clearHeadline.current);
    };
  }, [holdHeadline, problems, reduced, select]);

  // The other photos load one by one once the page is idle, unless the visitor is saving data.
  useEffect(() => {
    void loadImage(startProblem);
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    let stopped = false;
    let handle: number;
    // Safari has no requestIdleCallback.
    const later: (fn: () => void) => number = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 400));
    const cancel: (id: number) => void = window.cancelIdleCallback ?? window.clearTimeout;
    const next = (i: number) => {
      if (stopped || i >= problems.length) return;
      handle = later(() => void loadImage(i).then(() => next(i + 1)));
    };
    const onLoad = () => next(0);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      stopped = true;
      window.removeEventListener("load", onLoad);
      cancel(handle);
    };
  }, [loadImage, problems.length, startProblem]);

  const hasQuery = query.trim().length >= 3;
  const noMatch = useMemo(() => hasQuery && matchProblem(query, problems) < 0, [hasQuery, query, problems]);

  const search = {
    input,
    query,
    noMatch,
    /** Painted first, before the typewriter takes over. */
    initialPlaceholder: problems[startProblem].say,
    onInput: (value: string) => {
      setQuery(value);
      live.current.userAt = performance.now();
      if (value.trim().length >= 3) {
        const match = matchProblem(value, problems);
        if (match >= 0) select(match, true);
      } else if (!value.trim()) {
        holdHeadline(HOLD_MS);
      }
    },
    onFocus: () => {
      focused.current = true;
      live.current.busy = true;
      if (input.current) input.current.placeholder = hero.searchFocusPlaceholder;
    },
    onBlur: () => {
      focused.current = false;
      live.current.busy = query !== "";
      if (input.current && reduced) input.current.placeholder = problems[live.current.selected].say;
    },
    /** Keeps what they typed for the new-case chat, for any way into sign-up from here. */
    carryOver: () => saveSearchText(query),
    onSubmit: (e: FormEvent) => {
      e.preventDefault();
      saveSearchText(query);
      router.push("/signup");
    },
  };

  return {
    live,
    selected,
    previous,
    headline,
    paused,
    reduced,
    size,
    setSize,
    loaded,
    search,
    select,
    togglePaused: () => setPausedByUser(!paused),
  };
}

export type HeroModel = ReturnType<typeof useHero>;
