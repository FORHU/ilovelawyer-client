"use client";

import type { RefObject } from "react";
import {
  createPaperSeeds,
  heroFace,
  layoutPapers,
  overlapsOval,
  overlapsRect,
  paperHomePosition,
  selectedPaperDesktop,
  selectedPaperMobile,
  type PaperHome,
  type Rect,
} from "@/lib/marketing/hero-geometry";
import { heroExit, paperFlight, phoneTarget } from "@/lib/marketing/how-timeline";
import { PROBLEMS } from "@/lib/marketing/problems";
import type { StoryScroll } from "./story";
import { gsap, useGSAP } from "./use-gsap-setup";
import type { HeroModel } from "./use-hero";

const ORBIT_MS = 1_100_000;
const IDLE_BEFORE_NEXT_MS = 10_000;
const USER_HOLD_MS = 15_000;
/** Past here (in the story's d) every paper is inside the phone and the hero is off screen. */
const HERO_DONE = 1.35;

interface PaperState {
  el: HTMLElement;
  w: number;
  h: number;
  x: number | null;
  y: number;
  r: number;
  s: number;
  z: number;
  shownZ: number;
  setX: (v: number) => void;
  setY: (v: number) => void;
  setR: (v: number) => void;
  setSX: (v: number) => void;
  setSY: (v: number) => void;
}

/** The hero's papers drift, dodge the pointer and keep off the person's face and the copy. That is
 * a per-frame simulation, so GSAP drives it (ticker, quickSetter) rather than tweening it; the
 * positions come from lib/marketing/hero-geometry. As the story below scrolls in (StoryScroll), the
 * photo drops behind at a slower pace and dims, and the papers fly into the story's phone. */
