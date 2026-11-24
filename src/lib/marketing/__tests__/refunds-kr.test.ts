import { describe, expect, it } from "vitest";
import { COMPANY, legalSectionId, REFUNDS_SECTIONS, SUPPORT_EMAIL, type LegalSection } from "../copy";
import { REFUNDS_KR, REFUNDS_SECTIONS_KO, REFUNDS_SECTIONS_KR_EN } from "../refunds-kr";

const text = (sections: LegalSection[]) => sections.flatMap((s) => [s.title, ...s.blocks.flat()]).join("\n");

describe.each([
  ["Korean", REFUNDS_SECTIONS_KO, REFUNDS_KR.ko],
  ["English", REFUNDS_SECTIONS_KR_EN, REFUNDS_KR.en],
] as const)("the Korean site's Refunds Policy in %s", (_, sections, page) => {
  const all = text(sections);

  it("has no placeholders left to decide", () => {
    expect(all + page.updated).not.toMatch(/\[[^\]]*\]/);
  });

  it("keeps none of the UK policy's terms", () => {
    for (const uk of ["14 days", "14일", "platform fee", "플랫폼 수수료", "solicitor", "솔리시터", "Ombudsman", "quote", "견적"]) {
      expect(all).not.toContain(uk);
    }
  });

  it("states the 7-day withdrawal right for unused AI credits", () => {
    expect(all).toMatch(/7 days|7일/);
    expect(all).toMatch(/haven't used|사용하지 않은/);
  });

  it("refunds unused paid credits automatically once an account's closure is final (#178)", () => {
    expect(all).toMatch(/계정을 해지할 때|When you close your account/);
    expect(all).toMatch(/자동으로 환불|refund your unused paid AI credits automatically/);
    expect(all).toMatch(/무료로 포함된 크레딧은 환불되지 않습니다|Credits included free with a case aren't refunded/);
  });

  it("names the operator and the contact", () => {
    for (const fact of [COMPANY.name, COMPANY.fileNo, COMPANY.representative, COMPANY.address, COMPANY.krBusinessNo, SUPPORT_EMAIL]) expect(all).toContain(fact);
  });

  it("gives every section a unique id", () => {
    const ids = sections.map((s, i) => legalSectionId(s.title, i));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches the other language section for section", () => {
    expect(sections).toHaveLength(REFUNDS_SECTIONS_KO.length);
  });
});

it("leaves the UK Refunds Policy as it was", () => {
  expect(REFUNDS_SECTIONS[1]!.title).toBe("2. Your right to cancel (14 days)");
});
