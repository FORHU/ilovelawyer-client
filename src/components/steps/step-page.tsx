"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/components/site/language-provider";
import { useDevice } from "@/components/device/device-provider";
import { useStepFlow } from "@/lib/cases/step-flow";
import { cn } from "@/lib/cn";

/** The column the new-case steps (story, questions, evidence) share on desktop. */
export const STEP_COLUMN = "mx-auto w-full max-w-240 px-8";

/**
 * A new-case step on desktop: the page scrolls as a whole, edge to edge, with the content in one
 * centred column and the step's actions pinned along the bottom. (On a phone the steps use
 * ChatScreen and ChatBar instead.)
 */
export function StepPage({ header, bar, children }: { header: ReactNode; bar?: ReactNode; children: ReactNode }) {
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

/**
 * The row over a step's title (questions, evidence): in the app, the way back to the case, with
 * `aside` (the progress) on the right; in the onboarding, no way back, the progress, and on a phone
 * Skip (where a desktop has it in the top bar, OnboardingBar).
 */
export function StepTopRow({ caseHref, aside }: { caseHref: string; aside?: ReactNode }) {
  const t = useT();
  const { onboarding } = useStepFlow();
  const mobile = useDevice() === "mobile";
  if (onboarding) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3">
        {aside}
        {mobile && (
          <Link href={caseHref} data-no-tap className="ml-auto flex min-h-11 items-center text-[13px] font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
            {t("Skip")}
          </Link>
        )}
      </div>
    );
  }
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
