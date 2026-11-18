import type { Metadata } from "next";
import { Closing, LandingFooter } from "@/components/landing/closing";
import { LandingHeader } from "@/components/landing/header";
import { ScrollRestorer } from "@/components/landing/scroll-restorer";
import { SiteLanding } from "@/components/landing/site-landing";
import { Story } from "@/components/landing/story";
import { siteLandingCopy } from "@/lib/marketing/site-landing";
import { serverSiteAndLang } from "@/lib/tenant/server-site";

const TITLE = "ilovelawyer: legal trouble, made clear";
const DESCRIPTION =
  "Understand your legal problem, then get a verified UK solicitor. Free cases, pay only for the chat credits you use. AI guidance, not legal advice.";

// Each site has its own title and description; the page reads the request's host either way (the
// landing layout's Suspense covers it), so this is per request too.
export async function generateMetadata(): Promise<Metadata> {
  const { site, lang } = await serverSiteAndLang();
  const copy = siteLandingCopy(site, lang);
  const title = copy?.seo.title ?? TITLE;
  const description = copy?.seo.description ?? DESCRIPTION;
  const locale = copy ? copy.lang.replace("-", "_") : "en_GB";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "ilovelawyer", locale },
    twitter: { card: "summary", title, description },
  };
}

/** The UK site's story; a site whose lawyers and AI aren't open yet gets its own page (SiteLanding),
 * which promises nothing it doesn't have. */
export default async function LandingPage() {
  const { site, lang } = await serverSiteAndLang();
  const copy = siteLandingCopy(site, lang);
  if (copy) return <SiteLanding copy={copy} />;
  return (
    <>
      <LandingHeader />
      <main>
        <Story />
        <Closing />
      </main>
      <LandingFooter />
      <ScrollRestorer />
    </>
  );
}
