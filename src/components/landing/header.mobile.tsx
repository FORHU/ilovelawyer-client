"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { LanguageSegmented } from "@/components/site/language-toggle";
import { ThemeSegmented } from "@/components/site/theme-toggle";
import type { HeaderViewProps } from "./header";
import { useLandingContent } from "./landing-content";

const MENU_ITEM = "flex min-h-[52px] items-center px-4 text-[20px] tracking-[-0.02em]";

export function LandingHeaderMobile({ solid, onAnchor }: HeaderViewProps) {
  const { nav } = useLandingContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const onMenuAnchor = (e: MouseEvent<HTMLAnchorElement>) => {
    close();
    onAnchor(e);
  };

  return (
    <>
      <header
        data-solid={solid}
        className="landing-header fixed inset-x-0 top-0 z-60 flex items-center justify-between gap-4 px-4 py-2.5"
      >
        <a href="#top" onClick={onAnchor} className="font-display whitespace-nowrap text-[20px] tracking-[-0.02em]">
          ilovelawyer
        </a>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={nav.menu}
            className="flex size-11 flex-col items-center justify-center gap-[5px] rounded-full border border-(--hbd) bg-transparent p-0 text-(--hc)"
          >
            <span className="h-[1.5px] w-4 bg-current" />
            <span className="h-[1.5px] w-4 bg-current" />
          </button>
        </div>
      </header>
      {open && (
        <nav
          id="landing-menu"
          aria-label={nav.menu}
          className="fixed inset-x-3 top-[70px] z-59 flex flex-col rounded-[22px] border border-(--band-ink)/14 bg-(--band)/96 p-2 text-(--band-ink) backdrop-blur-md"
        >
          <a href="#how" onClick={onMenuAnchor} className={MENU_ITEM}>
            {nav.how}
          </a>
          <a href="#faq" onClick={onMenuAnchor} className={MENU_ITEM}>
            {nav.faq}
          </a>
          <Link href="/login" onClick={close} className={`${MENU_ITEM} border-t border-(--band-ink)/12`}>
            {nav.signIn}
          </Link>
          <div className="flex flex-wrap items-center gap-2 border-t border-(--band-ink)/12 px-3 pb-2 pt-3">
            <LanguageSegmented tone="band" size="lg" />
            <ThemeSegmented tone="band" size="lg" />
          </div>
        </nav>
      )}
    </>
  );
}
