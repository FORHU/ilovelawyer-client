"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type RefObject } from "react";
import Link from "next/link";
import { DISCLAIMER, FAQS, SUPPORT_EMAIL, TRUST_CARDS } from "@/lib/marketing/copy";
import { portraitPlacement } from "@/lib/marketing/hero-geometry";
import { CopyText } from "./copy-text";
import { gsap, ScrollTrigger, useGSAP } from "./use-gsap-setup";
import { useReducedMotion } from "./use-reduced-motion";

// The page after the story: trust, questions, the closing call to action and the footer. These are
// the pieces; closing.desktop and closing.mobile only say how they are laid out on each device.

const SCROLL_SMOOTHING = 0.4;
const SECTION_TITLE = "font-archivo m-0 text-[clamp(38px,4.6vw,64px)] font-light leading-none tracking-[-0.035em]";
const FADE_STOPS = "#050403 0%, rgba(5,4,3,.97) 10%, rgba(5,4,3,.9) 22%, rgba(5,4,3,.76) 36%, rgba(5,4,3,.56) 50%, rgba(5,4,3,.34) 65%, rgba(5,4,3,.15) 80%, rgba(5,4,3,.04) 92%, rgba(5,4,3,0) 100%";

/** The slow drift of the gold glow behind a dark section, only while it is on screen. */
function useGoldDrift(ref: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const tick = (time: number) => {
      el.style.setProperty("--gx1", `${(28 + 22 * Math.sin(time * 0.13)).toFixed(2)}%`);
      el.style.setProperty("--gy1", `${(78 + 14 * Math.cos(time * 0.11)).toFixed(2)}%`);
      el.style.setProperty("--gx2", `${(78 + 16 * Math.cos(time * 0.09)).toFixed(2)}%`);
      el.style.setProperty("--gy2", `${(28 + 18 * Math.sin(time * 0.12)).toFixed(2)}%`);
    };
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    });
    seen.observe(el);
    return () => {
      seen.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [ref, reduced]);
}

/** Children of each [data-reveal] rise into place, one after another, as they scroll into view. */
export function useReveals(root: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  useGSAP(
    () => {
      if (reduced) return;
      for (const group of gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current)) {
        // Explicit end values: from() would take them from the element, which can read as 0 while
        // a button's own opacity transition is still running, leaving it invisible.
        gsap.fromTo(
          group.children,
          { opacity: 0, y: 56 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "landingRise",
            stagger: 0.09,
            clearProps: "opacity,transform",
            scrollTrigger: { trigger: group, start: "top 90%", once: true },
          },
        );
      }
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );
}

