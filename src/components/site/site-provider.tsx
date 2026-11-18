"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { siteForHost } from "@/lib/tenant/resolve-host";
import { SITES, type SiteConfig } from "@/lib/tenant/sites";
import { DEFAULT_SITE, type TenantCode } from "@/lib/tenant/client-tenant";
import { setCurrentSite } from "@/lib/tenant/current-site";

const SiteContext = createContext<SiteConfig>(SITES[DEFAULT_SITE]);

// The host never changes while a page is open.
const subscribe = () => () => {};
const readClient = (): TenantCode => siteForHost(window.location.host);

/**
 * Which site this page is on, from its host (lib/tenant/resolve-host.ts). `initial` is what the
 * server read from the request's Host header (see ServerSite): pages the server renders pass it so
 * the first paint is already the right site. Without it (the signed-in app, which paints nothing
 * until the client has hydrated) the browser's own host decides.
 *
 * This is what the page shows, never who the account belongs to: the API puts an account in its
 * site at signup and refuses it on another site's host (WRONG_SITE).
 */
export function SiteProvider({ initial = DEFAULT_SITE, children }: { initial?: TenantCode; children: ReactNode }) {
  const code = useSyncExternalStore(subscribe, readClient, () => initial);
  // Code outside React (budgets, the marketplace's fee scale) reads it; only right in the browser.
  if (typeof window !== "undefined") setCurrentSite(code);
  return <SiteContext.Provider value={SITES[code]}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteConfig {
  return useContext(SiteContext);
}
