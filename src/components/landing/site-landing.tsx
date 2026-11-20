import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/marketing/copy";
import type { SiteLandingCopy } from "@/lib/marketing/site-landing";
import { ThemeSegmented } from "@/components/site/theme-toggle";

/** The landing page of a site whose lawyers and AI chat aren't open yet (PH, KR): what works there
 * today, and what's coming. A server component; the copy comes from lib/marketing/site-landing.ts. */
export function SiteLanding({ copy }: { copy: SiteLandingCopy }) {
  return (
    <div lang={copy.lang} className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <span className="font-display whitespace-nowrap text-[20px] tracking-[-0.02em]">ilovelawyer</span>
        <div className="flex items-center gap-2">
          <ThemeSegmented tone="band" size="md" />
          <Link href="/login" data-btn className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-(--line) px-4 text-[14px]">
            {copy.signIn}
          </Link>
          <Link href="/signup" data-btn className="inline-flex h-9 items-center whitespace-nowrap rounded-full bg-(--ink) px-4 text-[14px] font-medium text-(--bg)! transition-opacity duration-160 hover:opacity-85">
            {copy.start}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-16 px-4 pb-20 pt-16 md:px-8 md:pt-28">
        <section className="flex max-w-[720px] flex-col items-start gap-6">
          <span className="font-landing-mono text-[12px] uppercase tracking-[1.5px] text-(--muted)">{copy.eyebrow}</span>
          <h1 className="font-display text-[44px] leading-[1.05] tracking-[-0.03em] md:text-[72px]">
            {copy.headline[0]}
            <br />
            <span className="font-caslon-italic">{copy.headline[1]}</span>
          </h1>
          <p className="max-w-[540px] text-pretty text-[17px] leading-normal text-(--muted)">{copy.sub}</p>
          <Link href="/signup" data-btn className="inline-flex min-h-[50px] items-center rounded-full bg-(--ink) px-[26px] py-3.5 text-[16px] font-medium text-(--bg)! transition-opacity duration-160 hover:opacity-85">
            {copy.start}
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {copy.features.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 rounded-2xl border border-(--line) bg-(--surface) p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[18px] font-semibold">{f.title}</h2>
                {f.soon && <span className="rounded-full border border-(--line) px-2.5 py-0.5 text-[12px] text-(--muted)">{copy.soon}</span>}
              </div>
              <p className="text-[15px] leading-[1.55] text-(--muted)">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-(--line) px-4 py-8 md:px-8">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 text-[14px] md:flex-row md:items-center md:justify-between">
          <span className="max-w-[460px] text-(--muted)">{copy.disclaimer}</span>
          <nav aria-label={copy.legal.label} className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/terms">{copy.legal.terms}</Link>
            <Link href="/privacy">{copy.legal.privacy}</Link>
            <Link href="/refunds">{copy.legal.refunds}</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all">
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
