"use client";

import { BrandLogo } from "@/components/auth/brand-logo";
import { useT } from "@/components/site/language-provider";
import { cn } from "@/lib/cn";

/**
 * The dark brand panel on the left of a wide screen (lg and up): the logo, a gold rule and a line
 * of Aristotle, always dark, in light mode and dark. Beside the sign-in and sign-up form
 * (AuthFrame), and beside every step of the new-client flow after it (the privacy step, the story,
 * the questions and the evidence), so the whole flow reads as one. One width everywhere, so the
 * light side doesn't jump from one step to the next.
 */
export function BrandPanel({ className }: { className?: string }) {
  const t = useT();
  return (
    <div aria-hidden="true" className={cn("relative hidden w-[40%] shrink-0 flex-col lg:flex", className)}>
      <div className="absolute inset-0 bg-navy-950" />

      <div className="absolute left-16 top-16 z-10">
        <BrandLogo size={40} ink="#ffffff" />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-start justify-center pl-16 pr-12">
        <div className="mb-8 h-0.5 w-12 bg-gold" />
        {/* Upright: only Caslon's roman is loaded (app/layout.tsx), so italic would be a faux slant. */}
        <blockquote className="mb-5 max-w-100 font-display text-[24px] leading-9.5 text-white">
          &ldquo;{t("The law is reason, free from passion.")}&rdquo;
        </blockquote>
        <p className="text-[13px] text-[rgba(224,227,229,0.7)]">— {t("Aristotle")}</p>
      </div>
    </div>
  );
}
