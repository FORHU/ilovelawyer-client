"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/components/site/language-provider";
import { cn } from "@/lib/cn";

/** The column the new-case steps (story, questions, evidence) share on desktop. */
export const STEP_COLUMN = "mx-auto w-full max-w-240 px-8";

/**
 * A new-case step on desktop: the page scrolls as a whole, with the content in one centred column
 * and the step's actions pinned along the bottom. With `rail` (Your case, CaseRail) the column and
 * the rail share a centred grid, once the page is wide enough for both (a container query, so the
 * sidebar's width counts); narrower, the rail isn't shown. (On a phone the steps use ChatScreen and
 * ChatBar.)
 */
export function StepPage({ header, bar, rail, children }: { header: ReactNode; bar?: ReactNode; rail?: ReactNode; children: ReactNode }) {
  if (!rail) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className={STEP_COLUMN}>
            {header}
            <div className="pt-3 pb-8">{children}</div>
          </div>
        </div>
        {bar && (
          <div className="shrink-0 border-t border-line bg-surface">
            <div className={cn(STEP_COLUMN, "py-4")}>{bar}</div>
          </div>
        )}
      </div>
    );
  }
  // The bar lines up with the column above it, under the same grid.
  const grid = "mx-auto grid w-full max-w-[1120px] gap-10 px-8 @min-[960px]:grid-cols-[minmax(0,1fr)_300px]";
  return (
    <div className="@container flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={grid}>
          <div className="min-w-0">
            {header}
            <div className="pt-3 pb-8">{children}</div>
          </div>
          <aside className="hidden pt-6 pb-8 @min-[960px]:block">{rail}</aside>
        </div>
      </div>
      {bar && (
        // No rule across the empty rail column: the step fades out under the bar instead.
        <div className="relative shrink-0 bg-surface">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-surface to-transparent" />
          <div className={cn(grid, "py-4")}>
            <div className="min-w-0">{bar}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** The row over a step's title (questions, evidence): the way back to the case, with `aside` (the
 * progress) on the right. */
export function StepTopRow({ caseHref, aside }: { caseHref: string; aside?: ReactNode }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={caseHref} data-no-tap className="flex min-h-11 items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[1.2px] text-ink-2 hover:text-ink">
        <ArrowLeft size={14} aria-hidden="true" />
        {t("Your case")}
      </Link>
      {aside}
    </div>
  );
}
