import { describe, expect, it } from "vitest";
import { getClientTerms } from "@/lib/auth/terms";
import { copyParts, FAQS, legalSectionId, PRIVACY_SECTIONS, REFUNDS_SECTIONS, termsToLegalSections, TRUST_CARDS } from "../copy";

const legalText = (sections: { blocks: (string | string[])[] }[]) => sections.flatMap((s) => s.blocks.flat());
const everything = [...TRUST_CARDS.map((c) => c.body), ...FAQS.flatMap((f) => [f.q, f.a]), ...legalText(PRIVACY_SECTIONS), ...legalText(REFUNDS_SECTIONS)].join("\n");

describe("copyParts", () => {
  it("separates text, placeholders and policy links", () => {
    expect(copyParts("A fee of [£X]. See our Privacy Policy.")).toEqual([
      { kind: "text", text: "A fee of " },
      { kind: "placeholder", text: "[£X]" },
      { kind: "text", text: ". See our " },
      { kind: "link", text: "Privacy Policy", href: "/privacy" },
      { kind: "text", text: "." },
    ]);
  });

  it("leaves plain wording alone", () => {
    expect(copyParts("Plain.")).toEqual([{ kind: "text", text: "Plain." }]);
  });
});

describe("the wording", () => {
  it("never uses what the legal draft forbids", () => {
    for (const banned of ["legal advice from AI", "your lawyer", "we will win", "guaranteed outcome", "best solicitors"]) {
      expect(everything.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  it("matches the Terms on pricing: no fee to open a case", () => {
    for (const fee of ["case fee", "one-off fee", "opening a case costs", "fee to open"]) {
      expect(everything.toLowerCase()).not.toContain(fee);
    }
    const terms = getClientTerms("UK").sections.flatMap((s) => s.paragraphs).join(" ");
    expect(terms).toContain("Creating a case is free");
    expect(FAQS.find((f) => f.q === "How much does it cost?")?.a).toContain("Creating a case is free");
  });

  it("matches the app on what hiring a solicitor costs: their fee plus a platform fee", () => {
    for (const old of ["referral fee", "added to your bill", "paid by the solicitor", "out of their own business"]) {
      expect(everything.toLowerCase()).not.toContain(old);
    }
    expect(TRUST_CARDS.find((c) => c.title === "How ilovelawyer is paid")?.body).toContain("their fee, plus ilovelawyer's platform fee");
    expect(FAQS.find((f) => f.q === "How much does it cost?")?.a).toContain("platform fee");
    expect(legalText(REFUNDS_SECTIONS).join(" ")).toContain("platform fee");
  });

  it("matches the consent text on what solicitors see", () => {
    expect(everything).not.toContain("not your name");
    expect(everything).not.toContain("You stay anonymous");
    expect(TRUST_CARDS.find((c) => c.title === "What solicitors can see")?.body).toContain("conflict of interest");
    expect(legalText(PRIVACY_SECTIONS).join(" ")).toContain("conflict check");
  });

  it("refers to the trust card by its real title", () => {
    const card = FAQS.find((f) => f.q === "How does ilovelawyer make money?")?.a;
    expect(TRUST_CARDS.some((c) => card?.includes(c.title))).toBe(true);
  });

  it("states the personal injury exclusion", () => {
    expect(FAQS.find((f) => f.q === "What types of case do you handle?")?.a).toContain("do not handle personal injury");
  });
});

describe("termsToLegalSections", () => {
  it("carries over every word of the Terms", () => {
    const terms = getClientTerms("UK");
    const sections = termsToLegalSections(terms.sections);
    expect(sections).toHaveLength(terms.sections.length);
    const shown = legalText(sections);
    for (const s of terms.sections) {
      for (const line of [...s.paragraphs, ...(s.bullets ?? []), ...(s.prohibited ?? []), ...(s.quote ? [s.quote] : [])]) {
        expect(shown).toContain(line);
      }
    }
  });
});

describe("legalSectionId", () => {
  it("gives every section of every page a unique id", () => {
    for (const sections of [PRIVACY_SECTIONS, REFUNDS_SECTIONS, termsToLegalSections(getClientTerms("UK").sections)]) {
      const ids = sections.map((s, i) => legalSectionId(s.title, i));
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^s\d+-[a-z0-9-]*$/);
    }
  });
});
