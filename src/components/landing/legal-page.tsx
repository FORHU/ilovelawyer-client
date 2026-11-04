"use client";

import { useState } from "react";
import Link from "next/link";
import { Responsive } from "@/components/device/responsive";
import { DISCLAIMER, legalSectionId, type LegalSection } from "@/lib/marketing/copy";
import { CopyText } from "./copy-text";

const LABEL = "font-landing-mono text-[11px] uppercase tracking-widest text-[#f3f1ee]/70";

function Contents({ sections, onPick }: { sections: LegalSection[]; onPick?: () => void }) {
  return (
    <ol id="legal-contents" className="m-0 flex list-none flex-col gap-0.5 p-0">
      {sections.map((s, i) => (
        <li key={s.title}>
          <a href={`#${legalSectionId(s.title, i)}`} onClick={onPick} className="block py-[7px] text-[14px] leading-[1.35] text-[#f3f1ee]/82">
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

function ContentsDesktop({ sections }: { sections: LegalSection[] }) {
  return (
    <aside className="sticky top-24">
      <nav aria-label="Contents" className="flex flex-col gap-3.5 rounded-[18px] border border-white/12 p-[18px]">
        <span className={LABEL}>Contents</span>
        <Contents sections={sections} />
      </nav>
    </aside>
  );
}

function ContentsMobile({ sections }: { sections: LegalSection[] }) {
  const [open, setOpen] = useState(false);
  return (
    <aside>
      <nav aria-label="Contents" className="flex flex-col gap-3.5 rounded-[18px] border border-white/12 p-[18px]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="legal-contents"
          className="flex min-h-11 w-full items-center justify-between border-0 bg-transparent p-0 text-[16px] font-medium text-inherit"
        >
          <span>Contents</span>
          <span aria-hidden className="text-[18px]">
            {open ? "−" : "+"}
          </span>
        </button>
        {open && <Contents sections={sections} onPick={() => setOpen(false)} />}
      </nav>
    </aside>
  );
}

/** The Terms, Privacy and Refunds pages. `updated` may hold a [placeholder] until the date is set. */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <div className="flex min-h-svh flex-col bg-[#050403] text-[#f3f1ee]" style={{ backgroundImage: "radial-gradient(50% 30% at 85% 0%, rgba(201,154,46,.14) 0%, rgba(0,0,0,0) 70%)" }}>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-[rgb(5_4_3/0.82)] px-4 py-3.5 backdrop-blur-[14px] md:px-8">
        <Link href="/" className="font-display text-[20px] tracking-[-0.02em]">
          ilovelawyer
        </Link>
        <div className="flex items-center gap-2">
          <Responsive
            desktop={
              <Link href="/login" data-btn className="rounded-full border border-white/70 px-[19px] py-[11px] text-[15px]">
                Sign in
              </Link>
            }
            mobile={null}
          />
          <Link href="/signup" data-btn className="rounded-full bg-[#f3f1ee] px-5 py-3 text-[15px] font-medium text-[#0c0c0e]!">
            Start your case
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-[120px] pt-[72px] md:px-8">
        <div className="mb-12 flex flex-col gap-[18px] border-b border-white/12 pb-12">
          <span className={LABEL}>Legal</span>
          <h1 className="font-archivo m-0 text-[clamp(48px,8vw,112px)] font-[250] leading-[0.95] tracking-[-0.045em]">{title}</h1>
          <p className="m-0 text-[15px] text-[#f3f1ee]/78">
            <CopyText text={updated} />
          </p>
        </div>

        <Responsive
          desktop={
            <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-[72px]">
              <ContentsDesktop sections={sections} />
              <LegalArticle sections={sections} />
            </div>
          }
          mobile={
            <div className="flex flex-col gap-8">
              <ContentsMobile sections={sections} />
              <LegalArticle sections={sections} />
            </div>
          }
        />
      </main>

      <footer className="border-t border-white/12 p-8 max-md:px-4">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 text-[14px] text-[#f3f1ee]/74">
          <span>{DISCLAIMER}</span>
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refunds">Refunds</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function LegalArticle({ sections }: { sections: LegalSection[] }) {
  return (
    <article className="flex max-w-[68ch] flex-col gap-12 text-[17px] leading-[1.7] text-[#f3f1ee]/88">
      {sections.map((s, i) => (
        <section key={s.title} id={legalSectionId(s.title, i)} className="flex scroll-mt-24 flex-col gap-3.5">
          <h2 className="font-archivo m-0 text-balance text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-[#f3f1ee]">{s.title}</h2>
          {s.blocks.map((block, b) =>
            Array.isArray(block) ? (
              <ul key={b} className="m-0 flex list-disc flex-col gap-2 pl-[1.2em]">
                {block.map((item) => (
                  <li key={item} className="text-pretty pl-1">
                    <CopyText text={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <p key={b} className="m-0 text-pretty">
                <CopyText text={block} />
              </p>
            ),
          )}
        </section>
      ))}
    </article>
  );
}
