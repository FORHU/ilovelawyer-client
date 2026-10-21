"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Field, TextInput } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RadioCard } from "@/components/ui/radio-card";
import { payForCase, quoteCase, topUp, type TestOutcome } from "@/lib/billing/api";
import { caseKeys, uploadAll, useCreateCaseMutation } from "@/lib/cases/queries";
import { useSession } from "@/lib/auth/session";
import { PROMO_HINT, money, usePricingQuery } from "@/lib/pricing";
import { usePayment } from "@/lib/payment-store";
import { useApp } from "@/lib/store";
import { useWizard } from "@/lib/wizard-store";

const METHODS = [
  { id: "card", title: "Credit or debit card", desc: "Visa, Mastercard, JCB" },
  { id: "bank", title: "Bank transfer", desc: "Pay from your banking app" },
] as const;

/** The payment is a dummy for now (see lib/billing/api.ts). A card number ending in 0002 asks it to
 * decline, so the failure screen can be seen. The number itself is never sent. */
function testOutcomeFor(cardNumber: string, method: "card" | "bank"): TestOutcome | undefined {
  return method === "card" && cardNumber.replace(/\s/g, "").endsWith("0002") ? "decline" : undefined;
}

export function PaymentModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  const pay = usePayment();
  const createCase = useCreateCaseMutation();
  const { data: pricing, error: pricingError } = usePricingQuery();
  /** A case payment that went through but whose case wasn't created yet: retrying creates the case
   * with it rather than paying twice. */
  const paidCase = useRef<{ paymentId: string; credits: number } | null>(null);
  const draftTitle = useWizard((w) => w.title);

  const isCase = pay.kind === "case";
  const pack = pricing?.topUpPacks.find((p) => p.id === (pay.pack ?? pricing.defaultPackId));
  const price = isCase ? pricing?.case.price : pack?.price;
  const discount = isCase && pay.quote?.promo?.applied ? pay.quote.discount : null;
  const total = isCase && pay.quote ? pay.quote.total : price;

  const title = isCase ? "Confirm payment" : "Top up chat credits";
  const subtitle = isCase
    ? `You are creating "${draftTitle.trim() || "Untitled"}". Chat credits are included.`
    : `Adds ${pack?.credits ?? "more"} chat credits to this case.`;

  const fail = (err: unknown, fallback: string) => {
    pay.setProcessing(false);
    pay.setError(err instanceof Error ? err.message : fallback);
  };

  const applyPromo = async () => {
    const code = pay.promoInput.trim();
    if (!code) return pay.setQuote(null);
    try {
      pay.setQuote(await quoteCase(code));
    } catch (err) {
      pay.setError(err instanceof Error ? err.message : "Couldn't check that code.");
    }
  };

  const payForNewCase = async () => {
    const w = useWizard.getState();
    const app = useApp.getState();
    if (!paidCase.current) {
      try {
        const paid = await payForCase({
          promoCode: pay.quote?.promo?.applied ? pay.quote.promo.code : undefined,
          testOutcome: testOutcomeFor(pay.card.number, pay.method),
        });
        paidCase.current = { paymentId: paid.paymentId, credits: paid.credits };
      } catch (err) {
        return fail(err, "Payment failed.");
      }
    }
    let created;
    try {
      created = await createCase.mutateAsync({
        paymentId: paidCase.current.paymentId,
        title: w.title.trim(),
        area: w.area,
        ukJurisdiction: w.region === "OUTSIDE_UK" || !w.region ? null : w.region,
        where: w.where.trim(),
        side: w.side || null,
        others: w.others.filter((o) => o.name.trim()).map(({ name, role }) => ({ name: name.trim(), role })),
      });
    } catch (err) {
      return fail(err, "Your payment went through, but we couldn't create the case. Press Pay to try again; you won't be charged twice.");
    }
    paidCase.current = null;
    const notUploaded = await uploadAll(created.id, w.files);
    w.reset();
    app.setBanner(
      notUploaded.length
        ? `Your case is created, but ${notUploaded.join(", ")} didn't upload. Add ${notUploaded.length === 1 ? "it" : "them"} again from Documents.`
        : `Payment received. Your case is created with ${created.credits} chat credits.`,
    );
    pay.setProcessing(false);
    usePayment.setState({ open: false });
    router.push(`/cases/${created.id}`);
  };

  const topUpCase = async () => {
    if (!pay.caseId || !pack) return;
    const caseId = pay.caseId;
    try {
      const result = await topUp(caseId, { packId: pack.id, testOutcome: testOutcomeFor(pay.card.number, pay.method) });
      useApp.getState().setBanner(`${result.added} chat credits added to this case.`);
    } catch (err) {
      return fail(err, "Payment failed.");
    }
    await queryClient.invalidateQueries({ queryKey: caseKeys.all(userId) });
    pay.setProcessing(false);
    usePayment.setState({ open: false });
  };

  const submit = async () => {
    if (pay.processing || !pricing) return;
    pay.setProcessing(true);
    pay.setError("");
    await (isCase ? payForNewCase() : topUpCase());
  };

  return (
    <Modal
      open={pay.open}
      onClose={pay.close}
      locked={pay.processing}
      title={title}
      subtitle={subtitle}
    >
      {pricingError && <ErrorBox message={pricingError.message} />}

      {!isCase && (
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
          {isCase
            ? `Includes ${pricing?.case.credits ?? "…"} chat credits`
            : `${pack?.credits ?? "…"} chat credits, one-time`}
        </div>
        {discount && discount.amountMinor > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>{pay.quote?.promo?.code}</span>
            <span>-{money(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-semibold">
          <span>Due today</span>
          <span>{total ? money(total) : "…"}</span>
        </div>
      </div>

      {pay.error && <ErrorBox message={pay.error} />}

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Payment method">
        {METHODS.map((m) => (
          <RadioCard
            key={m.id}
            compact
            selected={pay.method === m.id}
            onSelect={() => pay.setMethod(m.id)}
            title={m.title}
            description={m.desc}
          />
        ))}
      </div>

      {pay.method === "card" && (
        <div className="flex flex-col gap-3">
          <Field label="Card number" htmlFor="card-number">
            <TextInput
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              value={pay.card.number}
              onChange={(e) => pay.setCard({ number: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry" htmlFor="card-exp">
              <TextInput
                id="card-exp"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={pay.card.expiry}
                onChange={(e) => pay.setCard({ expiry: e.target.value })}
              />
            </Field>
            <Field label="CVC" htmlFor="card-cvc">
              <TextInput
                id="card-cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="CVC"
                value={pay.card.cvc}
                onChange={(e) => pay.setCard({ cvc: e.target.value })}
              />
            </Field>
          </div>
          <div className="text-[11.5px] text-muted">
            Test payments only: nothing is charged and card details aren&apos;t sent anywhere.
          </div>
        </div>
      )}
      {pay.method === "bank" && (
        <div className="rounded-input border border-line bg-subtle p-[14px] text-[13px] leading-[1.6] text-ink-2">
          We&apos;ll show a reference number. Approve the transfer in your banking app and your
          case is created automatically.
        </div>
      )}

      {isCase && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="promo" className="text-xs font-semibold text-ink-2">
            Promo code
          </label>
          <div className="flex gap-2">
            <TextInput
              id="promo"
              placeholder={`Try ${PROMO_HINT}`}
              value={pay.promoInput}
              onChange={(e) => pay.setPromoInput(e.target.value)}
            />
            <Button variant="outline" size="lg" className="shrink-0 !px-[18px]" onClick={applyPromo}>
              Apply
            </Button>
          </div>
          {pay.quote?.promo && (
            <div className={`text-xs ${pay.quote.promo.applied ? "text-success" : "text-error"}`}>
              {pay.quote.promo.message}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Button
          size="xl"
          className="w-full disabled:!opacity-60"
          disabled={pay.processing || !pricing}
          onClick={submit}
        >
          {pay.processing ? "Processing…" : `Pay ${total ? money(total) : ""}`}
        </Button>
        <div className="text-center text-xs leading-[1.5] text-muted">
          {isCase
            ? "One-time payment. No subscription. You can top up credits any time from inside the case."
            : "One-time payment. Credits are used only in this case."}
        </div>
      </div>
    </Modal>
  );
}
