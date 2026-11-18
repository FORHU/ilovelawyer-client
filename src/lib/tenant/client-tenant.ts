export type TenantCode = "PH" | "UK" | "KR";

/**
 * The client app (ilovelawyer.com) serves one site per region, each on its own host. The host
 * decides which Tenant a client account is created in, so these sites must match
 * CLIENT_HOST_TENANT_CODE_MAP in ilovelawyer-api/src/utils/tenant-host.ts (two deployables, no
 * shared package), and DEFAULT_CLIENT_TENANT_CODE must match CLIENT_TENANT_CODE in
 * ilovelawyer-api/src/constants/auth.constants.ts. The API is what actually puts an account in a
 * Tenant; this copy only picks what the UI shows (the Terms' governing law, the page's language,
 * the site to link to).
 *
 * Every host a region is served from, by how it is hosted. A region's first host in a flavour is the
 * one to link to; the rest are older names that still resolve. Local https is one dev server serving
 * all of the *-client-local hosts (scripts/dev-https.mjs): the host you open is the tenant you get.
 */
const SITES: Record<"prod" | "staging" | "secureLocal" | "localhost" | "local", Partial<Record<TenantCode, string[]>>> = {
  prod: { UK: ["ilovelawyer.com"], KR: ["kr.ilovelawyer.com"] },
  staging: { UK: ["app.ilovelawyer.com"], KR: ["kr-app.ilovelawyer.com"] },
  secureLocal: { UK: ["uk-client-local.ilovelawyer.com", "client-local.ilovelawyer.com"], KR: ["kr-client-local.ilovelawyer.com"] },
  localhost: { UK: ["localhost"] },
  local: { UK: ["ilovelawyer.local"], KR: ["kr.ilovelawyer.local"] },
};

/** Every client host, and the region it serves. */
const CLIENT_HOST_TENANT_CODE_MAP: Record<string, TenantCode> = Object.fromEntries(
  Object.values(SITES).flatMap((regions) =>
    Object.entries(regions).flatMap(([code, hosts]) => (hosts ?? []).map((host) => [host, code as TenantCode] as const)),
  ),
);

/** The Tenant of a host the map doesn't know. */
export const DEFAULT_CLIENT_TENANT_CODE: TenantCode = "UK";

/** The Tenant a client site host serves. Exact match on the host, port ignored; an unknown host is
 * the default region, never guessed at, so the client always has a Tenant. */
export function resolveClientTenantCode(host: string | null | undefined): TenantCode {
  if (!host) return DEFAULT_CLIENT_TENANT_CODE;
  const name = (host.split(":")[0] ?? "").trim().toLowerCase();
  return CLIENT_HOST_TENANT_CODE_MAP[name] ?? DEFAULT_CLIENT_TENANT_CODE;
}

/** Every host the client app is served from, for the dev scripts' certificate and hosts file. */
export const CLIENT_HOSTS = Object.keys(CLIENT_HOST_TENANT_CODE_MAP);

/** The same flavour's host for `code`'s site, port kept: from `app.ilovelawyer.com:3004` to
 * `kr-app.ilovelawyer.com:3004`. Null when `currentHost` isn't a known client site or the region
 * has no site in that flavour, so callers can skip the link rather than point somewhere wrong. */
export function hostForClientTenant(code: TenantCode, currentHost: string): string | null {
  const [name = "", port] = currentHost.trim().toLowerCase().split(":");
  for (const regions of Object.values(SITES)) {
    if (Object.values(regions).some((hosts) => hosts?.includes(name))) {
      const target = regions[code]?.[0];
      return target ? (port ? `${target}:${port}` : target) : null;
    }
  }
  return null;
}

/** Display name of a region, for "Go to the Korea site". */
export const TENANT_DISPLAY_NAME: Record<TenantCode, string> = { PH: "Philippines", UK: "UK", KR: "Korea" };

/** The lawyer app (ilovelawyer-app), for a lawyer account that tried to use the client app. */
export const LAWYER_APP_URL = process.env.NEXT_PUBLIC_LAWYER_APP_URL ?? "http://uk.ilovelawyer.local:3002";
