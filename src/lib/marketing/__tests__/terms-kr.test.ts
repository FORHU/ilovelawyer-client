import { describe, expect, it } from "vitest";
import { getClientTerms } from "@/lib/auth/terms";

const text = (lang: "ko" | "en", tenant: "KR" | "UK" | "PH" = "KR") => {
  const t = getClientTerms(tenant, lang);
  return t.sections.flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? []), ...(s.prohibited ?? []), s.quote ?? ""]).join("\n");
};

describe("the Korean site's Terms", () => {
  it("say the AI gives general information, not how the law applies to the user's case", () => {
    const ko = text("ko");
    expect(ko).not.toContain("법이 어떻게 적용될 수 있는지 설명");
    expect(ko).toContain("일반적인 법률 정보");
    expect(ko).toContain("대한변호사협회에 등록된 변호사");
  });

  it("don't bundle consent to AI processing or a data transfer into accepting the Terms", () => {
    expect(text("ko")).not.toMatch(/이 약관에 동의하면 (이에|그 목적을 위해)/);
    expect(text("en")).not.toContain("By agreeing to these Terms you consent to your personal information being transferred");
  });

  it("no longer say everything is stored in London", () => {
    expect(text("ko")).not.toContain("런던");
    expect(text("en")).not.toContain("servers in London");
  });

  it("don't promise deletion at any time, and say what stays after one (#178)", () => {
    expect(text("ko")).not.toContain("언제든지 삭제");
    expect(text("ko")).not.toContain("언제든지 계정을 해지");
    expect(text("en")).not.toMatch(/delete a case and its documents at any time|close your account at any time/);
    expect(text("ko")).toContain("30일의 유예 기간");
    expect(text("en")).toContain("30-day grace period");
    for (const kept of ["법령에 따라 보관해야 하는 기록", "백업", "변호사"]) expect(text("ko")).toContain(kept);
    for (const kept of ["records the law requires us to keep", "backups", "a lawyer who accepted your request"]) expect(text("en")).toContain(kept);
  });

  it("refund unused paid credits when a closure is final, as the KR Refunds Policy does (#178)", () => {
    expect(text("ko")).not.toContain("이월되지 않습니다");
    expect(text("en")).not.toContain("don't carry over");
    expect(text("ko")).not.toContain("옮기거나 현금으로 바꿀 수 없습니다");
    expect(text("en")).not.toContain("moved to another case or exchanged for cash");
    expect(text("ko")).toContain("자동 환불");
    expect(text("en")).toContain("automatically refund your unused paid credits");
  });

  it("keep the Korean and English section for section", () => {
    const ko = getClientTerms("KR", "ko").sections;
    const en = getClientTerms("KR", "en").sections;
    expect(ko.map((s) => s.paragraphs.length)).toEqual(en.map((s) => s.paragraphs.length));
  });
});

describe("the UK and Philippine Terms", () => {
  it.each(["UK", "PH"] as const)("keep their own deletion and credit wording on %s", (tenant) => {
    expect(text("en", tenant)).toContain("You can delete a case and its documents at any time.");
    expect(text("en", tenant)).toContain("Credits that haven't been used don't carry over.");
    expect(text("en", tenant)).not.toContain("automatically refund");
  });
});
