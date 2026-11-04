"use client";

import { useRef, useSyncExternalStore, type CSSProperties } from "react";
import { PROBLEMS } from "@/lib/marketing/problems";
import { HeroBackdrop } from "./hero-backdrop";
import { HeroCopy } from "./hero-copy";
import { Paper } from "./paper";
import type { StoryScroll } from "./story";
import type { HeroModel } from "./use-hero";
import { useHeroMotion } from "./use-hero-motion";

const subscribeNever = () => () => {};

/** What both hero views share: the section, its layers and the motion. A view only says how the
 * copy, the overlay and the selected paper differ on its device. */
export function HeroFrame({
  model,
  scroll,
  mob,
  overlay,
  copyStyle,
  selectedWidth,
}: {
  model: HeroModel;
  scroll: StoryScroll;
  mob: boolean;
  overlay: string;
  copyStyle: CSSProperties;
  selectedWidth: number;
}) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);

  // Papers are placed at random, so they only exist in the browser.
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false);

  useHeroMotion(model, scroll, mob, { section, copy, backdrop, dim }, inBrowser);

  return (
    <section
      ref={section}
      id="top"
      aria-label="Legal trouble, made clear"
      className="relative z-3 h-svh min-h-[680px] w-full overflow-x-clip overflow-y-visible bg-black text-white"
    >
      <HeroBackdrop
        ref={backdrop}
        selected={model.selected}
        previous={model.previous}
        paused={model.paused}
        size={model.size}
        loaded={model.loaded}
        mob={mob}
        overlay={overlay}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-2px] z-0 h-[420px]"
        style={{ background: "linear-gradient(0deg, #000 0%, #000 12%, rgba(0,0,0,.86) 30%, rgba(0,0,0,.62) 48%, rgba(0,0,0,.36) 66%, rgba(0,0,0,.14) 84%, rgba(0,0,0,0) 100%)" }}
      />
      <div role="group" aria-label="Choose a legal problem" className="pointer-events-none absolute inset-0">
        {inBrowser &&
          PROBLEMS.map((p, k) => (
            <Paper
              key={p.slug}
              problem={p}
              k={k}
              selected={k === model.selected}
              selectedWidth={selectedWidth}
              showHelp={!mob}
              onPick={(i) => model.select(i, true)}
            />
          ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-500 h-[120px]"
        style={{ background: "linear-gradient(180deg, rgba(5,4,3,.88) 0%, rgba(5,4,3,.55) 55%, rgba(5,4,3,0) 100%)" }}
      />
      <HeroCopy ref={copy} headline={model.headline} search={model.search} reduced={model.reduced} style={copyStyle} />
      {!model.reduced && (
        <button
          type="button"
          onClick={model.togglePaused}
          aria-label={model.paused ? "Play motion" : "Pause motion"}
          aria-pressed={model.paused}
          className="absolute bottom-5 right-5 z-600 flex size-11 items-center justify-center gap-1 rounded-full border border-white/60 bg-[rgb(5_4_3/0.55)] p-0 text-white hover:bg-[rgb(5_4_3/0.8)]"
        >
          {model.paused ? (
            <span className="ml-[3px] h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
          ) : (
            <>
              <span className="h-[13px] w-[3px] rounded-[1px] bg-current" />
              <span className="h-[13px] w-[3px] rounded-[1px] bg-current" />
            </>
          )}
        </button>
      )}
      <div
        ref={dim}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-650 opacity-0"
        style={{ background: "radial-gradient(ellipse 60% 70% at 50% 55%, rgba(5,4,3,.55) 0%, rgba(5,4,3,.78) 100%)" }}
      />
    </section>
  );
}
