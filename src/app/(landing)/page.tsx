import { Suspense } from "react";
import type { Metadata } from "next";
import { Closing, LandingFooter } from "@/components/landing/closing";
import { LandingContentProvider } from "@/components/landing/landing-content";
import { LandingHeader } from "@/components/landing/header";
import { ScrollRestorer } from "@/components/landing/scroll-restorer";
import { Story } from "@/components/landing/story";
import { SupportLinkRedirect } from "@/components/support/support-deep-link";
import { landingContentFor } from "@/lib/marketing/content";
import { getTenantCode } from "@/lib/tenant/get-tenant-code";

// The title, description and sharing card follow the site the visitor is on (kr.ilovelawyer.com is
// Korean). Read inside the landing layout's Suspense, which already reads the User-Agent there.
export async function generateMetadata(): Promise<Metadata> {
  const { meta } = landingContentFor(await getTenantCode());
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, type: "website", siteName: meta.siteName, locale: meta.ogLocale },
    twitter: { card: "summary", title: meta.title, description: meta.description },
  };
}

export default async function LandingPage() {
  const tenant = await getTenantCode();
  // The wrapper says the page's language in the HTML the server sends: the root layout is shared by
  // every route and can't read the request, so its <html lang> stays "en".
  return (
    <LandingContentProvider tenant={tenant}>
      <div lang={landingContentFor(tenant).htmlLang} className="contents">
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
