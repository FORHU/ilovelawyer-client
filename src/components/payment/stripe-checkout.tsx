"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { ErrorBox } from "@/components/ui/banner";

const stripes = new Map<string, Promise<Stripe | null>>();

/** Stripe allows one Embedded Checkout on a page at a time, and throws on a second. Each form waits
 * here for the one before it to be made (and, if it was already unmounted, removed): React's dev
 * double-mount otherwise starts two at once. */
let queue: Promise<void> = Promise.resolve();

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
 * Stripe's own payment form, embedded in our payment modal (Stripe "embedded Checkout"). The client
 * types their card into Stripe's iframe, so card details never reach our code or our API. Calls
 * onComplete once Stripe has taken the payment; the caller then confirms it with the API.
 */
export function StripeCheckout({ clientSecret, publishableKey, onComplete }: { clientSecret: string; publishableKey: string; onComplete: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  // The latest callback, without remounting Stripe's form when the parent re-renders.
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    let checkout: { destroy: () => void } | null = null;
    queue = queue.then(async () => {
      // Unmounted before its turn: never made at all.
      if (cancelled) return;
      try {
        const stripe = await stripeFor(publishableKey);
        if (!stripe) throw new Error("Stripe didn't load");
        const created = await stripe.createEmbeddedCheckoutPage({ clientSecret, onComplete: () => completeRef.current() });
        // Unmounted while Stripe was loading (the modal closed, or React's dev double-mount).
        if (cancelled || !container.current) {
          created.destroy();
          return;
        }
        checkout = created;
        created.mount(container.current);
        setState("ready");
      } catch (err) {
        console.error("Stripe's payment form couldn't load", err);
        if (!cancelled) setState("failed");
      }
    });
    return () => {
      cancelled = true;
      checkout?.destroy();
    };
  }, [clientSecret, publishableKey]);

  return (
    <div className="flex flex-col gap-2">
      {state === "loading" && <div className="py-6 text-center text-[13px] text-muted">Loading the secure payment form…</div>}
      {state === "failed" && <ErrorBox message="The payment form couldn't load. Check your connection and try again." />}
      <div ref={container} />
    </div>
  );
}
