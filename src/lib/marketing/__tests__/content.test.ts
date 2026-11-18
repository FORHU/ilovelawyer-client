import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { landingContentFor, type LandingContent } from "../content";
import { KR_CONTENT } from "../content/kr";
import { UK_CONTENT } from "../content/uk";
import { copyParts, FAQS, TRUST_CARDS } from "../copy";
import { HOW_HEADING_TIMES, TERMINAL_CAPTION_COUNT } from "../how-timeline";
import { heroImageSrc, matchProblem } from "../problems";

const publicFile = (src: string) => path.join(process.cwd(), "public", src);
const sites: [string, LandingContent][] = [
  ["UK", UK_CONTENT],
  ["KR", KR_CONTENT],
];

describe("landingContentFor", () => {
  it("gives Korea its own page and every other site the UK one", () => {
    expect(landingContentFor("KR")).toBe(KR_CONTENT);
    expect(landingContentFor("UK")).toBe(UK_CONTENT);
    expect(landingContentFor("PH")).toBe(UK_CONTENT);
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
    expect(content.mock.lawyers).toHaveLength(3);
    expect(content.mock.frame.labels).toHaveLength(6);
    expect(content.mock.frame.paths).toHaveLength(6);
    expect(content.mock.starters).toHaveLength(3);
    expect(content.mock.overview.criteria).toHaveLength(3);
  });

  it("starts on a problem that exists", () => {
    expect(content.problems[content.startProblem]).toBeDefined();
  });

  it("adds up each sample quote", () => {
    const money = (s: string) => Number(s.replace(/[^0-9.]/g, ""));
    for (const l of content.mock.lawyers) expect(money(l.fee) + money(l.platform)).toBe(money(l.total));
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

  it("has a section for fees, and it follows the app: free cases, a platform fee on the quote", () => {
    const fees = KR_CONTENT.fees!;
    expect(fees.cards).toHaveLength(3);
    const text = fees.cards.map((c) => `${c.title}\n${c.body}`).join("\n");
    expect(text).toContain("무료");
    expect(text).toContain("플랫폼 수수료");
    expect(UK_CONTENT.fees).toBeUndefined();
  });

  it("does not claim ilovelawyer takes no share, which the app's platform fee contradicts", () => {
    const everything = JSON.stringify([KR_CONTENT.trust, KR_CONTENT.fees, KR_CONTENT.faq, KR_CONTENT.mock.lawyers]);
    for (const claim of ["나누어 받지 않", "받지 않으며, 변호사 보수를"]) expect(everything).not.toContain(claim);
  });

  it("leaves its open decisions as placeholders that show as chips", () => {
    const placeholders = copyParts(KR_CONTENT.trust.cards[2].body).filter((p) => p.kind === "placeholder");
    expect(placeholders.length).toBeGreaterThan(0);
    expect(copyParts(KR_CONTENT.footer.legalNote ?? "").some((p) => p.kind === "placeholder")).toBe(true);
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
