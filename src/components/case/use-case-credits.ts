"use client";

import { usePricingQuery } from "@/lib/pricing";
import { creditsStatus, creditsUsedPercent } from "@/lib/cases/credit-usage";
import type { Case } from "@/lib/types";

/** How much of a case's included credits are used, for the header's credits control (desktop and
 * mobile). Baseline is the credits a case comes with; a case that's never been topped up matches
 * it exactly. See credit-usage.ts for why a top-up reads as "0% used" rather than negative. */
export function useCaseCredits(c: Case) {
  const { data: pricing } = usePricingQuery();
  const included = pricing?.case.credits ?? null;
  return {
    percent: included ? creditsUsedPercent(c.credits, included) : null,
    status: included ? creditsStatus(c.credits, included) : ("normal" as const),
  };
}
