import { apiFetch } from "@/lib/api/fetch";

// Paying for cases and credits (ilovelawyer-api /api/client/pricing, /payments, /top-ups).
//
// The API picks the payment provider. With the dummy (local and dev until Stripe keys are set) a
// payment settles at once and `checkout` is null. With Stripe it starts PENDING and `checkout` has
// what Stripe.js needs to show Stripe's own payment form (components/payment/stripe-checkout.tsx);
// card details go to Stripe only, never to our API. Once the form completes, waitForPayment polls
// until the API has confirmed it.

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

export type PaymentStatusValue = "PENDING" | "SUCCEEDED" | "FAILED";

/** What Stripe.js needs to show the payment form. */
export interface StripeCheckout {
  provider: "STRIPE";
  clientSecret: string;
  publishableKey: string;
}

export interface CasePaymentStarted {
  paymentId: string;
  status: PaymentStatusValue;
  amount: Money;
  credits: number;
  /** Null when the payment already settled (the dummy). */
  checkout: StripeCheckout | null;
}

export interface TopUpStarted {
  paymentId: string;
  status: PaymentStatusValue;
  /** The case's balance now; unchanged while a Stripe payment is PENDING. */
  credits: number;
  added: number;
  amount: Money;
  checkout: StripeCheckout | null;
}

export interface PaymentStatus {
  paymentId: string;
  kind: "CASE" | "TOP_UP";
  status: PaymentStatusValue;
  amount: Money;
  credits: number;
  caseId: string | null;
  failureReason: string | null;
  /** A case payment that can still create its case. */
  usable: boolean;
}

/** "decline" makes the dummy provider decline, to test the failure screen. Stripe ignores it: use
 * Stripe's declining test card instead. */
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

/** Pays for a new case. Once SUCCEEDED, the paymentId is spent creating it (POST /api/client/cases). */
export function payForCase(input: { promoCode?: string; testOutcome?: TestOutcome }) {
  return post<CasePaymentStarted>("/api/client/payments/case", input);
}

export function topUp(caseId: string, input: { packId: string; testOutcome?: TestOutcome }) {
  return post<TopUpStarted>(`/api/client/cases/${caseId}/top-ups`, input);
}

/** Where a payment stands. The API checks a PENDING Stripe payment with Stripe before answering. */
export function getPaymentStatus(paymentId: string) {
  return apiFetch<PaymentStatus>(`/api/client/payments/${encodeURIComponent(paymentId)}`);
}

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 45_000;

/** Polls until the payment isn't PENDING, or the time runs out (then returns it still PENDING, so
 * the caller can offer to check again; it's never treated as failed). */
export async function waitForPayment(paymentId: string, timeoutMs = POLL_TIMEOUT_MS): Promise<PaymentStatus> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const status = await getPaymentStatus(paymentId);
    if (status.status !== "PENDING" || Date.now() >= deadline) return status;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
