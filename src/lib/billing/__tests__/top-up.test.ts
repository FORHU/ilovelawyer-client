import { describe, expect, it } from "vitest";
import type { Pricing, TopUpQuote } from "@/lib/billing/api";
import { topUpButtonLabel, topUpSummary } from "@/lib/billing/top-up";

const usd = (amountMinor: number) => ({ amountMinor, currency: "USD" });

const pricing: Pricing = {
  case: { credits: 50 },
  topUpPacks: [
    { id: "p25", name: "Small", credits: 25, price: usd(499) },
    { id: "p100", name: "Standard", credits: 100, price: usd(1499) },
  ],
  defaultPackId: "p100",
};

const welcome = (packId: string, applied = true): TopUpQuote => ({
  packId,
  price: usd(1499),
  discount: usd(applied ? 500 : 0),
  total: usd(applied ? 999 : 1499),
  credits: 100,
  promo: { code: "WELCOME5", applied, message: applied ? "WELCOME5 applied" : "That code isn't valid." },
});

describe("topUpSummary", () => {
  it("uses the default pack until one is chosen", () => {
    const s = topUpSummary(pricing, null, null);
    expect(s.pack?.id).toBe("p100");
    expect(s.total).toEqual(usd(1499));
    expect(s.discount).toBeNull();
  });

  it("takes the discount off when the code applied to the chosen pack", () => {
    const s = topUpSummary(pricing, "p100", welcome("p100"));
    expect(s.discount).toEqual(usd(500));
    expect(s.total).toEqual(usd(999));
  });

  it("drops a quote for another pack, so a code is never charged against the wrong one", () => {
    const s = topUpSummary(pricing, "p25", welcome("p100"));
    expect(s.quote).toBeNull();
    expect(s.total).toEqual(usd(499));
  });

  it("keeps a code that didn't apply, to show why, without a discount", () => {
    const s = topUpSummary(pricing, "p100", welcome("p100", false));
    expect(s.quote?.promo?.applied).toBe(false);
    expect(s.discount).toBeNull();
  });

  it("has no pack before the prices load", () => {
    expect(topUpSummary(undefined, null, null).pack).toBeUndefined();
  });
});

describe("topUpButtonLabel", () => {
  it("asks to pay the total, or just adds credits a promo made free", () => {
    expect(topUpButtonLabel({ processing: false, confirming: false, total: usd(999) })).toBe("Pay $9.99");
    expect(topUpButtonLabel({ processing: false, confirming: false, total: usd(0) })).toBe("Add credits");
  });

  it("checks a payment already sent instead of paying again", () => {
    expect(topUpButtonLabel({ processing: false, confirming: true, total: usd(999) })).toBe("Check payment");
    expect(topUpButtonLabel({ processing: true, confirming: true, total: usd(999) })).toBe("Confirming your payment…");
    expect(topUpButtonLabel({ processing: true, confirming: false, total: usd(999) })).toBe("Processing…");
  });
});
