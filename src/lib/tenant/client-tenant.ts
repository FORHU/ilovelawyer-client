export type TenantCode = "PH" | "UK" | "KR";

/**
 * The client app (ilovelawyer.com) serves one site per region, each on its own host: the apex and
 * app.ilovelawyer.com (staging) are the UK site, kr.ilovelawyer.com / kr-app.ilovelawyer.com the
 * Korean one. The host decides which Tenant a client account is created in, so this map must
 * match CLIENT_HOST_TENANT_CODE_MAP in ilovelawyer-api/src/utils/tenant-host.ts (two deployables,
 * no shared package), and DEFAULT_CLIENT_TENANT_CODE must match CLIENT_TENANT_CODE in
 * ilovelawyer-api/src/constants/auth.constants.ts. The API is what actually puts an account in a
 * Tenant; this copy only picks what the UI shows (the Terms' governing law, the site to link to).
 */
const CLIENT_HOST_TENANT_CODE_MAP: Record<string, TenantCode> = {
  "ilovelawyer.com": "UK",
  "app.ilovelawyer.com": "UK",
  "ilovelawyer.local": "UK",
  "client-local.ilovelawyer.com": "UK",
  localhost: "UK",
  "kr.ilovelawyer.com": "KR",
  "kr-app.ilovelawyer.com": "KR",
  "kr.ilovelawyer.local": "KR",
  "kr-client-local.ilovelawyer.com": "KR",
};

/** The Tenant of a host the map doesn't know. */
export const DEFAULT_CLIENT_TENANT_CODE: TenantCode = "UK";

/** The Tenant a client site host serves. Exact match on the host, port ignored; an unknown host is
 * the default region, never guessed at, so the client always has a Tenant. */
export function resolveClientTenantCode(host: string | null | undefined): TenantCode {
  if (!host) return DEFAULT_CLIENT_TENANT_CODE;
  const name = (host.split(":")[0] ?? "").trim().toLowerCase();
  return CLIENT_HOST_TENANT_CODE_MAP[name] ?? DEFAULT_CLIENT_TENANT_CODE;
}

/** Client site host per region and hosting flavour. Production and staging sit on ilovelawyer.com
 * (staging is `app.` for UK and `kr-app.` for KR), local https on the *-client-local hosts, plain
 * local on localhost (UK only) / ilovelawyer.local. */
const SITE_HOSTS: Record<"prod" | "staging" | "secureLocal" | "localhost" | "local", Partial<Record<TenantCode, string>>> = {
  prod: { UK: "ilovelawyer.com", KR: "kr.ilovelawyer.com" },
  staging: { UK: "app.ilovelawyer.com", KR: "kr-app.ilovelawyer.com" },
  secureLocal: { UK: "client-local.ilovelawyer.com", KR: "kr-client-local.ilovelawyer.com" },
  localhost: { UK: "localhost" },
  local: { UK: "ilovelawyer.local", KR: "kr.ilovelawyer.local" },
};

/** The same flavour's host for `code`'s site, port kept: from `app.ilovelawyer.com:3004` to
 * `kr-app.ilovelawyer.com:3004`. Null when `currentHost` isn't a known client site or the region
 * has no site in that flavour, so callers can skip the link rather than point somewhere wrong. */
export function hostForClientTenant(code: TenantCode, currentHost: string): string | null {
  const [name = "", port] = currentHost.trim().toLowerCase().split(":");
  for (const hosts of Object.values(SITE_HOSTS)) {
    if (Object.values(hosts).includes(name)) {
      const target = hosts[code];
      return target ? (port ? `${target}:${port}` : target) : null;
    }
  }
  return null;
}

/** Display name of a region, for "Go to the Korea site". */
export const TENANT_DISPLAY_NAME: Record<TenantCode, string> = { PH: "Philippines", UK: "UK", KR: "Korea" };

/** The lawyer app (ilovelawyer-app), for a lawyer account that tried to use the client app. */
export const LAWYER_APP_URL = process.env.NEXT_PUBLIC_LAWYER_APP_URL ?? "http://uk.ilovelawyer.local:3002";
