// Pricing and credit rules. Pack sizes/prices are placeholders (see handoff README, open question 1).
export const CASE_PRICE = 9.99;
export const CASE_CREDITS = 50;
export const PROMO_CODE = "WELCOME5";
export const PROMO_DISCOUNT = 5;

export type PackId = "p25" | "p100" | "p250";

export interface CreditPack {
  id: PackId;
  name: string;
  credits: number;
  price: number;
}

export const PACKS: Record<PackId, CreditPack> = {
  p25: { id: "p25", name: "Small", credits: 25, price: 4.99 },
  p100: { id: "p100", name: "Standard", credits: 100, price: 14.99 },
  p250: { id: "p250", name: "Large", credits: 250, price: 29.99 },
};

export const DEFAULT_PACK: PackId = "p100";

export function money(n: number) {
  return "$" + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}
