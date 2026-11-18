import type { Lang } from "./translate";
import type { TenantCode } from "@/lib/tenant/client-tenant";

/** The cookie that remembers a visitor's language choice. A cookie, not localStorage, so the server
 * renders the chosen language on the first paint. Each site is its own host, so each keeps its own. */
export const LANG_COOKIE = "lang";

/** The languages each site offers, its own first (the default). Only KR has a choice. */
export const SITE_LANGS: Record<TenantCode, Lang[]> = { UK: ["en"], PH: ["en"], KR: ["ko", "en"] };

/** The language to show on `site` for a stored choice (the cookie's value): the choice when the
 * site offers it, else the site's own. */
export function langFor(site: TenantCode, stored: string | null | undefined): Lang {
  const offered = SITE_LANGS[site];
  return offered.find((l) => l === stored) ?? offered[0];
}

/** The cookie's value in a Cookie header or document.cookie. */
export function readLangCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(/;\s*/).find((part) => part.startsWith(`${LANG_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(LANG_COOKIE.length + 1)) : null;
}