export function TrustSection({ sidePad }: { sidePad: string }) {
  const section = useRef<HTMLElement>(null);
  useGoldDrift(section);
  return (
    <section ref={section} id="trust" className={`landing-gold-a relative z-1 pb-24 pt-[120px] text-[#f5f3ef] ${sidePad}`}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[280px]" style={{ background: "linear-gradient(180deg, #000 0%, rgba(0,0,0,.85) 30%, rgba(0,0,0,.45) 65%, rgba(0,0,0,0) 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-80" style={{ background: `linear-gradient(0deg, ${FADE_STOPS})` }} />
      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-14">
        <div data-reveal className="flex max-w-[640px] flex-col gap-[18px]">
          <span className="font-landing-mono text-[11px] uppercase tracking-widest text-[#f5f3ef]/74">Trust</span>
          <h2 className={`${SECTION_TITLE} text-balance`}>What to know before you start</h2>
        </div>
        <div data-reveal className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {TRUST_CARDS.map((c) => (
            <article key={c.title} className="flex flex-col gap-4 rounded-3xl border border-white/14 bg-white/[0.045] px-[26px] py-7">
              <h3 className="font-archivo m-0 text-balance text-[26px] font-normal leading-[1.1] tracking-[-0.02em]">{c.title}</h3>
              <p className="m-0 text-pretty text-[16px] leading-[1.6] text-[#f5f3ef]/84">
                <CopyText text={c.body} />
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ sidePad, grid }: { sidePad: string; grid: string }) {
  const [open, setOpen] = useState(0);
  // An answer opening or closing moves everything below it, so triggers there must re-measure.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [open]);
  return (
    <section id="faq" className={`relative z-1 bg-[#050403] pb-40 pt-12 text-[#f5f3ef] ${sidePad}`}>
      <div className={`mx-auto grid max-w-[1180px] items-start ${grid}`}>
        <h2 className={SECTION_TITLE}>Questions</h2>
        <div className="flex flex-col border-t border-white/16">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-white/16">
                <h3 className="m-0">
                  <button
                    type="button"
                    id={`faq-b${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-p${i}`}
                    className="font-archivo flex min-h-16 w-full items-center justify-between gap-6 border-0 bg-transparent py-[18px] text-left text-[22px] font-normal leading-tight tracking-[-0.015em] text-inherit"
                  >
                    <span>{f.q}</span>
                    <span
                      aria-hidden
                      className="flex size-[30px] flex-none items-center justify-center rounded-full border border-white/32 font-sans text-[17px] font-light transition-transform duration-300"
                      style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div id={`faq-p${i}`} role="region" aria-labelledby={`faq-b${i}`} className="max-w-[68ch] pb-[26px] pr-14 text-pretty text-[17px] leading-[1.6] text-[#f5f3ef]/84">
                    <CopyText text={f.a} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ClosingCta({ mob, shade, copyClass, copyStyle }: { mob: boolean; shade: string; copyClass: string; copyStyle: CSSProperties }) {
  const section = useRef<HTMLElement>(null);
  const image = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [size, setSize] = useState<{ W: number; H: number } | null>(null);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const measure = new ResizeObserver(() => setSize({ W: el.clientWidth, H: el.clientHeight }));
    measure.observe(el);
    return () => measure.disconnect();
  }, []);

  useGSAP(
    () => {
      if (reduced || !section.current || !image.current) return;
      const drift = () => (section.current?.offsetHeight ?? 0) * 0.12;
      gsap.fromTo(
        image.current,
        { y: () => -drift() },
        {
          y: () => drift(),
          ease: "none",
          scrollTrigger: { trigger: section.current, start: "top bottom", end: "bottom top", scrub: SCROLL_SMOOTHING, invalidateOnRefresh: true },
        },
      );
    },
    { scope: section, dependencies: [reduced], revertOnUpdate: true },
  );

  const place = size ? portraitPlacement(size.W, size.H, mob) : null;
  const portrait: CSSProperties = place
    ? { left: place.left, top: place.top, width: place.width, height: place.height, backgroundSize: "100% 100%" }
    : { inset: 0, backgroundSize: "cover", backgroundPosition: "59% 31%" };

  return (
    <section ref={section} className="relative z-1 h-screen min-h-[600px] w-full overflow-hidden bg-[#2a241d]">
      <div ref={image} role="img" aria-label="A woman smiles as she reads a letter at her kitchen table, moving boxes stacked behind her" className="absolute inset-x-0 -bottom-[14%] -top-[14%] will-change-transform">
        <div className="absolute" style={{ ...portrait, backgroundImage: 'url("/landing/portrait-cta.webp")' }} />
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ background: shade }} />
      <div className="pointer-events-none absolute inset-x-0 -top-px h-[38%]" style={{ background: `linear-gradient(180deg, ${FADE_STOPS})` }} />
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-[42%]" style={{ background: `linear-gradient(0deg, ${FADE_STOPS})` }} />
      <div data-reveal className={`pointer-events-none absolute inset-0 flex flex-col gap-7 text-white ${copyClass}`} style={copyStyle}>
        <h2 className="font-archivo m-0 max-w-[9ch] text-balance text-[clamp(48px,7.5vw,132px)] font-[250] leading-[0.92] tracking-[-0.045em]">Ready when you are.</h2>
        <p className="m-0 max-w-[400px] text-[17px] leading-normal">About ten minutes to describe your situation. Save and come back any time.</p>
        <Link
          href="/signup"
          data-btn
          className="pointer-events-auto inline-flex min-h-[52px] items-center rounded-full bg-white px-[30px] py-[15px] text-[17px] font-medium text-[#0c0c0e]! transition-opacity duration-160 hover:opacity-85"
        >
          Start your case
        </Link>
      </div>
    </section>
  );
}

export function LandingFooterView({
  onAnchor,
  className,
  grid,
  brandClass,
}: {
  onAnchor: (e: MouseEvent<HTMLAnchorElement>) => void;
  className: string;
  grid: string;
  brandClass: string;
}) {
  const footer = useRef<HTMLElement>(null);
  useGoldDrift(footer);
  const heading = "text-[14px] text-[#f3f1ee]/60";
  return (
    <footer ref={footer} className={`landing-gold-footer pb-8 pt-20 text-[#f3f1ee] ${className}`}>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-16">
        <div className={`grid text-[16px] leading-[1.4] ${grid}`}>
          <div className={`flex flex-col gap-3.5 ${brandClass}`}>
            <span className="font-display text-[24px] tracking-[-0.02em]">ilovelawyer</span>
            <span className="max-w-[300px] text-[15px] leading-normal text-[#f3f1ee]/74">{DISCLAIMER}</span>
          </div>
          <nav aria-label="Product" className="flex flex-col gap-3">
            <span className={heading}>Product</span>
            <a href="#how" onClick={onAnchor}>How it works</a>
            <a href="#faq" onClick={onAnchor}>FAQ</a>
          </nav>
          <nav aria-label="Legal" className="flex flex-col gap-3">
            <span className={heading}>Legal</span>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refunds">Refunds</Link>
          </nav>
          <div className="flex flex-col gap-3">
            <span className={heading}>Contact</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all">{SUPPORT_EMAIL}</a>
          </div>
        </div>
        <div className="flex flex-col gap-5 border-t border-white/12 pt-6">
          <span className="self-end text-[14px]">© ilovelawyer</span>
        </div>
      </div>
    </footer>
  );
}
