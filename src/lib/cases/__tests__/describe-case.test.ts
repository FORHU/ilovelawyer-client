import { describe, it, expect } from "vitest";
import { describeCasePayload, titleFromDescription } from "../describe-case";

describe("titleFromDescription", () => {
  it("uses the whole text when it's short", () => {
    expect(titleFromDescription("My landlord won't fix the boiler")).toBe("My landlord won't fix the boiler");
  });

  it("truncates long text at a word boundary under 150 chars", () => {
    const text = "word ".repeat(40).trim(); // 199 chars
    const title = titleFromDescription(text);
    expect(title.length).toBeLessThanOrEqual(150);
    expect(title.endsWith("word")).toBe(true); // cut cleanly, not mid-word
  });

  it("falls back to a fixed placeholder for empty/whitespace-only text", () => {
    expect(titleFromDescription("   ")).toBe("New case");
    expect(titleFromDescription("")).toBe("New case");
  });
});

describe("describeCasePayload", () => {
  it("builds a minimal NewCase from free text with safe placeholder defaults", () => {
    const payload = describeCasePayload("My landlord won't fix the boiler");
    expect(payload).toEqual({
      title: "My landlord won't fix the boiler",
      areas: ["OTHER"],
      ukJurisdiction: null,
      where: "",
      side: null,
      others: [],
    });
  });
});
