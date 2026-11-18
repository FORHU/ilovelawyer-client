import type { TenantCode } from "@/lib/tenant/client-tenant";
import { KR_CONTENT } from "./kr";
import type { LandingContent } from "./types";
import { UK_CONTENT } from "./uk";

export type { LandingContent } from "./types";

/** The landing page of the client site for `tenant`. Only the UK and Korean sites have one (PH has
 * no client site yet), so anything else gets the UK page, as every unknown host does. */
export function landingContentFor(tenant: TenantCode): LandingContent {
  return tenant === "KR" ? KR_CONTENT : UK_CONTENT;
}
