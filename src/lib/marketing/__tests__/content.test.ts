import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { landingContentFor, type LandingContent } from "../content";
import { KR_CONTENT } from "../content/kr";
import { KR_EN_CONTENT } from "../content/kr-en";
import { UK_CONTENT } from "../content/uk";
import { copyParts, FAQS, PRIVACY_SECTIONS, SUPPORT_EMAIL, TRUST_CARDS } from "../copy";
import { HOW_HEADING_TIMES, TERMINAL_CAPTION_COUNT } from "../how-timeline";
import { heroImageSrc, matchProblem } from "../problems";
import { siteLandingCopy } from "../site-landing";

const publicFile = (src: string) => path.join(process.cwd(), "public", src);
const sites: [string, LandingContent][] = [
  ["UK", UK_CONTENT],
  ["KR", KR_CONTENT],
  ["KR in English", KR_EN_CONTENT],
];

describe("landingContentFor", () => {
  it("gives Korea its own page and every other site the UK one", () => {
    expect(landingContentFor("KR")).toBe(KR_CONTENT);
    expect(landingContentFor("UK")).toBe(UK_CONTENT);
    expect(landingContentFor("PH")).toBe(UK_CONTENT);
  });

  it("gives the Korean site Korean, or English when the visitor switched, and every other site English", () => {
    expect(landingContentFor("KR", "ko")).toBe(KR_CONTENT);
    expect(landingContentFor("KR", "en")).toBe(KR_EN_CONTENT);
    expect(landingContentFor("KR")).toBe(KR_CONTENT);
    expect(landingContentFor("UK", "ko")).toBe(UK_CONTENT);
    expect(landingContentFor("UK", "en")).toBe(UK_CONTENT);
  });

  it("keeps the UK page's trust cards and questions exactly as the legal wording has them", () => {
    expect(UK_CONTENT.trust.cards).toBe(TRUST_CARDS);
    expect(UK_CONTENT.faq.items).toBe(FAQS);
  });
});

describe.each(sites)("the %s page's shape", (_site, content) => {
  it("fills every slot the shared layout and motion expect", () => {
    expect(content.how.headings).toHaveLength(HOW_HEADING_TIMES.length);
    expect(content.how.captions).toHaveLength(TERMINAL_CAPTION_COUNT);
    expect(content.how.clientPhotos).toHaveLength(4);
    expect(content.how.solicitorPhotos).toHaveLength(4);
    expect(content.how.captions.every((c) => c.label.includes(" · "))).toBe(true);
    expect(content.paper.fill).toHaveLength(2);
    expect(content.paper.senders.length).toBeGreaterThanOrEqual(6);
    expect(content.paper.formCodes.length).toBeGreaterThanOrEqual(6);
    // Three quotes to compare, or the one lawyer the client chose where the fee is agreed directly.
    expect(content.mock.lawyers).toHaveLength(content.mock.quotes.directFee ? 1 : 3);
    expect(content.mock.frame.labels).toHaveLength(6);
    expect(content.mock.frame.paths).toHaveLength(6);
    expect(content.mock.starters).toHaveLength(3);
    expect(content.mock.overview.criteria).toHaveLength(3);
  });

  it("starts on a problem that exists", () => {
    expect(content.problems[content.startProblem]).toBeDefined();
  });

  it("adds up each sample quote, where it shows amounts", () => {
    const money = (s?: string) => Number((s ?? "").replace(/[^0-9.]/g, ""));
    if (content.mock.quotes.directFee) return;
    for (const l of content.mock.lawyers) {
      expect(l.total, l.name).toBeTruthy();
      expect(money(l.fee) + money(l.platform)).toBe(money(l.total));
    }
  });

  it("has a photo on disk for everything it shows", () => {
    const photos = [...content.how.clientPhotos, ...content.how.solicitorPhotos].map((p) => p.src);
    const heroes = content.problems.map((p) => heroImageSrc(p));
    for (const src of [...photos, ...heroes, content.closing.imageSrc]) expect(fs.existsSync(publicFile(src)), src).toBe(true);
  });

  it("has a unique photo for each problem", () => {
    expect(new Set(content.problems.map((p) => heroImageSrc(p))).size).toBe(content.problems.length);
  });
});

