"use client";

import type { ReactNode } from "react";
import { BrandPanel } from "@/components/auth/brand-panel";
import { OnboardingBar } from "./onboarding-bar";

/** The frame of the new-client flow's own screens (the Welcome, the privacy step): as the sign-up
 * before them, the dark brand panel on a wide screen and the light side beside it, with the flow's
 * top bar (OnboardingBar, the same as on the story that follows) over one narrow column. */
export function OnboardingFrame({ step, children }: { step?: { n: number; total: number }; children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-surface text-ink">
      <BrandPanel />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <OnboardingBar step={step} />
        <main className="flex flex-1 flex-col items-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 md:justify-center md:px-8 md:pb-16">
          <div className="flex w-full max-w-[480px] flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function OnboardingHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[1.2px] text-gold">{eyebrow}</p>
      {/* Focusable, so a screen moving on (the story's) can take the reader to its new heading. */}
      <h1 tabIndex={-1} className="text-balance font-display text-[32px] font-normal leading-[1.1] tracking-[-0.02em] outline-none md:text-[38px]">
        {title}
      </h1>
      {children && <p className="text-[15.5px] leading-[1.55] text-ink-2">{children}</p>}
    </header>
  );
}
