import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";
import { getClientTerms } from "@/lib/auth/terms";
import { termsToLegalSections } from "@/lib/marketing/copy";
import { CLIENT_TENANT_CODE } from "@/lib/tenant/client-tenant";

export const metadata: Metadata = {
  title: "Terms | ilovelawyer",
  description: "The terms for using ilovelawyer, the same ones you agree to when you sign up.",
};

// The same source as the sign-up dialog, so the two can't drift apart.
export default function TermsPage() {
  const terms = getClientTerms(CLIENT_TENANT_CODE);
  return <LegalPage title="Terms" updated={terms.effectiveDate} sections={termsToLegalSections(terms.sections)} />;
}
