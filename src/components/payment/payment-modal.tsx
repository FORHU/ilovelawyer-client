"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Field, TextInput } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RadioCard } from "@/components/ui/radio-card";
import {
  CASE_CREDITS,
  CASE_PRICE,
  PACKS,
  PROMO_DISCOUNT,
  money,
} from "@/lib/pricing";
import { usePayment } from "@/lib/payment-store";
import { useApp } from "@/lib/store";
import { useWizard } from "@/lib/wizard-store";

const METHODS = [
  { id: "card", title: "Credit or debit card", desc: "Visa, Mastercard, JCB" },
  { id: "bank", title: "Bank transfer", desc: "Pay from your banking app" },
] as const;

/** Mock processor. Placeholder for the real payment service (UI phase only). */
function charge(cardNumber: string, method: "card" | "bank") {
  return new Promise<{ ok: boolean; message?: string }>((resolve) =>
    setTimeout(() => {
      const declined = method === "card" && cardNumber.replace(/\s/g, "").endsWith("0002");
      resolve(
        declined
          ? { ok: false, message: "Your payment was declined by the bank. Try another method." }
          : { ok: true },
      );
    }, 1100),
  );
}

export function PaymentModal() {
  const router = useRouter();
  const pay = usePayment();
  const isCase = pay.kind === "case";
  const pack = PACKS[pay.pack];

  const price = isCase ? CASE_PRICE : pack.price;
  const discount = isCase && pay.promoApplied ? PROMO_DISCOUNT : 0;
  const total = Math.max(0, price - discount);

  const title = isCase ? "Confirm payment" : "Top up chat credits";
  const draftTitle = useWizard((w) => w.title);
  const subtitle = isCase
    ? `You are creating "${draftTitle.trim() || "Untitled"}". Chat credits are included.`
    : `Adds ${pack.credits} chat credits to this case.`;

  const submit = async () => {
    if (pay.processing) return;
    pay.setProcessing(true);
    pay.setError("");
    const res = await charge(pay.card.number, pay.method);
    if (!res.ok) {
      pay.setProcessing(false);
      pay.setError(res.message ?? "Payment failed.");
      return;
    }
    const app = useApp.getState();
    if (isCase) {
      const w = useWizard.getState();
      const id = app.addCase({
        title: w.title.trim(),
        area: w.area,
        where: w.where.trim(),
        side: w.side,
        others: w.others.filter((o) => o.name.trim()),
        files: w.files,
      });
      w.reset();
      app.setBanner(`Payment received. Your case is created with ${CASE_CREDITS} chat credits.`);
      pay.setProcessing(false);
      usePayment.setState({ open: false });
      router.push(`/cases/${id}`);
    } else {
      if (pay.caseId != null) app.addCredits(pay.caseId, pack.credits);
      app.setBanner(`${pack.credits} chat credits added to this case.`);
      pay.setProcessing(false);
      usePayment.setState({ open: false });
    }
  };

  return (
    <Modal
      open={pay.open}
      onClose={pay.close}
      locked={pay.processing}
      title={title}
      subtitle={subtitle}
    >
      {!isCase && (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Credit pack">
          {Object.values(PACKS).map((p) => (
            <RadioCard
              key={p.id}
              compact
              selected={pay.pack === p.id}
              onSelect={() => pay.setPack(p.id)}
              title={`${p.credits} chat credits`}
              description={`$${(p.price / p.credits).toFixed(2)} per credit · added to this case`}
              trailing={`$${p.price}`}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-input border border-line bg-subtle px-4 py-[14px]">
        <div className="flex justify-between text-sm">
          <span>{isCase ? "New case" : `${pack.name} top-up`}</span>
          <span>{money(price)}</span>
        </div>
        <div className="text-xs text-ink-2">
          {isCase ? `Includes ${CASE_CREDITS} chat credits` : `${pack.credits} chat credits, one-time`}
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>WELCOME5, first case</span>
            <span>-{money(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-semibold">
          <span>Due today</span>
          <span>{money(total)}</span>
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
        </div>
      )}
      {pay.method === "bank" && (
        <div className="rounded-input border border-line bg-subtle p-[14px] text-[13px] leading-[1.6] text-ink-2">
          We&apos;ll show a reference number. Approve the transfer in your banking app and your
          case is created automatically.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="promo" className="text-xs font-semibold text-ink-2">
          Promo code
        </label>
        <div className="flex gap-2">
          <TextInput
            id="promo"
            placeholder="Try WELCOME5"
            value={pay.promoInput}
            onChange={(e) => pay.setPromoInput(e.target.value)}
          />
          <Button variant="outline" size="lg" className="shrink-0 !px-[18px]" onClick={pay.applyPromo}>
            Apply
          </Button>
        </div>
        {pay.promoMessage && (
          <div
            className={`text-xs ${pay.promoApplied && isCase ? "text-success" : "text-error"}`}
          >
            {pay.promoMessage}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Button
          size="xl"
          className="w-full disabled:!opacity-60"
          disabled={pay.processing}
          onClick={submit}
        >
          {pay.processing ? "Processing…" : `Pay ${money(total)}`}
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
