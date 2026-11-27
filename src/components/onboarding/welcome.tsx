"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Camera, Mic, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { useT } from "@/components/site/language-provider";
import { useRestoreSessionQuery } from "@/lib/auth/mutations";
import { useSession } from "@/lib/auth/session";
import { msg } from "@/lib/i18n/msg";
import { OnboardingFrame, OnboardingHeading } from "./onboarding-frame";

/** Where "Get started" goes: the sign-up tab, told it's the new-client flow (step 1 of 2). */
export const ONBOARDING_SIGNUP_PATH = "/login?tab=signup&flow=start";

const STEPS = [
  { icon: Mic, title: msg("Tell us"), body: msg("Talk or type, then answer a few questions") },
  { icon: Camera, title: msg("Add proof"), body: msg("Photos, files, voice memos and emails") },
  { icon: ShieldCheck, title: msg("Get a lawyer"), body: msg("Your case arrives ready to review") },
] as const;

/** The new-client flow's first screen (/start): what happens, then an account. Someone already
 * signed in has nothing to start: they go to their cases. */
export function Welcome() {
  const t = useT();
  const router = useRouter();
  useRestoreSessionQuery();
  const status = useSession((s) => s.status);
  useEffect(() => {
    if (status === "signedIn") router.replace("/cases");
  }, [status, router]);

  return (
    <OnboardingFrame>
      <OnboardingHeading eyebrow={t("Legal help, made simple")} title={t("Tell us what happened. We’ll do the paperwork.")}>
        {t("No forms and no legal words. Talk or type, and show us any proof you have.")}
      </OnboardingHeading>

      <ol className="flex flex-col gap-4" aria-label={t("How it works")}>
        {STEPS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3.5">
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-gold-soft text-gold">
              <Icon size={19} />
            </span>
            <span className="flex flex-col">
              <span className="text-[15.5px] font-semibold leading-snug">{t(title)}</span>
              <span className="text-[14px] leading-snug text-ink-2">{t(body)}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-1 pt-2">
        <Link href={ONBOARDING_SIGNUP_PATH} className={buttonClass("primary", "xl", "w-full")}>
          {t("Get started")}
        </Link>
        <Link href="/login" className={buttonClass("quiet", "lg", "w-full !text-[14px]")}>
          {t("I already have an account")}
        </Link>
      </div>
      <p className="text-center text-[12.5px] text-ink-2">{t("AI guidance, not legal advice.")}</p>
    </OnboardingFrame>
  );
}
