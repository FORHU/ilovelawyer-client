import { apiFetch } from "@/lib/api/fetch";

// Paying for cases and credits (ilovelawyer-api /api/client/pricing, /payments, /top-ups). The
// API runs a dummy payment provider for now, so nothing is really charged; the card form never
// sends card details. Stripe replaces the dummy later, on the API side.

export interface Money {
  amountMinor: number;
  currency: string;
}

export interface TopUpPack {
  id: string;
  name: string;
  credits: number;
  price: Money;
}

export interface Pricing {
  case: { price: Money; credits: number };
  topUpPacks: TopUpPack[];
  defaultPackId: string;
}

export interface CaseQuote {
  price: Money;
  discount: Money;
  total: Money;
  /** Null when no code was given. */
  promo: { code: string; applied: boolean; message: string } | null;
}

/** "decline" makes the dummy provider decline, to test the failure screen. The API ignores it
 * once a real provider is in use. */
export type TestOutcome = "decline";

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function getPricing() {
  return apiFetch<Pricing>("/api/client/pricing");
}

export function quoteCase(promoCode: string) {
  return post<CaseQuote>("/api/client/payments/case/quote", { promoCode });
}

/** Pays for a new case. The returned paymentId is then spent creating it (POST /api/client/cases). */
export function payForCase(input: { promoCode?: string; testOutcome?: TestOutcome }) {
  return post<{ paymentId: string; amount: Money; credits: number }>("/api/client/payments/case", input);
}

export function topUp(caseId: string, input: { packId: string; testOutcome?: TestOutcome }) {
  return post<{ credits: number; added: number; amount: Money }>(`/api/client/cases/${caseId}/top-ups`, input);
}
