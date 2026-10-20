import { useQuery } from "@tanstack/react-query";
import { getPricing, type Money } from "./billing/api";

// Prices come from the API (GET /api/client/pricing); see usePricingQuery. The one exception is
// the Terms text, which is shown before sign-in and versioned, so it states the price itself.
// Keep TERMS_CASE_PRICE / TERMS_CASE_CREDITS in step with the API's CLIENT_CASE_PRICE_MINOR /
// CLIENT_CASE_CREDITS, and bump the Terms version when they change.
export const TERMS_CASE_PRICE = 9.99;
export const TERMS_CASE_CREDITS = 50;

/** Shown in the promo box while promos are placeholders. */
export const PROMO_HINT = "WELCOME5";

/** "$9.99", or "$10" for a whole amount. Accepts a plain number for the Terms text. */
export function money(value: Money | number) {
  const { amountMinor, currency } = typeof value === "number" ? { amountMinor: Math.round(value * 100), currency: "USD" } : value;
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function usePricingQuery() {
  return useQuery({ queryKey: ["pricing"], queryFn: getPricing, staleTime: 1000 * 60 * 30 });
}
