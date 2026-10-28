"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { quoteTopUp, topUp, waitForPayment, type Money, type Pricing, type TestOutcome, type TopUpPack, type TopUpQuote } from "@/lib/billing/api";
import { caseKeys } from "@/lib/cases/queries";
import { useSession } from "@/lib/auth/session";
import { money, usePricingQuery } from "@/lib/pricing";
import { usePayment } from "@/lib/payment-store";
import { useApp } from "@/lib/store";

const isDev = process.env.NODE_ENV !== "production";

export interface TopUpSummary {
  pack: TopUpPack | undefined;
  /** The last quote, only while it's for the chosen pack: a code is checked against the pack it comes off. */
  quote: TopUpQuote | null;
  price: Money | undefined;
  /** Set only when a code applied. */
  discount: Money | null;
  total: Money | undefined;
}

/** What the chosen pack costs now, with the promo quote if it's still for that pack. */
export function topUpSummary(pricing: Pricing | undefined, packId: string | null, lastQuote: TopUpQuote | null): TopUpSummary {
  const pack = pricing?.topUpPacks.find((p) => p.id === (packId ?? pricing.defaultPackId));
  const quote = lastQuote && lastQuote.packId === pack?.id ? lastQuote : null;
  return {
    pack,
    quote,
    price: pack?.price,
    discount: quote?.promo?.applied ? quote.discount : null,
    total: quote ? quote.total : pack?.price,
  };
}

/** The pay button: confirming beats processing, and a top-up a promo made free isn't "Pay". */
export function topUpButtonLabel(s: { processing: boolean; confirming: boolean; total: Money | undefined }) {
  if (s.processing) return s.confirming ? "Confirming your payment…" : "Processing…";
  if (s.confirming) return "Check payment";
  if (s.total && s.total.amountMinor === 0) return "Add credits";
  return `Pay ${s.total ? money(s.total) : ""}`;
}

/** Shows the credits once a top-up has gone through: the banner, and the cases read again. */
export async function showTopUpDone(queryClient: QueryClient, userId: string | undefined, added: number) {
  useApp.getState().setBanner(`${added} chat credits added to this case.`);
  await queryClient.invalidateQueries({ queryKey: caseKeys.all(userId) });
}

/**
 * Buying chat credits for the case the top-up modal was opened for (usePayment.openFor): the pack,
 * the promo code checked against it, the payment, and confirming it. The API decides how a payment
 * runs: the dummy settles at once; Stripe hands back a checkout to show, and the payment is confirmed
 * with the API before the credits are shown. A payment still being confirmed is never started
 * again: submit() checks it again instead.
 */
export function useTopUp() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  const pay = usePayment();
  const { data: pricing, error: pricingError } = usePricingQuery();
  const summary = topUpSummary(pricing, pay.pack, pay.quote);
  const checkingOut = !!pay.openPayment && !pay.openPayment.submitted;
  const confirming = !!pay.openPayment?.submitted;

  const fail = (message: string) => {
    pay.setProcessing(false);
    pay.setError(message);
  };
  const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);
  const testOutcome = (): TestOutcome | undefined => (isDev && pay.simulateDecline ? "decline" : undefined);

  const applyPromo = async (packId = summary.pack?.id) => {
    const code = pay.promoInput.trim();
    if (!code || !packId) return pay.setQuote(null);
    try {
      pay.setQuote(await quoteTopUp(packId, code));
    } catch (err) {
      pay.setError(messageOf(err, "Couldn't check that code."));
    }
  };

  const choosePack = (packId: string) => {
    pay.setPack(packId);
    if (pay.promoInput.trim()) void applyPromo(packId);
  };

  const finish = async (added: number) => {
    await showTopUpDone(queryClient, userId, added);
    pay.setProcessing(false);
    usePayment.setState({ open: false, openPayment: null });
  };

  /** After Stripe's form completes (or "Check payment"): a payment still unconfirmed is never
   * treated as failed, and never paid again. */
  const settle = async (paymentId: string) => {
    pay.setProcessing(true);
    pay.setError("");
    let status;
    try {
      status = await waitForPayment(paymentId);
    } catch (err) {
      return fail(messageOf(err, "We couldn't check your payment. Press Check payment to try again."));
    }
    if (status.status === "SUCCEEDED") return finish(status.credits);
    if (status.status === "FAILED") {
      pay.setOpenPayment(null);
      return fail(status.failureReason ?? "Your payment didn't go through. Nothing was charged.");
    }
    fail("Stripe hasn't confirmed your payment yet. You won't be charged again: press Check payment in a moment.");
  };

  const start = async () => {
    const { pack, quote } = summary;
    if (!pay.caseId || !pack) return fail("Choose a pack first.");
    let started;
    try {
      started = await topUp(pay.caseId, { packId: pack.id, promoCode: quote?.promo?.applied ? quote.promo.code : undefined, testOutcome: testOutcome() });
    } catch (err) {
      return fail(messageOf(err, "Payment failed."));
    }
    if (!started.checkout) return finish(started.added);
    pay.setOpenPayment({ paymentId: started.paymentId, checkout: started.checkout, submitted: false });
    pay.setProcessing(false);
  };

  const submit = async () => {
    if (pay.processing || !pricing) return;
    if (pay.openPayment?.submitted) return settle(pay.openPayment.paymentId);
    pay.setProcessing(true);
    pay.setError("");
    await start();
  };

  const onStripeComplete = () => {
    const open = usePayment.getState().openPayment;
    if (!open) return;
    usePayment.getState().setOpenPayment({ ...open, submitted: true });
    void settle(open.paymentId);
  };

  return {
    pay,
    pricing,
    pricingError,
    ...summary,
    checkingOut,
    confirming,
    buttonLabel: topUpButtonLabel({ processing: pay.processing, confirming, total: summary.total }),
    isDev,
    applyPromo,
    choosePack,
    submit,
    onStripeComplete,
  };
}
