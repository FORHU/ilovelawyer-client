import { describe, it, expect } from "vitest";
import { budgetFromDraft, draftFromBudget, formatBudget, ownAmountError, parsePounds, quoteAgainstBudget, EMPTY_BUDGET_DRAFT } from "../budget";
import { newCaseFromDraft } from "../new-case";

describe("parsePounds", () => {
  it("reads whole pounds, pence, commas and a pound sign as pence", () => {
    expect(parsePounds("1200")).toBe(120_000);
    expect(parsePounds(" £1,200 ")).toBe(120_000);
    expect(parsePounds("99.5")).toBe(9_950);
    expect(parsePounds("0.01")).toBe(1);
  });

  it("refuses anything that isn't an amount, zero, more than two decimals, or over £1,000,000", () => {
    for (const text of ["", "abc", "12a", "-5", "0", "1.234", "1000001"]) expect(parsePounds(text), text).toBe(null);
    expect(parsePounds("1000000")).toBe(100_000_000);
  });
});

describe("budgetFromDraft", () => {
  it("is null for Not sure with no fee preference", () => {
    expect(budgetFromDraft(EMPTY_BUDGET_DRAFT)).toBe(null);
  });

  it("maps each range to its low and high, with Over £5,000 open at the top", () => {
    expect(budgetFromDraft({ choice: "UNDER_500", own: "", fee: "" })).toEqual({ minMinor: 0, maxMinor: 50_000, feePreference: null });
    expect(budgetFromDraft({ choice: "500_1500", own: "", fee: "FIXED_FEE" })).toEqual({ minMinor: 50_000, maxMinor: 150_000, feePreference: "FIXED_FEE" });
    expect(budgetFromDraft({ choice: "OVER_5000", own: "", fee: "" })).toEqual({ minMinor: 500_000, maxMinor: null, feePreference: null });
  });

  it("sets both ends to the client's own amount", () => {
    expect(budgetFromDraft({ choice: "OWN", own: "2,750", fee: "FIRST_CONSULTATION" })).toEqual({ minMinor: 275_000, maxMinor: 275_000, feePreference: "FIRST_CONSULTATION" });
  });

  it("keeps a fee preference even when the amount is Not sure", () => {
    expect(budgetFromDraft({ choice: "", own: "", fee: "FIXED_FEE" })).toEqual({ minMinor: null, maxMinor: null, feePreference: "FIXED_FEE" });
  });
});

describe("ownAmountError", () => {
  it("only complains when the client chose their own amount and it isn't one", () => {
    expect(ownAmountError({ choice: "OWN", own: "lots", fee: "" })).toMatch(/amount/i);
    expect(ownAmountError({ choice: "OWN", own: "", fee: "" })).toMatch(/amount/i);
    expect(ownAmountError({ choice: "OWN", own: "800", fee: "" })).toBe(null);
    expect(ownAmountError({ choice: "UNDER_500", own: "lots", fee: "" })).toBe(null);
  });
});

describe("draftFromBudget", () => {
  it("round-trips every range, an own amount and Not sure", () => {
    for (const draft of [
      { choice: "UNDER_500", own: "", fee: "" },
      { choice: "1500_5000", own: "", fee: "FIXED_FEE" },
      { choice: "OVER_5000", own: "", fee: "" },
      { choice: "OWN", own: "2750", fee: "FIRST_CONSULTATION" },
      { choice: "", own: "", fee: "FIXED_FEE" },
    ] as const) {
      expect(draftFromBudget(budgetFromDraft(draft))).toEqual(draft);
    }
    expect(draftFromBudget(null)).toEqual(EMPTY_BUDGET_DRAFT);
  });

  it("shows an own amount with pence as typed", () => {
    expect(draftFromBudget({ minMinor: 9_950, maxMinor: 9_950, feePreference: null }).own).toBe("99.50");
  });
});

describe("formatBudget", () => {
  it("names the range or amount, then the fee preference", () => {
    expect(formatBudget(null)).toBe("Not sure");
    expect(formatBudget({ minMinor: 50_000, maxMinor: 150_000, feePreference: null })).toBe("£500–£1,500");
    expect(formatBudget({ minMinor: 500_000, maxMinor: null, feePreference: "FIXED_FEE" })).toBe("Over £5,000 · prefers a fixed fee");
    expect(formatBudget({ minMinor: 275_000, maxMinor: 275_000, feePreference: "FIRST_CONSULTATION" })).toBe("£2,750 · prefers a first consultation");
    expect(formatBudget({ minMinor: null, maxMinor: null, feePreference: "FIXED_FEE" })).toBe("Not sure · prefers a fixed fee");
  });
});

describe("newCaseFromDraft", () => {
  const draft = { title: "Fired", region: "England and Wales" as const, where: "", areas: ["EMPLOYMENT"], side: "" as const, others: [], happened: "", wants: "" };

  it("sends the budget, and null for Not sure", () => {
    expect(newCaseFromDraft({ ...draft, budget: { choice: "500_1500", own: "", fee: "" } }).budget).toEqual({ minMinor: 50_000, maxMinor: 150_000, feePreference: null });
    expect(newCaseFromDraft({ ...draft, budget: EMPTY_BUDGET_DRAFT }).budget).toBe(null);
  });
});

describe("quoteAgainstBudget (phase 5c)", () => {
  const range = { minMinor: 50_000, maxMinor: 150_000, feePreference: null };
  const fixed = (amountMinor: number) => ({ type: "FIXED_FEE" as const, amountMinor });

  it("says nothing when the client set no amount", () => {
    expect(quoteAgainstBudget(null, fixed(90_000))).toBe(null);
    expect(quoteAgainstBudget({ minMinor: null, maxMinor: null, feePreference: "FIXED_FEE" }, fixed(90_000))).toMatchObject({ fit: null });
  });

  it("is within up to the top of the range, under it included, and above past it", () => {
    expect(quoteAgainstBudget(range, fixed(150_000))).toMatchObject({ fit: "WITHIN" });
    expect(quoteAgainstBudget(range, fixed(20_000))).toMatchObject({ fit: "WITHIN" });
    expect(quoteAgainstBudget(range, fixed(150_001))).toMatchObject({ fit: "ABOVE" });
  });

  it("is never above an open-ended range, and compares to the client's own amount", () => {
    expect(quoteAgainstBudget({ minMinor: 500_000, maxMinor: null, feePreference: null }, fixed(9_000_000))).toMatchObject({ fit: "WITHIN" });
    expect(quoteAgainstBudget({ minMinor: 275_000, maxMinor: 275_000, feePreference: null }, fixed(300_000))).toMatchObject({ fit: "ABOVE" });
  });

  it("notes a quote that isn't the kind of fee the client preferred", () => {
    const prefersConsultation = { ...range, feePreference: "FIRST_CONSULTATION" as const };
    expect(quoteAgainstBudget(prefersConsultation, fixed(90_000))).toMatchObject({ fit: "WITHIN", otherFeeType: true });
    expect(quoteAgainstBudget(prefersConsultation, { type: "FIRST_CONSULTATION", amountMinor: 9_000 })).toMatchObject({ otherFeeType: false });
    expect(quoteAgainstBudget(range, fixed(90_000))).toMatchObject({ otherFeeType: false });
  });
});
