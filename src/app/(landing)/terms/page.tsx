import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";
import { getClientTerms } from "@/lib/auth/terms";
import { termsToLegalSections } from "@/lib/marketing/copy";
import { serverSiteAndLang } from "@/lib/tenant/server-site";

export const metadata: Metadata = {
  title: "Terms | ilovelawyer",
  description: "The terms for using ilovelawyer, the same ones you agree to when you sign up.",
};

// The same source as the sign-up dialog, so the two can't drift apart. The site's own governing law:
// an account is opened in the site it signs up on. (The landing layout's Suspense covers this read.)
export default async function TermsPage() {
  const { site, lang } = await serverSiteAndLang();
  const terms = getClientTerms(site, lang);
  return <LegalPage title={lang === "ko" ? terms.title : "Terms"} updated={terms.effectiveDate} sections={termsToLegalSections(terms.sections)} />;
}
