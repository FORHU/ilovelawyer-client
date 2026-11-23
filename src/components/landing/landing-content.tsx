"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n/translate";
import { landingContentFor, type LandingContent } from "@/lib/marketing/content";
import type { TenantCode } from "@/lib/tenant/client-tenant";

const Content = createContext<LandingContent | null>(null);

/** What the landing page says for this site, in the visitor's language. It takes only the tenant
 * code and the language: the text is looked up here, on both server and client, so nothing but two
 * short strings crosses between them. */
export function LandingContentProvider({ tenant, lang, children }: { tenant: TenantCode; lang: Lang; children: ReactNode }) {
  const content = useMemo(() => landingContentFor(tenant, lang), [tenant, lang]);
  return <Content.Provider value={content}>{children}</Content.Provider>;
}

export function useLandingContent(): LandingContent {
  const content = useContext(Content);
  if (!content) throw new Error("useLandingContent needs a LandingContentProvider above it");
  return content;
}
