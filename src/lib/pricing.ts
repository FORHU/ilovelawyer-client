import { useQuery } from "@tanstack/react-query";
import { getPricing, type Money } from "./billing/api";

// Prices come from the API (GET /api/client/pricing), where admins set them in ilovelawyer-admin;
// see usePricingQuery. The Terms don't state a price, so a price change never needs a new Terms
// version.

/** "$9.99", or "$10" for a whole amount; "¥500" for a currency without minor units. */
export function money({ amountMinor, currency }: Money) {
  const digits = new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const amount = amountMinor / 10 ** digits;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : digits,
  }).format(amount);
}

/** Matches the API's own cache, so an admin's price change shows within about two minutes at most.
 * Checkout always charges the API's current price, whatever this shows. */
export function usePricingQuery() {
  return useQuery({ queryKey: ["pricing"], queryFn: getPricing, staleTime: 1000 * 60 });
}
