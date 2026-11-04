"use client";

import type { MouseEvent } from "react";
import { gsap } from "./use-gsap-setup";
import { useReducedMotion } from "./use-reduced-motion";

/** Smooth-scrolls the page's own #links (instantly for anyone asking for reduced motion). */
export function useAnchorScroll() {
  const reduced = useReducedMotion();
  return (e: MouseEvent<HTMLAnchorElement>) => {
    const id = e.currentTarget.getAttribute("href")?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    gsap.to(window, { scrollTo: id === "top" ? 0 : target, duration: reduced ? 0 : 1.1, ease: "power2.inOut" });
  };
}
