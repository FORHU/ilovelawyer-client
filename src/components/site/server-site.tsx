import { headers } from "next/headers";
import { readLangCookie } from "@/lib/i18n/language";
import { siteForHost } from "@/lib/tenant/resolve-host";
import { LanguageProvider } from "./language-provider";
import { SiteProvider } from "./site-provider";

/** For a page the server renders (landing, sign-in): the site from the host and the language from
 * the cookie, read from the request so the first paint is already right. It reads the request, so
 * with cacheComponents it must sit inside <Suspense>, which also keeps one site's page out of
 * another's cache. */
export async function ServerSite({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const site = siteForHost(h.get("x-forwarded-host") ?? h.get("host"));
  return (
    <SiteProvider initial={site}>
      <LanguageProvider initial={readLangCookie(h.get("cookie"))}>{children}</LanguageProvider>
    </SiteProvider>
  );
}
