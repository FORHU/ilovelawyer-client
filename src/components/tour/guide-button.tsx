"use client";

import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTour } from "@/lib/tour/store";

const variants = {
  /** The sidebar's list of pages. */
  nav: "flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] font-medium text-ink hover:bg-chip/60",
  /** The collapsed sidebar's round buttons. */
  rail: "flex size-[34px] shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink",
  /** The phone's top bar. */
  bar: "flex size-11 items-center justify-center rounded-full text-ink-2 active:bg-chip",
  /** A labelled button on a page's own header (the new-case chat on a desktop). */
  pill: "flex min-h-8 items-center gap-1.5 rounded-full border border-line-input bg-white px-3 text-[12px] font-medium text-ink-2 hover:border-line-hover hover:text-ink",
} as const;

/** Opens the guide. Rendered in the sidebar and the phone top bar; only the visible one is the
 * tour's "Guide" stop. */
export function GuideButton({ variant }: { variant: keyof typeof variants }) {
  return (
    <button
      type="button"
      onClick={() => useTour.getState().setGuideOpen(true)}
      aria-label="Guide"
      title="Guide"
      data-tour="guide"
      data-no-tap
      className={cn(variants[variant])}
    >
      <CircleHelp size={variant === "rail" ? 15 : variant === "bar" ? 17 : variant === "pill" ? 14 : 16} aria-hidden />
      {(variant === "nav" || variant === "pill") && "Guide"}
    </button>
  );
}
