/** Every site the client app serves. Keep in sync with ilovelawyer-api's src/types/tenant-code.ts. */
export const TENANT_CODES = ["PH", "UK", "KR"] as const;

export type TenantCode = (typeof TENANT_CODES)[number];

/** Narrows an untrusted string (a header) to a known site. */
export function isTenantCode(value: unknown): value is TenantCode {
  return TENANT_CODES.includes(value as TenantCode);
}

/**
 * The site a host that isn't a site's own shows: localhost:3004, client-local.ilovelawyer.com and
 * the domains the client app was deployed on before it had one host per site (ilovelawyer.com,
 * app.ilovelawyer.com). Every client account was opened in the UK until then, so those hosts stay
 * the UK site. The API makes the same choice (DEFAULT_CLIENT_TENANT_CODE in its auth.constants.ts).
 */
export const DEFAULT_SITE: TenantCode = "UK";

/**
 * The lawyer app (ilovelawyer-app) for each site, for a lawyer account that tried to use the client
 * app. NEXT_PUBLIC_LAWYER_APP_URL is the UK one, as it was before there were three. Each variable
 * is named in full so Next inlines it in the browser bundle.
 */
const LAWYER_APP_URLS: Record<TenantCode, string> = {
  UK: process.env.NEXT_PUBLIC_LAWYER_APP_URL_UK ?? process.env.NEXT_PUBLIC_LAWYER_APP_URL ?? "http://uk.ilovelawyer.local:3002",
  PH: process.env.NEXT_PUBLIC_LAWYER_APP_URL_PH ?? "http://ph.ilovelawyer.local:3002",
  KR: process.env.NEXT_PUBLIC_LAWYER_APP_URL_KR ?? "http://kr.ilovelawyer.local:3002",
};

export function lawyerAppUrl(site: TenantCode): string {
  return LAWYER_APP_URLS[site];
}
