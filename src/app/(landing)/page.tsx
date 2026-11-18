import { Suspense } from "react";
import type { Metadata } from "next";
import { Closing, LandingFooter } from "@/components/landing/closing";
import { LandingContentProvider } from "@/components/landing/landing-content";
import { LandingHeader } from "@/components/landing/header";
import { ScrollRestorer } from "@/components/landing/scroll-restorer";
import { SiteLanding } from "@/components/landing/site-landing";
import { Story } from "@/components/landing/story";
import { SupportLinkRedirect } from "@/components/support/support-deep-link";
import { landingContentFor } from "@/lib/marketing/content";
import { siteLandingCopy } from "@/lib/marketing/site-landing";
import { serverSiteAndLang } from "@/lib/tenant/server-site";

/** The page a site shows: the full landing in the site's own words (lib/marketing/content: Korean on
 * KR, whatever language the visitor picked), or a short page of its own (SiteLanding) for a site
 * whose lawyers and AI aren't open yet (PH). */
async function landingFor() {
  const { site, lang } = await serverSiteAndLang();
  return { site, copy: siteLandingCopy(site, lang) };
}

// The title, description and sharing card follow the site the visitor is on (KR is Korean). Read
// inside the landing layout's Suspense, which already reads the User-Agent there.
export async function generateMetadata(): Promise<Metadata> {
  const { site, copy } = await landingFor();
  if (copy) {
    const { title, description } = copy.seo;
    const locale = copy.lang.replace("-", "_");
    return {
      title,
      description,
      openGraph: { title, description, type: "website", siteName: "ilovelawyer", locale },
      twitter: { card: "summary", title, description },
    };
  }
  const { meta } = landingContentFor(site);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, type: "website", siteName: meta.siteName, locale: meta.ogLocale },
    twitter: { card: "summary", title: meta.title, description: meta.description },
  };
}

export default async function LandingPage() {
  const { site, copy } = await landingFor();
  if (copy) return <SiteLanding copy={copy} />;
  // The wrapper says the page's language in the HTML the server sends: the root layout is shared by
  // every route and can't read the request, so its <html lang> stays "en".
  return (
    <LandingContentProvider tenant={site}>
      <div lang={landingContentFor(site).htmlLang} className="contents">
        <LandingHeader />
        <main>
          <Story />
          <Closing />
        </main>
        <LandingFooter />
        <ScrollRestorer />
        <Suspense fallback={null}>
          <SupportLinkRedirect />
        </Suspense>
      </div>
    </LandingContentProvider>
  );
}
