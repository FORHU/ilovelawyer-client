"use client";

import { useEffect, useLayoutEffect } from "react";
import { ScrollTrigger } from "./use-gsap-setup";

const KEY = "ilovelawyer.landing-scroll";
// Once per page load: Next brings this route back from hidden without a new load, and a reload
// entry stays on the timeline, so without this a return from /login would jump to an old position.
let restored = false;

const reloading = () => {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === "reload" || entry?.type === "back_forward";
};

/** Puts a reload back where it was, and a new visit to a #link where it points. The browser can't: the
 * page streams in behind a short shell, so it isn't tall enough yet when the browser tries. Rendered
 * after the page's sections, so their scroll triggers already exist. */
export function ScrollRestorer() {
  useLayoutEffect(() => {
    if (restored) return;
    restored = true;
    const anchor = () => {
      const rect = document.getElementById(location.hash.slice(1))?.getBoundingClientRect();
      return rect ? rect.top + window.scrollY : 0;
    };
    const top = reloading() ? Number(sessionStorage.getItem(KEY)) : anchor();
    if (!top) return;
    ScrollTrigger.refresh();
    window.scrollTo({ top, behavior: "instant" });
    ScrollTrigger.update();
    // Straight to the scrolled state, so the story doesn't replay from the top to catch up.
    for (const trigger of ScrollTrigger.getAll()) trigger.animation?.progress(trigger.progress);
  }, []);

  useEffect(() => {
    const save = () => sessionStorage.setItem(KEY, String(Math.round(window.scrollY)));
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, []);

  return null;
}
