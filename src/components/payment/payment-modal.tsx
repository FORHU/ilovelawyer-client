"use client";

import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { TextInput } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RadioCard } from "@/components/ui/radio-card";
import { StripeCheckout } from "@/components/payment/stripe-checkout";
import { useTopUp } from "@/lib/billing/top-up";
import { money } from "@/lib/pricing";

/**
 * The top-up modal: buying chat credits for a case, with an optional promo code (cases themselves
 * are free). What it does is useTopUp's; this only shows it. Card details only ever go to Stripe.
 */
export function PaymentModal() {
  const t = useTopUp();
  const { pay, pack, quote, price, discount, total } = t;

  const subtitle = t.checkingOut
    ? "Pay securely with Stripe. Your card details go to Stripe, never to ilovelawyer."
    : `Adds ${pack?.credits ?? "more"} chat credits to this case.`;

  return (
    <Modal open={pay.open} onClose={pay.close} locked={pay.processing} title="Top up chat credits" subtitle={subtitle}>
      {t.pricingError && <ErrorBox message={t.pricingError.message} />}

      {!pay.openPayment && (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Credit pack">
          {t.pricing?.topUpPacks.map((p) => (
            <RadioCard
              key={p.id}
              compact
              selected={pack?.id === p.id}
              onSelect={() => t.choosePack(p.id)}
              title={`${p.credits} chat credits`}
              description={`${money({ ...p.price, amountMinor: Math.round(p.price.amountMinor / p.credits) })} per credit · added to this case`}
              trailing={money(p.price)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-input border border-line bg-subtle px-4 py-[14px]">
        <div className="flex justify-between text-sm">
          <span>{`${pack?.name ?? ""} top-up`}</span>
          <span>{price ? money(price) : "…"}</span>
        </div>
        <div className="text-xs text-ink-2">{`${pack?.credits ?? "…"} chat credits, one-time`}</div>
        {discount && discount.amountMinor > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>{quote?.promo?.code}</span>
            <span>-{money(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-semibold">
          <span>Due today</span>
          <span>{total ? money(total) : "…"}</span>
        </div>
      </div>

      {pay.error && <ErrorBox message={pay.error} />}

      {t.checkingOut && pay.openPayment && (
        <StripeCheckout
          clientSecret={pay.openPayment.checkout.clientSecret}
          publishableKey={pay.openPayment.checkout.publishableKey}
          onComplete={t.onStripeComplete}
        />
      )}

      {!pay.openPayment && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="promo" className="text-xs font-semibold text-ink-2">
            Promo code
          </label>
          <div className="flex gap-2">
            <TextInput id="promo" placeholder="Promo code" value={pay.promoInput} onChange={(e) => pay.setPromoInput(e.target.value)} />
            <Button variant="outline" size="lg" className="shrink-0 !px-[18px]" onClick={() => void t.applyPromo()}>
              Apply
            </Button>
          </div>
          {quote?.promo && <div className={`text-xs ${quote.promo.applied ? "text-success" : "text-error"}`}>{quote.promo.message}</div>}
        </div>
      )}

      {t.isDev && !pay.openPayment && (
        <label className="flex items-center gap-2 text-[12px] text-muted">
          <input type="checkbox" checked={pay.simulateDecline} onChange={(e) => pay.setSimulateDecline(e.target.checked)} />
          Dev only: simulate a declined payment (dummy provider; with Stripe, use card 4000 0000 0000 0002)
        </label>
      )}

      {!t.checkingOut && (
        <div className="flex flex-col gap-1.5">
          <Button size="xl" className="w-full disabled:!opacity-60" disabled={pay.processing || !t.pricing} onClick={t.submit}>
            {t.buttonLabel}
          </Button>
          <div className="text-center text-xs leading-[1.5] text-muted">One-time payment. Credits are used only in this case.</div>
        </div>
      )}

      {t.checkingOut && (
        <Button variant="ghost" size="md" className="self-center" onClick={() => pay.setOpenPayment(null)}>
          Back
        </Button>
      )}
    </Modal>
  );
}
