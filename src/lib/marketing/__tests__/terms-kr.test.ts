import { describe, expect, it } from "vitest";
import { getClientTerms } from "@/lib/auth/terms";

const text = (lang: "ko" | "en") => {
  const t = getClientTerms("KR", lang);
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
});