describe("the Korean page", () => {
  const labelFor = (q: string) => KR_CONTENT.problems[matchProblem(q, KR_CONTENT.problems)]?.label;

  it("finds the problem a Korean search describes", () => {
    expect(labelFor("집주인이 보증금을 안 돌려줘요")).toBe("전세보증금 반환");
    expect(labelFor("경찰 출석")).toBe("경찰 출석요구서");
    expect(labelFor("월급을 못 받았어요")).toBe("임금체불");
    expect(labelFor("이혼하고 싶어요")).toBe("이혼 · 위자료");
    expect(labelFor("퇴직금")).toBe("퇴직금");
  });

  it("finds nothing in what is not a problem", () => {
    expect(matchProblem("zzz qqq", KR_CONTENT.problems)).toBe(-1);
    expect(matchProblem("ㅋㅋㅋ", KR_CONTENT.problems)).toBe(-1);
  });

  it("keeps each photo's person on the side the design put them", () => {
    const bySlug = Object.fromEntries(KR_CONTENT.problems.map((p) => [p.slug, p]));
    expect(bySlug["jeonse-deposit"].fx).toBe(0.35);
    expect(bySlug["jeonse-fraud"].fx).toBe(0.68);
    // Dropping the frozen-account problem, which sat between them, mustn't move the problems after it.
    expect(bySlug["dui"].fx).toBe(0.68);
    expect(bySlug["traffic-accident"].fx).toBe(0.35);
    expect(bySlug["payment-order"].fx).toBe(0.35);
    expect(bySlug["unfair-dismissal"]).toMatchObject({ width: 2752, height: 1536 });
  });

  it("has a section for fees: free cases, the lawyer's fee agreed directly with the lawyer", () => {
    const fees = KR_CONTENT.fees!;
    expect(fees.cards).toHaveLength(3);
    const text = fees.cards.map((c) => `${c.title}\n${c.body}`).join("\n");
    expect(text).toContain("무료");
    expect(text).toContain("직접");
    expect(text).not.toContain("플랫폼 수수료");
    expect(UK_CONTENT.fees).toBeUndefined();
  });

  it("takes no platform fee anywhere, and shows one chosen lawyer with no amounts", () => {
    const everything = JSON.stringify([KR_CONTENT.trust, KR_CONTENT.fees, KR_CONTENT.faq, KR_CONTENT.mock]);
    for (const claim of ["플랫폼 수수료", "ilovelawyer로 결제", "결제한 변호사", "최대 3명"]) expect(everything).not.toContain(claim);
    expect(KR_CONTENT.mock.lawyers).toHaveLength(1);
    expect(KR_CONTENT.mock.lawyers[0].total).toBeUndefined();
    expect(KR_CONTENT.mock.quotes.directFee).toBeTruthy();
  });

  it("still shows a [bracketed] decision as a chip, should one be added before launch", () => {
    expect(copyParts("문장 [확정 후 기재] 문장").some((p) => p.kind === "placeholder")).toBe(true);
  });

  it("links the Korean names of the policies", () => {
    expect(copyParts("자세한 내용은 개인정보처리방침을 확인하세요.")).toContainEqual({ kind: "link", text: "개인정보처리방침", href: "/privacy" });
    expect(copyParts("환불 정책에 따릅니다.")).toContainEqual({ kind: "link", text: "환불 정책", href: "/refunds" });
  });

  it("dates its sample papers the way the design does", () => {
    expect(KR_CONTENT.paper.date(0)).toBe("2026년 10월 1일");
    expect(UK_CONTENT.paper.date(0)).toBe("0 October 2026");
  });
});

describe("the KR page's launch-blocking wording", () => {
  const all = JSON.stringify(KR_CONTENT);

  it("has no quote or matching language (Attorney-at-Law Act Art. 34)", () => {
    expect(all).not.toContain("견적");
  });

  it("has no placeholders left to go live", () => {
    expect(all).not.toContain("확정 후 기재");
    for (const chip of ["[상호]", "[번호]", "[주소]", "[이름]"]) expect(all).not.toContain(chip);
  });
});

describe("the KR footer's operator details (confirmed 20–23 Nov 2026)", () => {
  const note = KR_CONTENT.footer.legalNote ?? "";

  it("names FORHU Inc. with its registration, representative and address", () => {
    for (const fact of ["FORHU Inc.", "File No. 10371682", "Jungkwan Shin", "30 Wall Street, 8th Floor, New York, NY 10005, USA"]) {
      expect(note).toContain(fact);
    }
  });

  it("gives the customer contact, and not the UK site's old address", () => {
    expect(KR_CONTENT.footer.supportEmail).toBe("ilovelawyer@forhu.ai");
    expect(note).toContain("ilovelawyer@forhu.ai");
    expect(JSON.stringify(KR_CONTENT)).not.toContain("forhu.com");
  });
});

