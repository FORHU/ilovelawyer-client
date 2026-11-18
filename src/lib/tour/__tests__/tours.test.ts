import { describe, expect, it } from "vitest";
import { guideContext, guideQuestions, tourFor, tourForContext } from "../tours";

// The UK site, with the AI chat and lawyers; KR has neither yet (lib/tenant/sites.ts).
const UK = { ai: true, lawyers: true };
const KR = { ai: false, lawyers: false };

describe("guideContext", () => {
  it("tells the pages apart", () => {
    expect(guideContext("/cases", null)).toBe("cases");
    expect(guideContext("/cases/new", null)).toBe("new-case");
    expect(guideContext("/cases/abc", "tab-chat")).toBe("case");
    expect(guideContext("/cases/abc", "tab-lawyer")).toBe("lawyer");
    expect(guideContext("/settings", null)).toBeNull();
  });
});

describe("tourForContext", () => {
  it("runs a tour on cases, New case, a case and the lawyer tab", () => {
    expect(tourForContext("cases", UK)).toBe("T1");
    expect(tourForContext("case", UK)).toBe("T3");
    expect(tourForContext("lawyer", UK)).toBe("T4");
    expect(tourForContext("new-case", UK)).toBe("T5");
    expect(tourForContext(null, UK)).toBeNull();
  });
});

describe("tourFor", () => {
  it("has the stops in the design", () => {
    expect(tourFor("T1", { credits: 50, ...UK }).steps).toHaveLength(3);
    expect(tourFor("T3", { credits: 50, ...UK }).steps).toHaveLength(5);
    expect(tourFor("T4", { credits: 50, ...UK }).steps).toHaveLength(2);
    expect(tourFor("T5", { credits: 50, ...UK }).steps).toHaveLength(4);
    expect(tourFor("T5", { credits: 50, ...UK }).steps.map((s) => s.target)).toEqual(["chatbox", "mic", "starters", "opt-form"]);
  });

  it("says how many credits a case starts with, when known", () => {
    expect(tourFor("T3", { credits: 50, ...UK }).steps[3].body).toContain("You started with 50.");
    expect(tourFor("T3", { credits: null, ...UK }).steps[3].body).not.toContain("started");
  });

  it("keeps the composer step look-only on a phone", () => {
    expect(tourFor("T3", { credits: null, ...UK }).steps[0].lookOnPhone).toBe(true);
  });
});

describe("guideQuestions", () => {
  it("points each question at a single control", () => {
    const qs = guideQuestions("case", { credits: 50, ...UK });
    expect(qs.map((q) => q.step.target)).toEqual(["tab-docs", "get-lawyer", "case-credits"]);
    expect(guideQuestions("new-case", { credits: 50, ...UK }).map((q) => q.step.target)).toEqual(["chatbox", "opt-form"]);
    expect(guideQuestions(null, { credits: 50, ...UK })).toEqual([]);
  });
});

describe("on a site without the AI chat or lawyers", () => {
  it("has no chat tour on New case and no lawyer tour", () => {
    expect(tourForContext("new-case", KR)).toBeNull();
    expect(tourForContext("lawyer", KR)).toBeNull();
    expect(tourForContext("case", KR)).toBe("T3");
  });

  it("tours a case's overview and documents only, and Cases without credits", () => {
    expect(tourFor("T3", { credits: 50, ...KR }).steps.map((s) => s.target)).toEqual(["tab-overview", "tab-docs"]);
    expect(tourFor("T1", { credits: 50, ...KR }).steps.map((s) => s.target)).toEqual(["new-case", "guide"]);
    expect(guideQuestions("case", { credits: 50, ...KR }).map((q) => q.step.target)).toEqual(["tab-docs"]);
    expect(guideQuestions("new-case", { credits: 50, ...KR })).toEqual([]);
  });
});
