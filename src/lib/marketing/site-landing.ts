import type { TenantCode } from "@/lib/tenant/client-tenant";
import type { Lang } from "@/lib/i18n/translate";
import { OPERATOR_NOTE } from "./copy";

/**
 * The landing page of a site whose lawyers and AI chat aren't open yet (PH; see lib/tenant/sites.ts).
 * The UK and Korean sites have the full landing (components/landing/story.tsx and the rest, with
 * lib/marketing/content), which promises a verified lawyer, so this one says only what works there
 * today. DRAFT: needs the same legal review as the UK copy (lib/marketing/copy.ts). One copy per
 * language the site offers (lib/i18n/language.ts).
 */
export interface SiteLandingCopy {
  lang: string;
  eyebrow: string;
  headline: [string, string];
  sub: string;
  start: string;
  signIn: string;
  features: { title: string; body: string; soon?: boolean }[];
  soon: string;
  disclaimer: string;
  /** Who runs the site (FORHU Inc.), in the footer. */
  legalNote: string;
  legal: { label: string; terms: string; privacy: string; refunds: string };
  seo: { title: string; description: string };
}

const COPY: Partial<Record<TenantCode, Partial<Record<Lang, SiteLandingCopy>>>> = {
  PH: { en: {
    lang: "en-PH",
    eyebrow: "ilovelawyer Philippines",
    headline: ["Legal trouble,", "made clear."],
    sub: "Write down what's happening and keep your documents together, in one place. Lawyers in the Philippines are coming soon.",
    start: "Start your case",
    signIn: "Sign in",
    features: [
      { title: "Your case, in order", body: "Keep the people involved, the dates and your own notes together, one case for each problem." },
      { title: "Your documents, kept safe", body: "Add contracts, letters and photos to your case, and find them again when you need them." },
      { title: "AI help and lawyers", body: "An AI that knows Philippine law, and verified lawyers in the Philippines to help with your case.", soon: true },
    ],
    soon: "Coming soon",
    disclaimer: "ilovelawyer is not a law firm and does not give legal advice.",
    legalNote: OPERATOR_NOTE,
    legal: { label: "Legal", terms: "Terms", privacy: "Privacy", refunds: "Refunds" },
    seo: {
      title: "ilovelawyer Philippines: legal trouble, made clear",
      description: "Keep your legal problem and its documents in one place. Lawyers in the Philippines are coming soon.",
    },
  } },
};

/** The landing copy for `site` in `lang`, or undefined for a site with the full landing (UK, KR). */
export function siteLandingCopy(site: TenantCode, lang: Lang): SiteLandingCopy | undefined {
  const byLang = COPY[site];
  return byLang?.[lang] ?? (byLang ? Object.values(byLang)[0] : undefined);
}
