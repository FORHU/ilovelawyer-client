// What the client can spend on a lawyer (the API's Client Budget): a range, their own amount, or
// "Not sure", plus the kind of fee they'd rather be quoted. Sent and stored as a low and a high in
// pence, like a quote. Matching lawyers see it in the brief before they take the request.

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

export const FEE_PREFERENCES: { value: FeePreference | ""; label: string }[] = [
  { value: "FIXED_FEE", label: "Fixed fee" },
  { value: "FIRST_CONSULTATION", label: "First consultation" },
  { value: "", label: "Either" },
];

/** "" is "Not sure"; "OWN" is the client's own amount, typed into `own`; "SAVED" keeps a saved
 * budget none of the others can express (a range that isn't a preset, a cap, a floor), in `saved`. */
export type BudgetChoice = "" | (typeof BUDGET_RANGES)[number]["value"] | "OWN" | "SAVED";

/** The budget as the wizard and the edit form hold it while the client answers. */
export interface BudgetDraft {
  choice: BudgetChoice;
  /** The client's own amount in pounds, as typed. */
  own: string;
  fee: FeePreference | "";
  /** With "SAVED": the saved low and high, sent back as they were. */
  saved?: { minMinor: number | null; maxMinor: number | null };
}

export const EMPTY_BUDGET_DRAFT: BudgetDraft = { choice: "", own: "", fee: "" };

/** The API's limit on a budget amount: £1,000,000. */
const MAX_MINOR = 100_000_000;

/** "£1,200", "1200" or "99.50" as pence; null when it isn't an amount above zero and within the limit. */
export function parsePounds(text: string): number | null {
  const cleaned = text.trim().replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const pence = Math.round(Number(cleaned) * 100);
  return pence > 0 && pence <= MAX_MINOR ? pence : null;
}

/** Why the own amount can't be sent, or null when it can (or the client didn't choose one). */
export function ownAmountError(draft: BudgetDraft): string | null {
  return draft.choice === "OWN" && parsePounds(draft.own) === null ? "Enter an amount in pounds, for example 1,200." : null;
}

/** What to send. Call ownAmountError first: an own amount that isn't one is sent as Not sure. */
export function budgetFromDraft(draft: BudgetDraft): ClientBudget | null {
  const feePreference = draft.fee || null;
  const range = BUDGET_RANGES.find((r) => r.value === draft.choice);
  const own = draft.choice === "OWN" ? parsePounds(draft.own) : null;
  const [minMinor, maxMinor] = range
    ? [range.minMinor, range.maxMinor]
    : draft.choice === "SAVED" && draft.saved
      ? [draft.saved.minMinor, draft.saved.maxMinor]
      : [own, own];
  return minMinor === null && maxMinor === null && feePreference === null ? null : { minMinor, maxMinor, feePreference };
}

/** 275000 → "2,750"; pence only when there are any (9950 → "99.50"). */
function pounds(minor: number): string {
  return (minor / 100).toLocaleString("en-GB", { minimumFractionDigits: minor % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

/** The preset range a saved budget is exactly, if any. */
function presetOf(budget: ClientBudget) {
  return BUDGET_RANGES.find((r) => r.minMinor === budget.minMinor && r.maxMinor === budget.maxMinor);
}

/** The draft that shows a saved budget, for the edit form. A budget the choices can't express
 * (a range that isn't a preset, a cap, a floor) is kept as "SAVED", so saving an unrelated edit
 * sends it back unchanged rather than rewriting or refusing it. */
export function draftFromBudget(budget: ClientBudget | null): BudgetDraft {
  if (!budget) return EMPTY_BUDGET_DRAFT;
  const fee = budget.feePreference ?? "";
  const range = presetOf(budget);
  if (range) return { choice: range.value, own: "", fee };
  const { minMinor, maxMinor } = budget;
  if (minMinor === null && maxMinor === null) return { choice: "", own: "", fee };
  if (minMinor !== null && minMinor === maxMinor && minMinor > 0) return { choice: "OWN", own: pounds(minMinor).replace(/,/g, ""), fee };
  return { choice: "SAVED", own: "", fee, saved: { minMinor, maxMinor } };
}

/** "£500–£1,500" for a preset, "£2,750" for one amount, "£1,000–£2,000", "Up to £3,000",
 * "£500 or more", or "Not sure". */
export function formatBudgetAmount(budget: Pick<ClientBudget, "minMinor" | "maxMinor"> | null): string {
  if (!budget || (budget.minMinor === null && budget.maxMinor === null)) return "Not sure";
  const range = presetOf({ ...budget, feePreference: null });
  if (range) return range.label;
  const { minMinor, maxMinor } = budget;
  if (minMinor === null) return `Up to £${pounds(maxMinor!)}`;
  if (maxMinor === null) return `£${pounds(minMinor)} or more`;
  return minMinor === maxMinor ? `£${pounds(minMinor)}` : `£${pounds(minMinor)}–£${pounds(maxMinor)}`;
}

const FEE_WORDS: Record<FeePreference, string> = { FIXED_FEE: "a fixed fee", FIRST_CONSULTATION: "a first consultation" };

/** "£500–£1,500 · prefers a fixed fee", "£2,750", "Not sure". */
export function formatBudget(budget: ClientBudget | null): string {
  const amount = formatBudgetAmount(budget);
  return budget?.feePreference ? `${amount} · prefers ${FEE_WORDS[budget.feePreference]}` : amount;
}
