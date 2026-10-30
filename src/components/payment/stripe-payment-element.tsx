"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";

const stripes = new Map<string, Promise<Stripe | null>>();

/** One Stripe.js per publishable key, loaded on first use (it's a script from js.stripe.com). */
function stripeFor(publishableKey: string) {
  let stripe = stripes.get(publishableKey);
  if (!stripe) {
    stripe = loadStripe(publishableKey);
    stripes.set(publishableKey, stripe);
  }
  return stripe;
}

/**
 * Stripe's Payment Element for a PaymentIntent the API made (paying a lawyer's quotation). The client
 * types their card into Stripe's iframe, so card details never reach our code or our API. Confirming
 * stays on the page for cards; a method that has to leave the page comes back to `returnUrl`. Calls
 * onPaid once Stripe has the payment (or is still processing it); the caller then asks the API, which
 * settles it.
 */
export function StripePaymentElement({
  clientSecret,
  publishableKey,
  returnUrl,
  payLabel,
  onPaid,
}: {
  clientSecret: string;
  publishableKey: string;
  returnUrl: string;
  payLabel: string;
  onPaid: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | null = null;
    void (async () => {
      try {
        const stripe = await stripeFor(publishableKey);
        if (!stripe) throw new Error("Stripe didn't load");
        if (cancelled || !container.current) return;
        const elements = stripe.elements({ clientSecret, appearance: { theme: "stripe" } });
        const payment = elements.create("payment");
        payment.mount(container.current);
        payment.on("ready", () => !cancelled && setState("ready"));
        stripeRef.current = stripe;
        elementsRef.current = elements;
        unmount = () => payment.destroy();
      } catch (err) {
        console.error("Stripe's payment form couldn't load", err);
        if (!cancelled) setState("failed");
      }
    })();
    return () => {
      cancelled = true;
      unmount?.();
    };
  }, [clientSecret, publishableKey]);

  async function confirm() {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");
    const { error: failed } = await stripe.confirmPayment({ elements, redirect: "if_required", confirmParams: { return_url: returnUrl } });
    setPaying(false);
    if (failed) {
      setError(failed.message ?? "Your payment didn't go through. Try another card.");
      return;
    }
    onPaid();
  }

  return (
    <div className="flex flex-col gap-3">
      {state === "loading" && <div className="py-6 text-center text-[13px] text-muted">Loading the secure payment form…</div>}
      {state === "failed" && <ErrorBox message="The payment form couldn't load. Check your connection and try again." />}
      <div ref={container} />
      {error && <ErrorBox message={error} />}
      {state === "ready" && (
        <Button variant="dark" className="!h-[46px] !text-sm !font-semibold" disabled={paying} onClick={() => void confirm()}>
          {paying ? "Paying…" : payLabel}
        </Button>
      )}
    </div>
  );
}
