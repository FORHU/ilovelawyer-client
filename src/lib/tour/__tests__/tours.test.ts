import { describe, expect, it } from "vitest";
import { guideContext, guideQuestions, tourFor, tourForContext } from "../tours";

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
    expect(tourForContext("cases")).toBe("T1");
    expect(tourForContext("case")).toBe("T3");
    expect(tourForContext("lawyer")).toBe("T4");
    expect(tourForContext("new-case")).toBe("T5");
    expect(tourForContext(null)).toBeNull();
  });
});

describe("tourFor", () => {
  it("has the stops in the design", () => {
    expect(tourFor("T1", { credits: 50 }).steps).toHaveLength(3);
    expect(tourFor("T3", { credits: 50 }).steps).toHaveLength(5);
    expect(tourFor("T4", { credits: 50 }).steps).toHaveLength(2);
    expect(tourFor("T5", { credits: 50 }).steps).toHaveLength(4);
    expect(tourFor("T5", { credits: 50 }).steps.map((s) => s.target)).toEqual(["chatbox", "mic", "starters", "opt-form"]);
  });

  it("says how many credits a case starts with, when known", () => {
    expect(tourFor("T3", { credits: 50 }).steps[3].body).toContain("You started with 50.");
    expect(tourFor("T3", { credits: null }).steps[3].body).not.toContain("started");
  });

  it("keeps the composer step look-only on a phone", () => {
    expect(tourFor("T3", { credits: null }).steps[0].lookOnPhone).toBe(true);
  });
});

describe("guideQuestions", () => {
  it("points each question at a single control", () => {
    const qs = guideQuestions("case", { credits: 50 });
    expect(qs.map((q) => q.step.target)).toEqual(["tab-docs", "get-lawyer", "case-credits"]);
    expect(guideQuestions("new-case", { credits: 50 }).map((q) => q.step.target)).toEqual(["chatbox", "opt-form"]);
    expect(guideQuestions(null, { credits: 50 })).toEqual([]);
  });
});
