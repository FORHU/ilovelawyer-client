import { describe, it, expect } from "vitest";
import { describeCasePayload, regionFromDescription, titleFromDescription } from "../describe-case";

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

describe("regionFromDescription", () => {
  it("reads a UK country or a large city", () => {
    expect(regionFromDescription("I lost my job and I am from Manchester.")).toBe("England and Wales");
    expect(regionFromDescription("My landlord in cardiff won't return my deposit")).toBe("England and Wales");
    expect(regionFromDescription("I live in Wales")).toBe("England and Wales");
    expect(regionFromDescription("Dismissed from my job in Glasgow")).toBe("Scotland");
    expect(regionFromDescription("This happened in Scotland")).toBe("Scotland");
    expect(regionFromDescription("I'm in Belfast")).toBe("Northern Ireland");
    expect(regionFromDescription("I live in Londonderry")).toBe("Northern Ireland");
    expect(regionFromDescription("We're in Northern Ireland")).toBe("Northern Ireland");
  });

  it("says nothing without a place", () => {
    expect(regionFromDescription("My landlord won't fix the boiler")).toBe(null);
    expect(regionFromDescription("")).toBe(null);
  });

  it("says nothing when the message names more than one part of the UK", () => {
    expect(regionFromDescription("I moved from Glasgow to London last year")).toBe(null);
    expect(regionFromDescription("My employer is in Belfast but I work in Leeds")).toBe(null);
  });

  it("ignores adjectives, ambiguous towns and places that only sound British", () => {
    expect(regionFromDescription("I'm Scottish and my employer sacked me")).toBe(null);
    expect(regionFromDescription("A Welsh company owes me money")).toBe(null);
    expect(regionFromDescription("I live in Newcastle")).toBe(null);
    expect(regionFromDescription("I live in New South Wales")).toBe(null);
    expect(regionFromDescription("My landlord in New England kept my deposit")).toBe(null);
  });

  it("never says outside the UK", () => {
    expect(regionFromDescription("This happened in France, outside the UK")).toBe(null);
  });
});

describe("describeCasePayload", () => {
  it("builds a placeholder NewCase whose part of the UK is not known yet, never outside the UK", () => {
    const payload = describeCasePayload("My landlord won't fix the boiler");
    expect(payload).toEqual({
      title: "My landlord won't fix the boiler",
      areas: ["OTHER"],
      ukJurisdiction: null,
      outsideUk: false,
      where: "",
      side: null,
      others: [],
    });
  });

  it("sets the type of issue the first message points to, from the site's list (#973)", () => {
    const areas = [
      { code: "EMPLOYMENT", name: "Employment" },
      { code: "PROPERTY", name: "Property and housing" },
    ];
    expect(describeCasePayload("I lost my job and I am from Manchester.", areas).areas).toEqual(["EMPLOYMENT"]);
    expect(describeCasePayload("My landlord won't fix the boiler", areas).areas).toEqual(["PROPERTY"]);
    // Nothing it can name, or the list not loaded yet: "Other", for the AI to correct.
    expect(describeCasePayload("Something bad happened", areas).areas).toEqual(["OTHER"]);
    expect(describeCasePayload("I lost my job").areas).toEqual(["OTHER"]);
  });

  it("sets the part of the UK the first message names (#973)", () => {
    expect(describeCasePayload("I lost my job and I am from Manchester.")).toMatchObject({ ukJurisdiction: "England and Wales", outsideUk: false });
  });
});
