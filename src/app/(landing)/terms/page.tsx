import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";
import { getClientTerms } from "@/lib/auth/terms";
import { termsToLegalSections } from "@/lib/marketing/copy";
import { getTenantCode } from "@/lib/tenant/get-tenant-code";

export const metadata: Metadata = {
  title: "Terms | ilovelawyer",
  description: "The terms for using ilovelawyer, the same ones you agree to when you sign up.",
};

// The same source as the sign-up dialog, so the two can't drift apart.
export default async function TermsPage() {
  // Read inside the landing layout's Suspense, which already reads the User-Agent there.
  const terms = getClientTerms(await getTenantCode());
  return <LegalPage title="Terms" updated={terms.effectiveDate} sections={termsToLegalSections(terms.sections)} />;
}
