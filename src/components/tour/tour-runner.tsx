"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { firstVisible, SPOTLIGHT_PAD, spotlightRect } from "@/lib/tour/dom";
import { CARD_WIDTH, placeCard, rectMoved, sheetAtTop, type Rect } from "@/lib/tour/placement";
import { useTour, type ActiveTour } from "@/lib/tour/store";
import { tourFor, type TourStep } from "@/lib/tour/tours";
import { useViewport } from "./use-viewport";

/** How long a target may be missing (the page is still loading) before its step is skipped. */
const MISSING_TARGET_MS = 1500;
/** The control bar: 44px buttons in a 6px-padded pill. */
const BAR_HEIGHT = 56;

const label = "text-[10px] font-semibold uppercase tracking-[1.4px] text-muted";

/** Where the control bar sits on a phone: 24px above the safe area, and above the page's sticky
 * bottom bar ("New case", the wizard's Back and Continue, the composer) so it never covers it. */
export function barBottom(sticky: number) {
  return `calc(24px + env(safe-area-inset-bottom, 0px) + ${sticky}px)`;
}

/** How much of the bottom of the screen the page's bars cover: the sticky bottom bar and the tab
 * bar, measured from the screen's bottom edge to the top of the highest, so a bar under another
 * is counted too. 0 when neither is on screen. */
function measureStickyHeight() {
  const tops = ["sticky-bar", "tab-bar"].flatMap((id) => {
    const el = firstVisible(id);
    return el ? [el.getBoundingClientRect().top] : [];
  });
  return tops.length ? Math.max(0, Math.round(window.innerHeight - Math.min(...tops))) : 0;
}

/** For the toast, which has no tour loop to measure in (the runner measures inside its own). */
export function useStickyHeight(enabled: boolean) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const measure = () => {
      const h = measureStickyHeight();
      setHeight((prev) => (prev === h ? prev : h));
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return enabled ? height : 0;
}

/** The spotlight, the step card and the control bar for the tour on screen. Everything outside
 * the cut-out is inert; the spotlight follows its target every frame, so scrolling, resizing and
 * the phone's address bar all keep it in place. */
