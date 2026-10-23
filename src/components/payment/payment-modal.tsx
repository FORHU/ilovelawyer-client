"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { TextInput } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RadioCard } from "@/components/ui/radio-card";
import { StripeCheckout } from "@/components/payment/stripe-checkout";
import { payForCase, quoteCase, topUp, waitForPayment, type TestOutcome } from "@/lib/billing/api";
import {
  clearCaseDraft,
  newCaseFromDraft,
  peekPaidCasePayment,
  rememberPaidCasePayment,
  saveCaseDraft,
  takePaidCasePayment,
} from "@/lib/billing/pending-case";
import { caseKeys, uploadAll, useCreateCaseMutation } from "@/lib/cases/queries";
import { useSession } from "@/lib/auth/session";
import { PROMO_HINT, money, usePricingQuery } from "@/lib/pricing";
import { usePayment } from "@/lib/payment-store";
import { useApp } from "@/lib/store";
import { useFailedUploads } from "@/lib/failed-uploads";
import { useWizard } from "@/lib/wizard-store";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Paying for a new case, or for chat credits on one. The API decides how: with the dummy provider the
 * payment settles at once; with Stripe it hands back a checkout, and Stripe's own form appears here
 * (StripeCheckout). Card details only ever go to Stripe. Once Stripe's form completes, the payment is
 * confirmed with the API before the case is made or the credits shown. A payment that went through
 * is never charged again: a retry reuses it.
 */
