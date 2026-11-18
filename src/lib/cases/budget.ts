// What the client can spend on a lawyer (the API's Client Budget): a range, their own amount, or
// "Not sure", plus the kind of fee they'd rather be quoted. Sent and stored as a low and a high in
// the site's currency's smallest unit, like a quote: pence on UK, won on KR (lib/tenant/current-site).
// Matching lawyers see it in the brief before they take the request.

import { currentSite, requestCurrencyOf } from "@/lib/tenant/current-site";
import { msg } from "@/lib/i18n/msg";
import { tr } from "@/lib/i18n/translate";

/** The kinds of quote a lawyer can send (the API's QuoteType). */
export type FeePreference = "FIXED_FEE" | "FIRST_CONSULTATION";

/** As the API sends and takes it. Null on a case: "Not sure". */
export interface ClientBudget {
  minMinor: number | null;
  /** Null: open-ended ("Over £5,000"). */
  maxMinor: number | null;
  /** Null: either. */
  feePreference: FeePreference | null;
}

export const BUDGET_RANGES = [
  { value: "UNDER_500", label: "Under £500", minMinor: 0, maxMinor: 50_000 },
  { value: "500_1500", label: "£500–£1,500", minMinor: 50_000, maxMinor: 150_000 },
  { value: "1500_5000", label: "£1,500–£5,000", minMinor: 150_000, maxMinor: 500_000 },
  { value: "OVER_5000", label: "Over £5,000", minMinor: 500_000, maxMinor: null },
] as const;

/** The KR site's ranges, in won (no minor unit), about the same spend as the UK's. */
export const BUDGET_RANGES_KRW = [
  { value: "UNDER_500", label: "Under ₩1,000,000", minMinor: 0, maxMinor: 1_000_000 },
  { value: "500_1500", label: "₩1,000,000–₩3,000,000", minMinor: 1_000_000, maxMinor: 3_000_000 },
  { value: "1500_5000", label: "₩3,000,000–₩10,000,000", minMinor: 3_000_000, maxMinor: 10_000_000 },
  { value: "OVER_5000", label: "Over ₩10,000,000", minMinor: 10_000_000, maxMinor: null },
] as const;

/** The site's currency for a budget: won on KR, pounds everywhere else. */
export function budgetCurrency(): "GBP" | "KRW" {
  return requestCurrencyOf(currentSite());
}

/** The site's ranges (BUDGET_RANGES, or BUDGET_RANGES_KRW on KR). The values are the same codes, so a
 * saved range reads back on the site it was set on. */
export function budgetRanges(): readonly { value: (typeof BUDGET_RANGES)[number]["value"]; label: string; minMinor: number; maxMinor: number | null }[] {
  if (budgetCurrency() !== "KRW") return BUDGET_RANGES;
  const under = tr("Under {amount}", { amount: "₩1,000,000" });
  const over = tr("Over {amount}", { amount: "₩10,000,000" });
  return BUDGET_RANGES_KRW.map((r) => ({ ...r, label: r.value === "UNDER_500" ? under : r.value === "OVER_5000" ? over : r.label }));
}

export const FEE_PREFERENCES: { value: FeePreference | ""; label: string }[] = [
  { value: "FIXED_FEE", label: msg("Fixed fee") },
  { value: "FIRST_CONSULTATION", label: msg("First consultation") },
  { value: "", label: msg("Either") },
];

/** "" is "Not sure"; "OWN" is the client's own amount, typed into `own`. */
export type BudgetChoice = "" | (typeof BUDGET_RANGES)[number]["value"] | "OWN";

/** The budget as the wizard and the edit form hold it while the client answers. */
export interface BudgetDraft {
  choice: BudgetChoice;
  /** The client's own amount in pounds, as typed. */
  own: string;
  fee: FeePreference | "";
}

export const EMPTY_BUDGET_DRAFT: BudgetDraft = { choice: "", own: "", fee: "" };

/** The API's limit on a budget amount: £1,000,000, or ₩100,000,000 (its number in minor units). */
const MAX_MINOR = 100_000_000;

/** What the client typed, in the site's currency's smallest unit (pence, or won), or null. */
export function parseOwnAmount(text: string): number | null {
  if (budgetCurrency() !== "KRW") return parsePounds(text);
  const cleaned = text.trim().replace(/^₩/, "").replace(/,/g, "").replace(/원$/, "").trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const won = Number(cleaned);
  return won > 0 && won <= MAX_MINOR ? won : null;
}

