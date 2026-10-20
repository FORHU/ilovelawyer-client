export type TenantCode = "PH" | "UK";

/**
 * Explicit hostname → Tenant code map for the client app's hosts. No substring matching — an
 * unrecognized host (including plain `localhost`) resolves to `null`. Keep in sync with the
 * API's copy in ilovelawyer-api/src/utils/tenant-host.ts, which decides the Tenant a new account
 * is created under; this copy only picks what the UI shows (the Terms' governing law, the lawyer
 * site to point a lawyer account at).
 *
 * Local dev: add `127.0.0.1 ph-client.ilovelawyer uk-client.ilovelawyer` to the hosts file and
 * open http://ph-client.ilovelawyer:3004.
 */
const HOST_TENANT_CODE_MAP: Record<string, TenantCode> = {
  "ph-client.ilovelawyer": "PH",
  "uk-client.ilovelawyer": "UK",
};

/** Strips a trailing `:port` before the exact-match lookup. */
export function resolveTenantCodeFromHost(hostname: string | null | undefined): TenantCode | null {
  if (!hostname) return null;
  const host = hostname.split(":")[0].trim().toLowerCase();
  return HOST_TENANT_CODE_MAP[host] ?? null;
}

/** The Tenant of the host this page is served from; null on the server and on unmapped hosts. */
export function currentTenantCode(): TenantCode | null {
  if (typeof window === "undefined") return null;
  return resolveTenantCodeFromHost(window.location.hostname);
}

const LAWYER_APP_URL: Record<TenantCode, string> = {
  PH: process.env.NEXT_PUBLIC_LAWYER_APP_URL_PH ?? "http://ph.ilovelawyer.local:3002",
  UK: process.env.NEXT_PUBLIC_LAWYER_APP_URL_UK ?? "http://uk.ilovelawyer.local:3002",
};

/** The lawyer app (ilovelawyer-app) for a Tenant, for an account that belongs there. */
export function lawyerAppUrl(tenant: TenantCode | null): string {
  return LAWYER_APP_URL[tenant ?? "PH"];
}
