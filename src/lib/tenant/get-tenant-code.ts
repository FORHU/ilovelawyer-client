import { headers } from "next/headers";
import { DEFAULT_CLIENT_TENANT_CODE, type TenantCode } from "./client-tenant";

/** Server components only: the Tenant src/proxy.ts resolved from this request's host. Reads
 * request headers, so call it inside Suspense (the landing and auth layouts already have one). */
export async function getTenantCode(): Promise<TenantCode> {
  const value = (await headers()).get("x-tenant-code");
  return value === "PH" || value === "UK" || value === "KR" ? value : DEFAULT_CLIENT_TENANT_CODE;
}
