"use client";

import { forwardRef, type CSSProperties } from "react";
import { heroFace } from "@/lib/marketing/hero-geometry";
import { heroImageSrc, PROBLEMS } from "@/lib/marketing/problems";
import type { HeroModel } from "./use-hero";

type Props = Pick<HeroModel, "selected" | "previous" | "paused" | "size" | "loaded"> & {
  mob: boolean;
  /** The soft dark patch that keeps the centre copy readable. */
  overlay: string;
};

/** The hero's photos, stacked and crossfaded. Each is placed by the person's eyes once the hero's
 * size is known; until then it is a plain cover at the same focal point. */
export const HeroBackdrop = forwardRef<HTMLDivElement, Props>(function HeroBackdrop(
  { selected, previous, paused, size, loaded, mob, overlay },
  ref,
) {
  return (
    <div ref={ref} className="absolute inset-0 z-0 overflow-hidden bg-[#2a241d]">
      {PROBLEMS.map((p, i) => {
        const on = i === selected;
        const was = i === previous && !on;
        const f = size ? heroFace(p, size.W, size.H, mob) : null;
        const image: CSSProperties = {
          backgroundImage: loaded.has(i) ? `url("${heroImageSrc(p)}")` : undefined,
          backgroundSize: f ? `${f.bw.toFixed(1)}px ${f.bh.toFixed(1)}px` : "cover",
          backgroundPosition: f ? `${f.ox.toFixed(1)}px ${f.oy.toFixed(1)}px` : `${p.fx * 100}% ${(mob ? 0.28 : p.fy) * 100}%`,
          transformOrigin: f ? `${f.ex.toFixed(1)}px ${f.ey.toFixed(1)}px` : undefined,
          transform: on && !paused ? "scale(1.12)" : "scale(1.08)",
          transition: on ? "transform 14s linear" : "transform 1s ease 900ms",
        };
        return (
          <div
            key={p.slug}
            aria-hidden={!on}
            className="absolute inset-0"
            style={{
              zIndex: on ? 2 : was ? 1 : 0,
              opacity: on || was ? 1 : 0,
              transition: on ? "opacity 900ms ease" : "opacity 0s linear 950ms",
            }}
          >
            <div role="img" aria-label={p.alt} className="absolute inset-0 bg-no-repeat" style={image} />
          </div>
        );
      })}
      <div aria-hidden className="absolute inset-0 z-3" style={{ background: overlay }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[22%]" style={{ background: "linear-gradient(0deg, rgba(5,4,3,.6) 0%, rgba(5,4,3,0) 100%)" }} />
    </div>
  );
});
