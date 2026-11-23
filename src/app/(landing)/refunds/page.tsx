import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";
import { REFUNDS_SECTIONS } from "@/lib/marketing/copy";
import { REFUNDS_KR, REFUNDS_SECTIONS_KO, REFUNDS_SECTIONS_KR_EN } from "@/lib/marketing/refunds-kr";
import { serverSiteAndLang } from "@/lib/tenant/server-site";
import type { TenantCode } from "@/lib/tenant/client-tenant";
import type { Lang } from "@/lib/i18n/translate";

const UK = {
  title: "Refunds Policy",
  updated: "Last updated: [date]",
  description: "When and how ilovelawyer refunds chat credit top-ups.",
  sections: REFUNDS_SECTIONS,
};

/** The site's own policy: Korea's covers its AI credits under Korean law, in the visitor's language;
 * every other site gets the UK one. */
function refundsFor(site: TenantCode, lang: Lang) {
  if (site !== "KR") return UK;
  return lang === "en" ? { ...REFUNDS_KR.en, sections: REFUNDS_SECTIONS_KR_EN } : { ...REFUNDS_KR.ko, sections: REFUNDS_SECTIONS_KO };
}

export async function generateMetadata(): Promise<Metadata> {
  const { site, lang } = await serverSiteAndLang();
  const page = refundsFor(site, lang);
  return { title: `${page.title} | ilovelawyer`, description: page.description };
}

// Reads the request's host, like /terms (the landing layout's Suspense covers it).
export default async function RefundsPage() {
  const { site, lang } = await serverSiteAndLang();
  const page = refundsFor(site, lang);
  return <LegalPage title={page.title} updated={page.updated} sections={page.sections} />;
}
