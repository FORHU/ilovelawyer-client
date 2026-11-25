"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { SensitiveInfoPoints } from "@/components/consent/sensitive-info-modal";
import { useSite } from "@/components/site/site-provider";
import { useT } from "@/components/site/language-provider";
import { useRestoreSessionQuery } from "@/lib/auth/mutations";
import { useSession } from "@/lib/auth/session";
import { useSensitiveInfoStatus, useSetSensitiveInfoMutation } from "@/lib/consent/sensitive-info";
import { useConsents } from "@/lib/consent/consents";
import { useOnline } from "@/lib/use-online";
import { msg } from "@/lib/i18n/msg";
import type { TenantCode } from "@/lib/tenant/client-tenant";
import { cn } from "@/lib/cn";
import { FIRST_CASE_PATH, ONBOARDING_STORY_PATH } from "@/lib/auth/after-sign-in";
import { OnboardingFrame, OnboardingHeading } from "./onboarding-frame";

/** A short reading of what's agreed to. Display only: the answer is recorded against the full text
 * (SENSITIVE_INFO_POINTS, version 2026-11), which is one tap away under "Read the full text". */
const IN_SHORT = [
  msg("Our AI reads what you tell us and upload, to ask questions and prepare your case."),
  msg("It may include sensitive information, like your health or a criminal record."),
  msg("A lawyer sees your full case only once you engage them."),
  msg("You can change your mind at any time in Settings, or ask us to delete your data, apart from records we must keep."),
] as const;

/** The law each site's clients are protected under. */
const PROTECTED_UNDER: Record<TenantCode, string> = {
  UK: msg("Protected under UK data protection law (UK GDPR)."),
  KR: msg("Protected under Korea’s Personal Information Protection Act (PIPA)."),
  PH: msg("Protected under the Philippine Data Privacy Act of 2012 (RA 10173)."),
};

/**
 * The new-client flow's step 2 of 2 (/start/privacy): agreeing, before anything is told, that the
 * AI may read sensitive information. Saved as the same SENSITIVE_INFO answer the in-app step
 * records, from source "first_login". "Not now" goes to the form, which the AI doesn't need to
 * read; nothing is saved, so the app asks again before the AI first reads anything. A client who
 * already agreed goes straight on.
 */
export function PrivacyStep() {
  const t = useT();
  const router = useRouter();
  const site = useSite();
  useRestoreSessionQuery();
  const status = useSession((s) => s.status);
  const answer = useSensitiveInfoStatus();
  const consents = useConsents();
  const online = useOnline();
  const set = useSetSensitiveInfoMutation();
  const [agreed, setAgreed] = useState(false);
  const [fullText, setFullText] = useState(false);

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
  }, [status, router]);
  useEffect(() => {
    if (answer === "granted" && !set.isPending && !set.isSuccess) router.replace(ONBOARDING_STORY_PATH);
  }, [answer, set.isPending, set.isSuccess, router]);

  // The earlier answer couldn't be read (after the query's own retries): say so, rather than wait.
  if (status === "signedIn" && answer === undefined && consents.isError) {
    return (
      <OnboardingFrame step={{ n: 2, total: 2 }}>
        <OnboardingHeading eyebrow={t("Your privacy")} title={t("Before you start")} />
        <ErrorBox message={t("We couldn’t load this step. Check your connection and try again.")} />
        <Button variant="primary" size="xl" className="w-full" onClick={() => void consents.refetch()} disabled={consents.isFetching}>
          {t("Try again")}
        </Button>
      </OnboardingFrame>
    );
  }

  if (status !== "signedIn" || answer === undefined || answer === "granted") {
    return (
      <OnboardingFrame step={{ n: 2, total: 2 }}>
        <div role="status" className="flex justify-center py-16 text-ink-2">
          <Loader2 size={20} className="motion-safe:animate-spin" aria-label={t("Loading")} />
        </div>
      </OnboardingFrame>
    );
  }

  const agree = () => {
    set.mutate({ granted: true, source: "first_login" }, { onSuccess: () => router.replace(ONBOARDING_STORY_PATH) });
  };

  return (
    <OnboardingFrame step={{ n: 2, total: 2 }}>
      <OnboardingHeading eyebrow={t("Your privacy")} title={t("Before you start")}>
        {t("What you tell us about your problem may be sensitive. Here’s how we handle it.")}
      </OnboardingHeading>

      <ul className="flex flex-col gap-2.5">
        {IN_SHORT.map((line) => (
          <li key={line} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2.5 text-[15px] leading-normal">
            <span aria-hidden="true" className="mt-2.25 size-1.5 rounded-full bg-gold" />
            <span>{t(line)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setFullText((open) => !open)}
          aria-expanded={fullText}
          aria-controls="privacy-full-text"
          className="flex min-h-11 items-center gap-1.5 self-start text-[14px] font-medium text-ink-2 underline underline-offset-4 hover:text-ink"
        >
          {t("Read the full text")}
          <ChevronDown size={15} aria-hidden="true" className={cn("transition-transform", fullText && "rotate-180")} />
        </button>
        {fullText && (
          <div id="privacy-full-text" className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
            <SensitiveInfoPoints />
            <Link href="/privacy" target="_blank" className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink">
              {t("Read the Privacy Policy")}
            </Link>
          </div>
        )}
        <p className="text-[13px] text-muted">{t(PROTECTED_UNDER[site.code])}</p>
      </div>

      <label htmlFor="privacy-agree" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line-input bg-surface px-4 py-3.5">
        <input
          id="privacy-agree"
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-gold"
        />
        <span className="text-[15px] leading-[1.45]">{t("I agree to how my sensitive information is handled")}</span>
      </label>

      {set.isError && <ErrorBox message={t("Couldn’t save your answer. Try again.")} />}
      {!online && (
        <p role="status" className="flex items-center gap-2 text-[13.5px] text-warn-ink">
          <WifiOff size={16} className="shrink-0" aria-hidden="true" />
          {t("You’re offline. You can continue when you’re back online.")}
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        <Button variant="primary" size="xl" className="w-full" disabled={!agreed || set.isPending || !online} onClick={agree} aria-busy={set.isPending}>
          {set.isPending ? t("Saving…") : t("Continue")}
        </Button>
        <Button variant="quiet" size="lg" className="w-full" disabled={set.isPending} onClick={() => router.replace(`${FIRST_CASE_PATH}?mode=form`)}>
          {t("Not now, I’ll fill in a form instead")}
        </Button>
      </div>
    </OnboardingFrame>
  );
}
