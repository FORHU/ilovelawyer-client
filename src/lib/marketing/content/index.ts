import type { TenantCode } from "@/lib/tenant/client-tenant";
import type { Lang } from "@/lib/i18n/translate";
import { KR_CONTENT } from "./kr";
import { KR_EN_CONTENT } from "./kr-en";
import type { LandingContent } from "./types";
import { UK_CONTENT } from "./uk";

export type { LandingContent } from "./types";

/** The landing page of the client site for `tenant`, in `lang`. Only the UK and Korean sites have
 * one (PH has no client site yet), so anything else gets the UK page, as every unknown host does.
 * Only KR offers a choice of language (lib/i18n/language.ts): Korean, or English when the visitor
 * switches. */
export function landingContentFor(tenant: TenantCode, lang: Lang = "ko"): LandingContent {
  if (tenant !== "KR") return UK_CONTENT;
  return lang === "en" ? KR_EN_CONTENT : KR_CONTENT;
}
