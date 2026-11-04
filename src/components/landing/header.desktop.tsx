import Link from "next/link";
import type { HeaderViewProps } from "./header";

export function LandingHeaderDesktop({ solid, onAnchor }: HeaderViewProps) {
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
          <a href="#how" onClick={onAnchor} className="px-2.5 py-2 text-[15px]">
            How it works
          </a>
          <a href="#faq" onClick={onAnchor} className="px-2.5 py-2 text-[15px]">
            FAQ
          </a>
        </nav>
      </div>
      <div className="flex flex-none items-center gap-2">
        <Link
          href="/login"
          data-btn
          className="whitespace-nowrap rounded-full border border-(--hbd) px-[19px] py-[11px] text-[15px]"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          data-btn
          className="landing-cta whitespace-nowrap rounded-full bg-(--hb) px-5 py-3 text-[15px] font-medium transition-opacity duration-160 hover:opacity-85"
        >
          Start your case
        </Link>
      </div>
    </header>
  );
}