/** "£1,200", "1200" or "99.50" as pence; null when it isn't an amount above zero and within the limit. */
export function parsePounds(text: string): number | null {
  const cleaned = text.trim().replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const pence = Math.round(Number(cleaned) * 100);
  return pence > 0 && pence <= MAX_MINOR ? pence : null;
}

/** Why the own amount can't be sent, or null when it can (or the client didn't choose one). */
export function ownAmountError(draft: BudgetDraft): string | null {
  if (draft.choice !== "OWN" || parseOwnAmount(draft.own) !== null) return null;
  return budgetCurrency() === "KRW" ? tr("Enter an amount in won, for example 1,500,000.") : "Enter an amount in pounds, for example 1,200.";
}

/** What to send. Call ownAmountError first: an own amount that isn't one is sent as Not sure. */
export function budgetFromDraft(draft: BudgetDraft): ClientBudget | null {
  const feePreference = draft.fee || null;
  const range = budgetRanges().find((r) => r.value === draft.choice);
  const own = draft.choice === "OWN" ? parseOwnAmount(draft.own) : null;
  const [minMinor, maxMinor] = range ? [range.minMinor, range.maxMinor] : [own, own];
  return minMinor === null && maxMinor === null && feePreference === null ? null : { minMinor, maxMinor, feePreference };
}

/** 275000 → "2,750"; pence only when there are any (9950 → "99.50"). In won, the number itself. */
function pounds(minor: number): string {
  if (budgetCurrency() === "KRW") return minor.toLocaleString("ko-KR");
  return (minor / 100).toLocaleString("en-GB", { minimumFractionDigits: minor % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

/** "£2,750", "₩1,500,000". */
function amountText(minor: number): string {
  return budgetCurrency() === "KRW" ? `₩${pounds(minor)}` : `£${pounds(minor)}`;
}

/** The draft that shows a saved budget, for the edit form. */
export function draftFromBudget(budget: ClientBudget | null): BudgetDraft {
  if (!budget) return EMPTY_BUDGET_DRAFT;
  const fee = budget.feePreference ?? "";
  const range = budgetRanges().find((r) => r.minMinor === budget.minMinor && r.maxMinor === budget.maxMinor);
  if (range) return { choice: range.value, own: "", fee };
  const amount = budget.minMinor ?? budget.maxMinor;
  if (amount === null) return { choice: "", own: "", fee };
  return { choice: "OWN", own: pounds(amount).replace(/,/g, ""), fee };
}

const FEE_WORDS: Record<FeePreference, string> = { FIXED_FEE: msg("prefers a fixed fee"), FIRST_CONSULTATION: msg("prefers a first consultation") };

/** "£500–£1,500 · prefers a fixed fee", "£2,750", "Not sure"; in won on KR. */
export function formatBudget(budget: ClientBudget | null): string {
  const draft = draftFromBudget(budget);
  const range = budgetRanges().find((r) => r.value === draft.choice);
  const amount = range ? range.label : draft.choice === "OWN" && budget?.minMinor != null ? amountText(budget.minMinor) : tr("Not sure");
  return budget?.feePreference ? `${amount} · ${tr(FEE_WORDS[budget.feePreference])}` : amount;
}

/** How a lawyer's quote sits against the client's budget (phase 5c), for the quotes list: WITHIN up
 * to the top of their range (under it counts as within), ABOVE past it, and null when they set no
 * amount. `otherFeeType` when they said which kind of fee they'd rather have and this isn't it. Null
 * altogether for "Not sure". */
export function quoteAgainstBudget(
  budget: ClientBudget | null,
  quote: { type: FeePreference; amountMinor: number },
): { fit: "WITHIN" | "ABOVE" | null; otherFeeType: boolean } | null {
  if (!budget) return null;
  const top = budget.maxMinor;
  const hasAmount = budget.minMinor !== null || top !== null;
  const fit = !hasAmount ? null : top !== null && quote.amountMinor > top ? "ABOVE" : "WITHIN";
  return { fit, otherFeeType: budget.feePreference !== null && budget.feePreference !== quote.type };
}
