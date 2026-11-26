"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { LanguageSegmented } from "@/components/site/language-toggle";
import { ThemeSegmented } from "@/components/site/theme-toggle";
import { useT } from "@/components/site/language-provider";

/**
 * The top of every screen of the new-client flow, so it reads as one: the Welcome and the privacy
 * step (OnboardingFrame), then the story, questions and evidence, which take the whole screen in the
 * app (AppHeader's focus bar). The logo (in the brand panel instead on a wide screen), where they are
 * ("Step 2 of 2") when there's a count, the site's languages and light / dark mode, and, once
 * signed in and making a case, Skip, to leave the rest for later.
 */
export function OnboardingBar({ step, skipHref }: { step?: { n: number; total: number }; skipHref?: string }) {
  const t = useT();
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 bg-surface px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4 md:px-8 md:pt-5">
      <span className="flex min-h-11 items-center lg:hidden">
        <Logo height={22} />
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        {step && <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink-2">{t("Step {n} of {total}", step)}</span>}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSegmented />
          <ThemeSegmented />
        </div>
        {skipHref && (
          <Link
            href={skipHref}
            className="flex min-h-9 items-center rounded-full px-3 text-[13px] font-medium text-ink-2 underline underline-offset-4 transition-colors hover:bg-chip hover:text-ink"
          >
            {t("Skip")}
          </Link>
        )}
      </div>
    </header>
  );
}
