export type TenantCode = "PH" | "UK";

/**
 * The Tenant every client account belongs to. The client app is served from one domain for every
 * region (ilovelawyer.com; app.ilovelawyer.com for staging), so the host can't say PH or UK the way
 * the lawyer app's ph./uk. subdomains do. Must match CLIENT_TENANT_CODE in
 * ilovelawyer-api/src/constants/auth.constants.ts, which is what actually puts new accounts there;
 * this copy only picks what the UI shows (the Terms' governing law).
 */
export const CLIENT_TENANT_CODE: TenantCode = "UK";

/** The lawyer app (ilovelawyer-app), for a lawyer account that tried to use the client app. `||`,
 * not `??`: an unset deploy secret reaches the build as an empty string, not undefined. */
export const LAWYER_APP_URL = process.env.NEXT_PUBLIC_LAWYER_APP_URL || "http://uk.ilovelawyer.local:3002";