export function TourRunner({ tour, credits }: { tour: ActiveTour; credits: number | null }) {
  const { setStep, finish } = useTour.getState();
  const viewport = useViewport();
  // The page's bottom bars, on a phone, measured in the same frame loop as the spotlight below.
  const [stickyH, setStickyH] = useState(0);
  const phone = useRef(viewport.phone);
  useEffect(() => {
    phone.current = viewport.phone;
  });
  const sticky = viewport.phone ? stickyH : 0;

  const steps: TourStep[] = tour.id === "G" ? [tour.step] : tourFor(tour.id, { credits }).steps;
  const kicker = tour.id === "G" ? "Guide" : tourFor(tour.id, { credits }).kicker;
  const step = steps[tour.i];
  const last = tour.i === steps.length - 1;
  const title = tour.id === "G" ? tour.question : step?.title;

  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(150);
  const cardRef = useRef<HTMLDivElement>(null);

  const next = () => (last ? finish(false) : setStep(tour.i + 1, 1));
  const prev = () => tour.i > 0 && setStep(tour.i - 1, -1);
  const handlers = useRef({ next, prev });
  useEffect(() => {
    handlers.current = { next, prev };
  });

  // ← and → step, Esc skips. Not while typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.defaultPrevented || t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handlers.current.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlers.current.prev();
      } else if (e.key === "Escape") {
        useTour.getState().finish(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Follow the step's target. It is scrolled to the centre of the screen once per step. A target
  // that never shows up (a control this account doesn't have) skips its step.
  const stepIndex = tour.i;
  const dir = tour.dir;
  useEffect(() => {
    const target = steps[stepIndex];
    if (!target) return;
    let raf = 0;
    let scrolled = false;
    let found = false;
    let missingSince: number | null = null;
    const measure = () => {
      const h = cardRef.current?.getBoundingClientRect().height;
      if (h) setCardH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
      if (phone.current) {
        const s = measureStickyHeight();
        setStickyH((prev) => (prev === s ? prev : s));
      }
      const el = firstVisible(target.target) ?? (target.fallback ? firstVisible(target.fallback) : null);
      if (el) {
        found = true;
        missingSince = null;
        if (!scrolled) {
          scrolled = true;
          el.scrollIntoView({ block: "center", inline: "nearest" });
        }
        const r = spotlightRect(el);
        setRect((prev) => (rectMoved(prev, r) ? r : prev));
      } else {
        missingSince ??= Date.now();
        // A target that was on screen and is gone (the user tapped a starter, say) has done its
        // job: move on at once. One that never appeared may still be loading, so it gets a moment.
        if (found || Date.now() - missingSince > MISSING_TARGET_MS) {
          const to = stepIndex + dir;
          if (to < 0 || to >= steps.length) useTour.getState().finish(to < 0);
          else useTour.getState().setStep(to, dir);
          return;
        }
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
    // `steps` is rebuilt every render and only changes with the tour and its credits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.id, stepIndex, dir, credits]);

  // The card takes focus on each step, so a screen reader reads it.
  const shown = rect !== null;
  useEffect(() => {
    if (shown) cardRef.current?.focus({ preventScroll: true });
  }, [shown, stepIndex]);

  if (!step || !rect || viewport.w === 0) return null;

  const look = viewport.phone && !!step.lookOnPhone;
  const radius = Math.min(rect.radius + SPOTLIGHT_PAD, rect.h / 2 + SPOTLIGHT_PAD);
  const bottom = barBottom(sticky);

  let cardStyle: React.CSSProperties;
  if (viewport.phone) {
    cardStyle = sheetAtTop(rect, viewport.h)
      ? { left: 12, right: 12, top: "calc(12px + env(safe-area-inset-top, 0px))" }
      : { left: 12, right: 12, bottom: `calc(${bottom} + ${BAR_HEIGHT + 12}px)` };
  } else {
    cardStyle = { ...placeCard(rect, cardH, step.placement, viewport.w, viewport.h), width: CARD_WIDTH };
  }

  return (
    <>
      {/* Four blockers around the cut-out keep the rest of the page inert; the target itself still
          takes taps unless this step is look-only. */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-[9000]" style={{ height: Math.max(0, rect.y) }} />
      <div aria-hidden className="fixed inset-x-0 bottom-0 z-[9000]" style={{ top: rect.y + rect.h }} />
      <div aria-hidden className="fixed left-0 z-[9000]" style={{ top: rect.y, height: rect.h, width: Math.max(0, rect.x) }} />
      <div aria-hidden className="fixed right-0 z-[9000]" style={{ top: rect.y, height: rect.h, left: rect.x + rect.w }} />
      {look && <div aria-hidden className="fixed z-[9000]" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />}
      <div
        aria-hidden
        className="pointer-events-none fixed z-[9001] box-border border-2 border-ink shadow-[0_0_0_200vmax_rgb(23_23_23/0.55)] transition-[left,top,width,height] duration-300 ease-out motion-reduce:transition-none"
        style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: radius }}
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-card-title"
        aria-describedby="tour-card-body"
        tabIndex={-1}
        className={cn(
          "fixed z-[9002] box-border flex flex-col gap-1.5 bg-white px-5 py-[18px] shadow-[0_18px_48px_rgb(0_0_0/0.22),0_2px_6px_rgb(0_0_0/0.08)] outline-none transition-[left,top] duration-300 ease-out motion-reduce:transition-none",
          viewport.phone ? "rounded-modal" : "rounded-card",
        )}
        style={cardStyle}
      >
        <span className={label}>{kicker}</span>
        <span id="tour-card-title" className="font-display text-[20px] leading-tight tracking-[-0.01em]">
          {title}
        </span>
        <span id="tour-card-body" className="text-[13px] leading-[1.5] text-ink-2">
          {step.body}
        </span>
      </div>

      <div
        className="fixed left-1/2 z-[9003] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white p-1.5 shadow-[0_10px_30px_rgb(0_0_0/0.18)]"
        style={{ bottom }}
      >
        <button
          type="button"
          onClick={() => finish(true)}
          data-no-tap
          className="inline-flex min-h-11 items-center px-3.5 text-[11px] font-bold uppercase tracking-[1.2px] text-ink"
        >
          Skip tour
        </button>
        <span aria-hidden className="h-6 w-px bg-line" />
        <button
          type="button"
          onClick={prev}
          disabled={tour.i === 0}
          aria-label="Previous step"
          data-no-tap
          className="flex size-11 items-center justify-center rounded-full border border-line-input text-ink disabled:text-[#c9c7bf]"
        >
          <ArrowLeft size={17} aria-hidden />
        </button>
        <span role="status" aria-label={`Step ${tour.i + 1} of ${steps.length}`} className="inline-flex items-center gap-[5px] px-1">
          {steps.map((_, j) => (
            <span key={j} aria-hidden className={cn("h-2 rounded-full transition-[width] motion-reduce:transition-none", j === tour.i ? "w-[22px] bg-ink" : "w-2 bg-line-input")} />
          ))}
        </span>
        <button
          type="button"
          onClick={next}
          aria-label={last ? "Finish tour" : "Next step"}
          data-no-tap
          className="flex size-11 items-center justify-center rounded-full bg-gold text-white hover:bg-gold-hover"
        >
          {last ? <Check size={17} aria-hidden /> : <ArrowRight size={17} aria-hidden />}
        </button>
      </div>
    </>
  );
}