export function PaymentModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  const pay = usePayment();
  const createCase = useCreateCaseMutation();
  const { data: pricing, error: pricingError } = usePricingQuery();
  /** A case payment that went through but whose case wasn't created yet: retrying creates the case
   * with it rather than paying twice. */
  const [paidCase, setPaidCase] = useState<string | null>(null);
  const draftTitle = useWizard((w) => w.title);

  const isCase = pay.kind === "case";
  const pack = pricing?.topUpPacks.find((p) => p.id === (pay.pack ?? pricing.defaultPackId));
  const price = isCase ? pricing?.case.price : pack?.price;
  const discount = isCase && pay.quote?.promo?.applied ? pay.quote.discount : null;
  const total = isCase && pay.quote ? pay.quote.total : price;
  const prepaid = isCase && !!(paidCase ?? peekPaidCasePayment());
  const checkingOut = !!pay.openPayment && !pay.openPayment.submitted;
  const confirming = !!pay.openPayment?.submitted;

  const title = isCase ? "Confirm payment" : "Top up chat credits";
  const subtitle = checkingOut
    ? "Pay securely with Stripe. Your card details go to Stripe, never to ilovelawyer."
    : isCase
      ? `You are creating "${draftTitle.trim() || "Untitled"}". Chat credits are included.`
      : `Adds ${pack?.credits ?? "more"} chat credits to this case.`;

  const fail = (message: string) => {
    pay.setProcessing(false);
    pay.setError(message);
  };
  const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);
  const testOutcome = (): TestOutcome | undefined => (isDev && pay.simulateDecline ? "decline" : undefined);

  const applyPromo = async () => {
    const code = pay.promoInput.trim();
    if (!code) return pay.setQuote(null);
    try {
      pay.setQuote(await quoteCase(code));
    } catch (err) {
      pay.setError(messageOf(err, "Couldn't check that code."));
    }
  };

  /** Makes the case with a payment that has gone through, then uploads the wizard's files. */
  const createCaseWith = async (paymentId: string) => {
    const w = useWizard.getState();
    let created;
    try {
      created = await createCase.mutateAsync(newCaseFromDraft(paymentId, w));
    } catch (err) {
      setPaidCase(paymentId);
      rememberPaidCasePayment(paymentId);
      return fail(messageOf(err, "Your payment went through, but we couldn't create the case. Press the button to try again; you won't be charged twice."));
    }
    setPaidCase(null);
    takePaidCasePayment();
    clearCaseDraft(paymentId);
    const notUploaded = await uploadAll(created.id, w.files);
    // Kept for a retry on the case's Documents tab.
    useFailedUploads.getState().set(created.id, notUploaded);
    w.reset();
    useApp.getState().setBanner(
      notUploaded.length
        ? `Your case is created, but ${notUploaded.map((f) => f.name).join(", ")} didn't upload. You can try ${notUploaded.length === 1 ? "it" : "them"} again from Documents.`
        : `Payment received. Your case is created with ${created.credits} chat credits.`,
    );
    pay.setProcessing(false);
    usePayment.setState({ open: false, openPayment: null });
    router.push(`/cases/${created.id}`);
  };

  const finishTopUp = async (added: number) => {
    useApp.getState().setBanner(`${added} chat credits added to this case.`);
    await queryClient.invalidateQueries({ queryKey: caseKeys.all(userId) });
    pay.setProcessing(false);
    usePayment.setState({ open: false, openPayment: null });
  };

  /** After Stripe's form completes (or "Check payment"): waits for the API to confirm, then carries
   * on. A payment still unconfirmed is never treated as failed, and never paid again. */
  const settle = async (paymentId: string) => {
    pay.setProcessing(true);
    pay.setError("");
    let status;
    try {
      status = await waitForPayment(paymentId);
    } catch (err) {
      return fail(messageOf(err, "We couldn't check your payment. Press Check payment to try again."));
    }
    if (status.status === "SUCCEEDED") {
      if (status.kind === "CASE") return createCaseWith(paymentId);
      return finishTopUp(status.credits);
    }
    if (status.status === "FAILED") {
      pay.setOpenPayment(null);
      clearCaseDraft(paymentId);
      return fail(status.failureReason ?? "Your payment didn't go through. Nothing was charged.");
    }
    fail("Stripe hasn't confirmed your payment yet. You won't be charged again: press Check payment in a moment.");
  };

  const startCasePayment = async () => {
    const already = paidCase ?? takePaidCasePayment();
    if (already) return createCaseWith(already);
    let started;
    try {
      started = await payForCase({ promoCode: pay.quote?.promo?.applied ? pay.quote.promo.code : undefined, testOutcome: testOutcome() });
    } catch (err) {
      return fail(messageOf(err, "Payment failed."));
    }
    if (!started.checkout) return createCaseWith(started.paymentId);
    // Kept in case a payment method has to leave the page and come back to /payments/return.
    const w = useWizard.getState();
    saveCaseDraft(started.paymentId, {
      title: w.title,
      region: w.region,
      where: w.where,
      area: w.area,
      side: w.side,
      others: w.others,
      happened: w.happened,
      wants: w.wants,
      fileCount: w.files.length,
    });
    pay.setOpenPayment({ paymentId: started.paymentId, checkout: started.checkout, submitted: false });
    pay.setProcessing(false);
  };

  const startTopUp = async () => {
    if (!pay.caseId || !pack) return fail("Choose a pack first.");
    let started;
    try {
      started = await topUp(pay.caseId, { packId: pack.id, testOutcome: testOutcome() });
    } catch (err) {
      return fail(messageOf(err, "Payment failed."));
    }
    if (!started.checkout) return finishTopUp(started.added);
    pay.setOpenPayment({ paymentId: started.paymentId, checkout: started.checkout, submitted: false });
    pay.setProcessing(false);
  };

  const submit = async () => {
    if (pay.processing || !pricing) return;
    if (pay.openPayment?.submitted) return settle(pay.openPayment.paymentId);
    pay.setProcessing(true);
    pay.setError("");
    await (isCase ? startCasePayment() : startTopUp());
  };

  const onStripeComplete = () => {
    const open = usePayment.getState().openPayment;
    if (!open) return;
    usePayment.getState().setOpenPayment({ ...open, submitted: true });
    void settle(open.paymentId);
  };

  const buttonLabel = pay.processing
    ? confirming
      ? "Confirming your payment…"
      : "Processing…"
    : confirming
      ? "Check payment"
      : prepaid
        ? "Create case"
        : `Pay ${total ? money(total) : ""}`;

  return (
    <Modal open={pay.open} onClose={pay.close} locked={pay.processing} title={title} subtitle={subtitle}>
      {pricingError && <ErrorBox message={pricingError.message} />}

      {!isCase && !pay.openPayment && (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Credit pack">
          {pricing?.topUpPacks.map((p) => (
            <RadioCard
              key={p.id}
              compact
              selected={pack?.id === p.id}
              onSelect={() => pay.setPack(p.id)}
              title={`${p.credits} chat credits`}
              description={`${money({ ...p.price, amountMinor: Math.round(p.price.amountMinor / p.credits) })} per credit · added to this case`}
              trailing={money(p.price)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-input border border-line bg-subtle px-4 py-[14px]">
        <div className="flex justify-between text-sm">
          <span>{isCase ? "New case" : `${pack?.name ?? ""} top-up`}</span>
          <span>{price ? money(price) : "…"}</span>
        </div>
        <div className="text-xs text-ink-2">
          {isCase ? `Includes ${pricing?.case.credits ?? "…"} chat credits` : `${pack?.credits ?? "…"} chat credits, one-time`}
        </div>
        {discount && discount.amountMinor > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>{pay.quote?.promo?.code}</span>
            <span>-{money(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-semibold">
          <span>{prepaid ? "Already paid" : "Due today"}</span>
          <span>{prepaid ? "–" : total ? money(total) : "…"}</span>
        </div>
      </div>

      {prepaid && !pay.openPayment && (
        <div className="text-[13px] leading-[1.5] text-ink-2">
          Your earlier payment went through, so this won&apos;t charge you again. It creates the case with it.
        </div>
      )}

      {pay.error && <ErrorBox message={pay.error} />}

      {checkingOut && pay.openPayment && (
        <StripeCheckout
          clientSecret={pay.openPayment.checkout.clientSecret}
          publishableKey={pay.openPayment.checkout.publishableKey}
          onComplete={onStripeComplete}
        />
      )}

      {isCase && !pay.openPayment && !prepaid && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="promo" className="text-xs font-semibold text-ink-2">
            Promo code
          </label>
          <div className="flex gap-2">
            <TextInput id="promo" placeholder={`Try ${PROMO_HINT}`} value={pay.promoInput} onChange={(e) => pay.setPromoInput(e.target.value)} />
            <Button variant="outline" size="lg" className="shrink-0 !px-[18px]" onClick={applyPromo}>
              Apply
            </Button>
          </div>
          {pay.quote?.promo && (
            <div className={`text-xs ${pay.quote.promo.applied ? "text-success" : "text-error"}`}>{pay.quote.promo.message}</div>
          )}
        </div>
      )}

      {isDev && !pay.openPayment && !prepaid && (
        <label className="flex items-center gap-2 text-[12px] text-muted">
          <input type="checkbox" checked={pay.simulateDecline} onChange={(e) => pay.setSimulateDecline(e.target.checked)} />
          Dev only: simulate a declined payment (dummy provider; with Stripe, use card 4000 0000 0000 0002)
        </label>
      )}

      {!checkingOut && (
        <div className="flex flex-col gap-1.5">
          <Button size="xl" className="w-full disabled:!opacity-60" disabled={pay.processing || !pricing} onClick={submit}>
            {buttonLabel}
          </Button>
          <div className="text-center text-xs leading-[1.5] text-muted">
            {isCase
              ? "One-time payment. No subscription. You can top up credits any time from inside the case."
              : "One-time payment. Credits are used only in this case."}
          </div>
        </div>
      )}

      {checkingOut && (
        <Button variant="ghost" size="md" className="self-center" onClick={() => pay.setOpenPayment(null)}>
          Back
        </Button>
      )}
    </Modal>
  );
}
