import { DEFAULT_SITE, type TenantCode } from "./client-tenant";

// The browser's site, for code outside React (budgets, the marketplace's fee scale). SiteProvider
// keeps it current; on the server it stays the default, so server-rendered pages read useSite.

let current: TenantCode = DEFAULT_SITE;

export function setCurrentSite(code: TenantCode) {
  current = code;
}

export function currentSite(): TenantCode {
  return current;
}

/** What a site's lawyer requests are quoted and paid in, and its budgets set in: GBP on UK, KRW on KR. */
export function requestCurrencyOf(code: TenantCode): "GBP" | "KRW" {
  return code === "KR" ? "KRW" : "GBP";
}
