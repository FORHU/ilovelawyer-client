"use client";

import Link from "next/link";
import { LanguageSegmented } from "@/components/site/language-toggle";
import { ThemeSegmented } from "@/components/site/theme-toggle";
import type { HeaderViewProps } from "./header";
import { useLandingContent } from "./landing-content";

/** Every control in the bar stands 36px tall, the nav links on the left included, so the row reads
 * as one line. */
const LINK = "inline-flex h-9 items-center px-2.5 text-[15px]";
const PILL = "inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-[14px]";

export function LandingHeaderDesktop({ solid, onAnchor }: HeaderViewProps) {
  const { nav } = useLandingContent();
  return (
    <header
      data-solid={solid}
      className="landing-header fixed inset-x-0 top-0 z-60 flex items-center justify-between gap-4 px-8 py-3.5"
    >
      <div className="flex min-w-0 items-center gap-7">
        <a href="#top" onClick={onAnchor} className="font-display whitespace-nowrap text-[20px] tracking-[-0.02em]">
          ilovelawyer
        </a>
        <nav className="flex gap-1">
          <a href="#how" onClick={onAnchor} className={LINK}>
            {nav.how}
          </a>
          <a href="#faq" onClick={onAnchor} className={LINK}>
            {nav.faq}
          </a>
        </nav>
      </div>
      <div className="flex flex-none items-center gap-2">
        <LanguageSegmented tone="overlay" size="md" />
        <ThemeSegmented tone="overlay" size="md" className="mr-1" />
        <Link href="/login" data-btn className={`${PILL} border border-(--hbd)`}>
          {nav.signIn}
        </Link>
        <Link href="/signup" data-btn className={`landing-cta ${PILL} bg-(--hb) font-medium transition-opacity duration-160 hover:opacity-85`}>
          {nav.start}
        </Link>
      </div>
    </header>
  );
}
