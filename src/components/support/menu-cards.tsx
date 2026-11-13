"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { SupportMenuCard } from "@/lib/support/types";

const arrow = "flex size-11 items-center justify-center rounded-full border border-line bg-white text-ink-2 hover:border-line-hover disabled:opacity-30";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The topics, as cards to swipe through. The next card peeks in from the edge so it is plain
 * there are more; arrow keys move between cards, and Previous / Next buttons do the same for a
 * mouse that can't swipe. */
export function MenuCards({ cards, onPick }: { cards: SupportMenuCard[]; onPick: (card: SupportMenuCard) => void }) {
  const rail = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const read = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const next = { start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 };
    setEdge((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useEffect(() => {
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [read, cards.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reducedMotion() ? "auto" : "smooth" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = buttons[at + (e.key === "ArrowRight" ? 1 : -1)];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  if (cards.length === 0) return null;
  const scrollable = !(edge.start && edge.end);

  return (
    <section aria-label="Help topics" className="flex flex-col gap-2">
      <div className="flex min-h-11 items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-2">Topics</h3>
        {scrollable && (
          <div className="flex gap-1">
            <button type="button" aria-label="Previous topics" disabled={edge.start} onClick={() => scrollBy(-1)} className={arrow}>
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button type="button" aria-label="Next topics" disabled={edge.end} onClick={() => scrollBy(1)} className={arrow}>
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        )}
      </div>
      <ul ref={rail} onScroll={read} onKeyDown={onKeyDown} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
        {cards.map((card) => (
          <li key={card.id} className="w-[72%] max-w-[260px] shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onPick(card)}
              onFocus={(e) => e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" })}
              className="flex h-full min-h-28 w-full flex-col items-start gap-1 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-line-hover active:bg-chip"
            >
              <span className="text-[15px] font-semibold leading-snug text-ink">{card.title}</span>
              {card.subtitle && <span className="text-[13px] leading-snug text-ink-2">{card.subtitle}</span>}
              <ArrowRight size={16} className="mt-auto pt-2 text-gold" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
