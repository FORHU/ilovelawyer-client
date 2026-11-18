import { headers } from "next/headers";
import { siteForHost } from "./resolve-host";
import type { TenantCode } from "./client-tenant";
import { langFor, readLangCookie } from "@/lib/i18n/language";
import type { Lang } from "@/lib/i18n/translate";

/**
 * The site of the request being rendered, from its host. Behind a reverse proxy the original host
 * arrives as X-Forwarded-Host. Reads the request, so with cacheComponents a caller must sit inside
 * <Suspense>, which also keeps one site's page out of another site's cache.
 */
export async function serverSite(): Promise<TenantCode> {
  const h = await headers();
  return siteForHost(h.get("x-forwarded-host") ?? h.get("host"));
}

/** The request's site and the language to render it in (the visitor's choice, where the site
 * offers one; lib/i18n/language.ts). Same Suspense rule as serverSite. */
export async function serverSiteAndLang(): Promise<{ site: TenantCode; lang: Lang }> {
  const h = await headers();
  const site = siteForHost(h.get("x-forwarded-host") ?? h.get("host"));
  return { site, lang: langFor(site, readLangCookie(h.get("cookie"))) };
}
