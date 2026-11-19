import { DEFAULT_SITE, type TenantCode } from "./client-tenant";

/**
 * Client host → site. Exact matches only: no substring matching, so a lawyer host such as
 * uk.ilovelawyer.local never counts as a client site. The client counterpart of ilovelawyer-app's
 * lib/tenant-code/resolve-host.ts; the API keeps the same list (CLIENT_HOST_TENANT_MAP in
 * src/utils/tenant-host.ts), which is what puts a new account in its site.
 *
 * - `*-client.ilovelawyer`: local dev. Each is pointed at 127.0.0.1 in the hosts file
 *   (uk-client.ilovelawyer, ph-client.ilovelawyer, kr-client.ilovelawyer).
 * - `*-client-local.ilovelawyer.com`: local dev over https (`pnpm dev:https`), pointed at 127.0.0.1
 *   in the hosts file, for Google sign-in, which refuses plain-http origins other than localhost.
 * - `*-client-dev.ilovelawyer.com`: the hosted dev environment.
 * - `*-client.ilovelawyer.com`: production.
 */
const CLIENT_HOST_SITE_MAP: Record<string, TenantCode> = Object.fromEntries(
  (["UK", "PH", "KR"] as const).flatMap((site) => {
    const prefix = site.toLowerCase();
    return [
      [`${prefix}-client.ilovelawyer`, site],
      [`${prefix}-client-local.ilovelawyer.com`, site],
      [`${prefix}-client-dev.ilovelawyer.com`, site],
      [`${prefix}-client.ilovelawyer.com`, site],
    ];
  })
);

/** The site a host belongs to, or null for a host that isn't one site's own. The port is stripped. */
export function resolveClientSite(host: string | null | undefined): TenantCode | null {
  if (!host) return null;
  const name = (host.split(":")[0] ?? "").trim().toLowerCase();
  return CLIENT_HOST_SITE_MAP[name] ?? null;
}

/** The site a request on `host` shows: its own, or the UK for any other host (DEFAULT_SITE). */
export function siteForHost(host: string | null | undefined): TenantCode {
  return resolveClientSite(host) ?? DEFAULT_SITE;
}
