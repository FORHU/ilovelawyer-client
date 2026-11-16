"use client";

import { CircleHelp } from "lucide-react";
import { SupportDot } from "@/components/support/support-dot";
import { cn } from "@/lib/cn";
import { useSupportUnread } from "@/lib/support/ticket-queries";
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

/** Where the red dot sits on each: the corner of a round button, the end of a row. */
const dots = {
  nav: "right-2.5 top-1/2 -translate-y-1/2",
  rail: "-right-0.5 -top-0.5",
  bar: "right-2 top-2",
  pill: "-right-0.5 -top-0.5",
} as const;

/** Opens the guide. Rendered in the sidebar and the phone top bar; only the visible one is the
 * tour's "Guide" stop. A red dot says the support team has replied: the guide is where Contact
 * support lives. */
export function GuideButton({ variant }: { variant: keyof typeof variants }) {
  const unread = useSupportUnread();
  return (
    <button
      type="button"
      onClick={() => useTour.getState().setGuideOpen(true)}
      aria-label={unread > 0 ? "Guide (new support reply)" : "Guide"}
      title="Guide"
      data-tour="guide"
      data-no-tap
      className={cn("relative", variants[variant])}
    >
      <CircleHelp size={variant === "rail" ? 15 : variant === "bar" ? 17 : variant === "pill" ? 14 : 16} aria-hidden />
      {(variant === "nav" || variant === "pill") && "Guide"}
      {unread > 0 && <SupportDot className={dots[variant]} />}
    </button>
  );
}
