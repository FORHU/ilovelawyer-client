"use client";

import { forwardRef, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { DEFAULT_HEADLINE, PROBLEMS, START_PROBLEM, twoLines } from "@/lib/marketing/problems";
import { gsap, useGSAP } from "./use-gsap-setup";
import type { HeroModel } from "./use-hero";

const NO_HEADLINE = -1;
const HEADLINES = [
  { key: NO_HEADLINE, lines: ["Legal trouble,", "made clear."] },
  ...PROBLEMS.map((p, i) => ({ key: i, lines: twoLines(p.h) })),
];

type Props = Pick<HeroModel, "headline" | "search" | "reduced"> & { style: CSSProperties };

/** The hero's centre: the headline that swaps with the selected problem, the search box and the CTA. */
export const HeroCopy = forwardRef<HTMLDivElement, Props>(function HeroCopy({ headline, search, reduced, style }, ref) {
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef<number | null>(null);

  useGSAP(
    () => {
      const item = (key: number) => heading.current?.querySelector<HTMLElement>(`[data-line="${key}"]`) ?? null;
      const incoming = item(headline);
      // First run, or back from a hidden route: everything goes straight to where it belongs.
      if (shown.current === null) {
        for (const { key } of HEADLINES) {
          const el = item(key);
          if (el) gsap.set(el, { yPercent: key === headline ? 0 : 110, opacity: key === headline ? 1 : 0, filter: "blur(0px)" });
        }
      } else if (shown.current !== headline) {
        const outgoing = item(shown.current);
        const time = reduced ? 0 : 1;
        if (outgoing) gsap.to(outgoing, { yPercent: -110, opacity: 0, filter: "blur(8px)", duration: 0.7 * time, ease: "landingLeave", overwrite: true });
        if (incoming) {
          gsap.fromTo(
            incoming,
            { yPercent: 110, opacity: 0, filter: "blur(0px)" },
            { yPercent: 0, opacity: 1, duration: 1.1 * time, delay: 0.12 * time, ease: "landingRise", overwrite: true },
          );
        }
      }
      shown.current = headline;
      return () => {
        shown.current = null;
      };
    },
    { dependencies: [headline, reduced], revertOnUpdate: false },
  );

  const label = headline === NO_HEADLINE ? DEFAULT_HEADLINE : PROBLEMS[headline].h;

  return (
    <div ref={ref} className="pointer-events-none absolute z-300 flex flex-col items-center gap-4 text-center" style={style}>
      <h1
        ref={heading}
        aria-label={label}
        className="font-archivo relative -my-[.13em] grid overflow-hidden px-[.04em] pb-[.12em] pt-[.14em] text-[clamp(28px,3.4vw,58px)] font-[250] leading-none tracking-[-0.045em] [text-shadow:0_2px_24px_rgba(0,0,0,.5)]"
      >
        {HEADLINES.map(({ key, lines }) => (
          <span
            key={key}
            data-line={key}
            aria-hidden
            className="inset-x-0 bottom-[.12em] flex flex-col items-center"
            style={{ position: key === headline ? "relative" : "absolute", opacity: key === START_PROBLEM ? 1 : 0 }}
          >
            {lines.map((line) => (
              <span key={line} className="whitespace-nowrap">
                {line}
              </span>
            ))}
          </span>
        ))}
      </h1>

      <form role="search" onSubmit={search.onSubmit} className="pointer-events-auto flex w-[min(440px,100%)] flex-col items-center gap-2.5">
        <div className="relative flex w-full items-center">
          <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" className="pointer-events-none absolute left-5 text-white/80">
            <circle cx="7.5" cy="7.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={search.input}
            type="search"
            value={search.query}
            onChange={(e) => search.onInput(e.target.value)}
            onFocus={search.onFocus}
            onBlur={search.onBlur}
            placeholder={search.initialPlaceholder}
            aria-label="Describe your legal problem"
            autoComplete="off"
            enterKeyHint="go"
            className="landing-search min-h-14 w-full rounded-full border border-white/50 bg-[rgb(5_4_3/0.5)] pl-12 pr-[60px] text-[16px] text-white shadow-[0_10px_30px_rgba(0,0,0,.25)] outline-none backdrop-blur-[14px]"
          />
          <button
            type="submit"
            aria-label="Start your case with this"
            className="absolute right-1.5 flex size-11 items-center justify-center rounded-full border-0 bg-white p-0 text-[#0c0c0e]"
          >
            <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {search.noMatch && (
          <Link href="/signup" onClick={search.carryOver} className="pointer-events-auto text-[14px] text-white underline! underline-offset-3 [text-shadow:0_1px_8px_rgba(0,0,0,.6)]">
            Not sure? Start your case and describe it
          </Link>
        )}
      </form>

      <p className="m-0 max-w-[420px] text-pretty text-[17px] leading-normal [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
        Understand your legal problem, then get a verified UK solicitor.
      </p>
      <Link
        href="/signup"
        data-btn
        onClick={search.carryOver}
        className="pointer-events-auto inline-flex min-h-[50px] items-center rounded-full bg-white px-[26px] py-3.5 text-[16px] font-medium text-[#0c0c0e]! transition-opacity duration-160 hover:opacity-85"
      >
        Start your case
      </Link>
      <p className="m-0 max-w-[340px] text-[12.5px] leading-[1.45] text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,.6)]">
        AI guidance, not legal advice. Advice comes from the solicitor you choose.
      </p>
    </div>
  );
});