export function useHeroMotion(
  model: Pick<HeroModel, "live" | "setSize" | "reduced">,
  scroll: StoryScroll,
  mob: boolean,
  refs: { section: RefObject<HTMLElement | null>; copy: RefObject<HTMLElement | null>; backdrop: RefObject<HTMLElement | null>; dim: RefObject<HTMLElement | null> },
  papersMounted: boolean,
) {
  const { live, setSize, reduced } = model;

  useGSAP(
    () => {
      if (!papersMounted) return;
      const section = refs.section.current!;
      const copyEl = refs.copy.current!;
      const els = [...section.querySelectorAll<HTMLElement>("[data-paper]")];
      const seeds = createPaperSeeds(els.length);
      const papers: PaperState[] = els.map((el, i) => ({
        el,
        w: el.offsetWidth,
        h: el.offsetHeight,
        x: null,
        y: 0,
        r: 0,
        s: 1,
        z: seeds[i].z,
        shownZ: -1,
        setX: gsap.quickSetter(el, "x", "px") as (v: number) => void,
        setY: gsap.quickSetter(el, "y", "px") as (v: number) => void,
        setR: gsap.quickSetter(el, "rotation", "deg") as (v: number) => void,
        setSX: gsap.quickSetter(el, "scaleX") as (v: number) => void,
        setSY: gsap.quickSetter(el, "scaleY") as (v: number) => void,
      }));

      let W = section.clientWidth;
      let H = section.clientHeight;
      let copy: Rect = { l: 0, t: 0, r: 0, b: 0, w: 0, h: 0 };
      const measureCopy = () => {
        const s = section.getBoundingClientRect();
        const c = copyEl.getBoundingClientRect();
        copy = { l: c.left - s.left, t: c.top - s.top, r: c.right - s.left, b: c.bottom - s.top, w: c.width, h: c.height };
      };
      measureCopy();

      let homes: PaperHome[] = [];
      let orbit = layoutPapers(seeds, W, H, mob, copy).orbit;
      const relayout = () => {
        const next = layoutPapers(seeds, W, H, mob, copy);
        homes = next.homes;
        orbit = next.orbit;
        setSize({ W, H });
      };
      relayout();

      // Reading sizes every frame would force layout 22 times a frame, so they are cached here.
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === section) {
            W = section.clientWidth;
            H = section.clientHeight;
            measureCopy();
            relayout();
          } else if (entry.target === copyEl) {
            measureCopy();
          } else {
            const p = papers.find((q) => q.el === entry.target);
            if (p) {
              p.w = p.el.offsetWidth;
              p.h = p.el.offsetHeight;
            }
          }
        }
      });
      observer.observe(section);
      observer.observe(copyEl);
      els.forEach((el) => observer.observe(el));

      let hovered = -1;
      const hoverHandlers = els.map((el, i) => {
        const enter = (e: PointerEvent) => {
          if (e.pointerType === "mouse") hovered = i;
        };
        const leave = () => {
          if (hovered === i) hovered = -1;
        };
        el.addEventListener("pointerenter", enter);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointerenter", enter);
          el.removeEventListener("pointerleave", leave);
        };
      });

      let mx: number | null = null;
      let my: number | null = null;
      const onMove = (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
      };
      const onLeave = () => {
        mx = my = null;
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);

      let angle = 0;
      let drift = 0;
      let zTop = els.length;
      let lastSelected = live.current.selected;
      let snapped = -1;
      let lastArrive = -1;
      let done = false;

      const frame = (_time: number, deltaTime: number) => {
        const d = scroll.get();
        if (d > HERO_DONE) {
          if (done) return;
          done = true;
        } else {
          done = false;
        }
        const exit = heroExit(d);
        if (exit.arrive !== lastArrive) {
          lastArrive = exit.arrive;
          const py = (exit.arrive * H * 0.45).toFixed(1);
          if (refs.backdrop.current) {
            refs.backdrop.current.style.transform = `translate3d(0,${py}px,0)`;
            refs.backdrop.current.style.clipPath = `inset(0 0 ${py}px 0)`;
          }
          if (refs.dim.current) refs.dim.current.style.opacity = (exit.arrive * 0.9).toFixed(3);
        }
        const dt = Math.min(64, deltaTime);
        const now = performance.now();
        const state = live.current;
        const moving = !reduced && !state.paused && !document.hidden;

        if (moving && hovered < 0 && state.pending === null && !state.busy && exit.arrive <= 0.005 && now - state.selectedAt > IDLE_BEFORE_NEXT_MS && now - state.userAt > USER_HOLD_MS) {
          let k: number;
          do k = Math.floor(Math.random() * papers.length);
          while (k === state.selected);
          state.pending = k;
        }

        if (moving) {
          drift += dt;
          if (hovered < 0) angle += (dt * Math.PI * 2) / ORBIT_MS;
        }

        if (lastSelected !== state.selected) {
          papers[lastSelected].z = ++zTop;
          lastSelected = state.selected;
        }

        const face = heroFace(PROBLEMS[state.selected], W, H, mob).oval;
        const rect = mx === null ? null : section.getBoundingClientRect();
        const px = rect && mx !== null ? mx - rect.left : null;
        const py = rect && my !== null ? my - rect.top : null;
        const ease = reduced ? 1 : 1 - Math.pow(0.9, dt / 16);
        const scene = { W, H, orbit, face, copy };
        const target = phoneTarget(d, W, H, mob);

        papers.forEach((p, k) => {
          const home = homes[k];
          const on = k === state.selected;
          let x: number;
          let y: number;
          let r: number;
          let s: number;
          if (on) {
            const place = mob ? selectedPaperMobile(p.w, p.h, W, H, copy) : selectedPaperDesktop(p.w, p.h, W, H, face, copy);
            x = place.x;
            y = place.y;
            s = place.scale;
            r = 0;
            if (snapped !== k) {
              snapped = k;
              p.x = x;
              p.y = y;
              p.r = 0;
              p.s = s;
            }
          } else {
            [x, y] = paperHomePosition(home, angle, p.w, p.h, scene);
            r = seeds[k].r0 + Math.sin(drift / 2600 + seeds[k].phase) * 2;
            s = home.scale * (hovered === k ? 1.04 : 1);
            if (px !== null && py !== null && !reduced && !state.paused) {
              const dx = x - px;
              const dy = y - py;
              const d = Math.hypot(dx, dy) || 1;
              if (d < 260) {
                const f = Math.pow(1 - d / 260, 2) * 52;
                x += (dx / d) * f;
                y += (dy / d) * f;
                r += (dx > 0 ? 1 : -1) * f * 0.08;
              }
            }
          }
          if (p.x === null) {
            p.x = x;
            p.y = y;
            p.r = r;
            p.s = s;
          }
          p.x += (x - p.x) * ease;
          p.y += (y - p.y) * ease;
          p.r += (r - p.r) * ease;
          p.s += (s - p.s) * ease;

          const flight = paperFlight(k, exit, target, { x: p.x, y: p.y, r: p.r, s: p.s }, H);
          p.setX((flight?.x ?? p.x) - p.w / 2);
          p.setY((flight?.y ?? p.y) - p.h / 2);
          p.setR(flight?.r ?? p.r);
          p.setSX(flight?.s ?? p.s);
          p.setSY(flight?.s ?? p.s);
          // Only when it changes: writing it each frame would make the browser recheck 22 elements' styles.
          const z = flight ? 5 + k : on ? 999 : p.z;
          if (z !== p.shownZ) {
            p.shownZ = z;
            p.el.style.zIndex = String(z);
          }
          if (flight) {
            p.el.style.opacity = flight.opacity.toFixed(3);
            p.el.style.pointerEvents = "none";
            return;
          }

          const vw = p.w * p.s * 0.9;
          const vh = p.h * p.s * 0.9;
          const hide = !on && (overlapsOval(p.x, p.y, vw, vh, face) || overlapsRect(p.x, p.y, vw, vh, copy, 0));
          // Set separately: a paper back from its flight can already read as opacity 1.
          const opacity = hide ? "0" : "1";
          if (p.el.style.opacity !== opacity) p.el.style.opacity = opacity;
          const pointer = hide ? "none" : "auto";
          if (p.el.style.pointerEvents !== pointer) p.el.style.pointerEvents = pointer;
        });
      };
      gsap.ticker.add(frame);

      return () => {
        gsap.ticker.remove(frame);
        observer.disconnect();
        hoverHandlers.forEach((off) => off());
        window.removeEventListener("mousemove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: refs.section, dependencies: [mob, reduced, papersMounted], revertOnUpdate: true },
  );
}
