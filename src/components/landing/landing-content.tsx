"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { landingContentFor, type LandingContent } from "@/lib/marketing/content";
import type { TenantCode } from "@/lib/tenant/client-tenant";

const Content = createContext<LandingContent | null>(null);

/** What the landing page says for this site. It takes only the tenant code: the text is looked up
 * here, on both server and client, so nothing but a short string crosses between them. */
export function LandingContentProvider({ tenant, children }: { tenant: TenantCode; children: ReactNode }) {
  const content = useMemo(() => landingContentFor(tenant), [tenant]);
  return <Content.Provider value={content}>{children}</Content.Provider>;
}

export function useLandingContent(): LandingContent {
  const content = useContext(Content);
  if (!content) throw new Error("useLandingContent needs a LandingContentProvider above it");
  return content;
}