describe("the operator's details on every site (confirmed 20–23 Nov 2026)", () => {
  const facts = ["FORHU Inc.", "10371682", "Jungkwan Shin", "30 Wall Street, 8th Floor, New York, NY 10005, USA", "ilovelawyer@forhu.ai"];

  it("uses one customer contact, and not the old help address", () => {
    expect(SUPPORT_EMAIL).toBe("ilovelawyer@forhu.ai");
    for (const [site, content] of sites) expect(content.footer.supportEmail, site).toBe(SUPPORT_EMAIL);
  });

  it("names the operator in the UK footer", () => {
    for (const fact of facts) expect(UK_CONTENT.footer.legalNote, fact).toContain(fact);
  });

  it("names the operator in the Philippine footer", () => {
    const ph = siteLandingCopy("PH", "en");
    for (const fact of facts) expect(ph?.legalNote, fact).toContain(fact);
  });

  it("names the operator as the UK Privacy Policy's controller, with no company placeholder left", () => {
    const who = PRIVACY_SECTIONS.find((s) => s.title === "Who we are")?.blocks.join(" ") ?? "";
    for (const fact of facts) expect(who, fact).toContain(fact);
    const policy = JSON.stringify(PRIVACY_SECTIONS);
    for (const gone of ["[Company name]", "[England and Wales]", "[privacy email]", "[number]", "[address]"]) expect(policy).not.toContain(gone);
  });
});

describe("the Korean site in English", () => {
  // What a visitor reads: every string value, but not the keys (the mock's are named `quotes`) and not
  // the problems' search keywords, which stay bilingual on purpose so a Korean query still finds a card.
  const strings = (node: unknown, key = ""): string[] => {
    if (typeof node === "string") return key === "keywords" ? [] : [node];
    if (Array.isArray(node)) return node.flatMap((n) => strings(n, key));
    if (node && typeof node === "object") return Object.entries(node).flatMap(([k, v]) => strings(v, k === "keywords" ? k : ""));
    return [];
  };
  const shown = strings(KR_EN_CONTENT).join(" | ");

  it("says its language", () => {
    expect(KR_EN_CONTENT.htmlLang).toBe("en");
    expect(KR_EN_CONTENT.meta.ogLocale).toBe("en_US");
  });

  it("has no quote or matching language (Attorney-at-Law Act Art. 34), as the Korean page has none", () => {
    expect(shown).not.toMatch(/\b(quote|quotes|quoted|quoting|estimate|estimates|bid|bids)\b/i);
    expect(shown).not.toContain("견적");
  });

  it("has no placeholders left to go live, and no Korean text left untranslated", () => {
    expect(shown).not.toMatch(/\[[^\[\]]+\]/);
    expect(shown).not.toMatch(/[\u3131-\u318E\uAC00-\uD7A3]/);
  });

  it("makes no promise the Korean page doesn't, and no fee beyond the lawyer's own", () => {
    expect(shown).not.toMatch(/platform fee|referral fee|3 lawyers|up to three/i);
    expect(KR_EN_CONTENT.mock.quotes.directFee).toBeTruthy();
    expect(KR_EN_CONTENT.mock.lawyers).toHaveLength(1);
  });

  it("carries the generative-AI notice and the operator's details", () => {
    expect(KR_EN_CONTENT.hero.disclaimer).toContain("generative AI");
    expect(KR_EN_CONTENT.footer.disclaimer).toBe(KR_EN_CONTENT.hero.disclaimer);
    for (const fact of ["FORHU Inc.", "10371682", "Jungkwan Shin", "30 Wall Street, 8th Floor, New York, NY 10005, USA", "ilovelawyer@forhu.ai"]) {
      expect(KR_EN_CONTENT.footer.legalNote, fact).toContain(fact);
    }
  });

  it("covers the same problems, photos and FAQ topics as the Korean page", () => {
    expect(KR_EN_CONTENT.problems.map((p) => p.slug)).toEqual(KR_CONTENT.problems.map((p) => p.slug));
    expect(KR_EN_CONTENT.problems.map((p) => [p.fx, p.fy, p.width, p.height])).toEqual(KR_CONTENT.problems.map((p) => [p.fx, p.fy, p.width, p.height]));
    expect(KR_EN_CONTENT.faq.items).toHaveLength(KR_CONTENT.faq.items.length);
    expect(KR_EN_CONTENT.trust.cards).toHaveLength(KR_CONTENT.trust.cards.length);
    expect(KR_EN_CONTENT.fees?.cards).toHaveLength(KR_CONTENT.fees!.cards.length);
    expect(KR_EN_CONTENT.how.headings).toHaveLength(KR_CONTENT.how.headings.length);
  });

  it("finds the problem an English search describes, and still a Korean one", () => {
    const labelFor = (q: string) => KR_EN_CONTENT.problems[matchProblem(q, KR_EN_CONTENT.problems)]?.label;
    expect(labelFor("my landlord won't return my deposit")).toBe("Jeonse deposit return");
    expect(labelFor("police summons")).toBe("Police summons");
    expect(labelFor("퇴직금")).toBe("Severance pay");
  });

  it("links the policies it names", () => {
    expect(copyParts(KR_EN_CONTENT.faq.items.at(-1)!.a)).toContainEqual({ kind: "link", text: "Privacy Policy", href: "/privacy" });
    expect(copyParts(KR_EN_CONTENT.faq.items.find((i) => i.q === "Can I get a refund?")!.a)).toContainEqual({ kind: "link", text: "Refunds Policy", href: "/refunds" });
  });
});
