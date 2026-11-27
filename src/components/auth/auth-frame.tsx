"use client";

import { BrandPanel } from "@/components/auth/brand-panel";
import { useT } from "@/components/site/language-provider";
import { LanguageSegmented } from "@/components/site/language-toggle";
import { ThemeSegmented } from "@/components/site/theme-toggle";
import { NeedHelp } from "@/components/support/need-help";

/** The auth screens' layout: the fixed dark brand panel on the left (wide screens only) and the
 * form column on the right, with its heading and the © footer. Shared by /login and /reset-password. */
export function AuthFrame({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-surface">
      {/* LEFT: fixed dark brand panel */}
      <BrandPanel />

      {/* RIGHT: form */}
      <div className="relative flex flex-1 flex-col items-center justify-start overflow-y-auto bg-surface px-8 py-10 md:px-26.5">
        {/* Language and light / dark mode, in the corner, where people look for them. */}
        <div className="absolute right-4 top-4 flex items-center gap-2 md:right-8 md:top-6">
          <LanguageSegmented />
          <ThemeSegmented />
        </div>
        <div className="my-auto flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-1 pt-20">
            <h1 className="font-display text-[40px] font-normal leading-12 text-ink">{heading}</h1>
            {subheading && <p className="text-base leading-6 text-ink-2">{subheading}</p>}
          </div>

          {children}

          <div className="flex items-center justify-between border-t border-line pt-8">
            <span className="text-xs font-semibold tracking-[1.2px] text-muted">
              © {new Date().getFullYear()} ILOVELAWYER
            </span>
            <div className="flex items-center gap-4">
              <NeedHelp />
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent text-xs font-semibold uppercase tracking-[1.2px] text-muted underline decoration-line transition-colors hover:text-ink"
              >
                {t("Privacy")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
