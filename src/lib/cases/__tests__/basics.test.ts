import { describe, it, expect } from "vitest";
import { caseBasics } from "../basics";

const empty = { people: [], timeline: [], goals: [], summary: null };
const bare = { areas: [], ukJurisdiction: null, others: [], notes: "" };
const met = (b: ReturnType<typeof caseBasics>) => b.filter((x) => x.met).map((x) => x.key);

describe("caseBasics", () => {
  it("has five basics, none met for a bare case", () => {
    const b = caseBasics(bare, empty);
    expect(b).toHaveLength(5);
    expect(met(b)).toEqual([]);
  });

  it("takes the problem, place and other side from the case form", () => {
    const b = caseBasics({ ...bare, areas: [{ code: "EMPLOYMENT" }] as never, ukJurisdiction: "England and Wales" as never, others: [{ name: "Harlow", role: "Employer" }] as never }, empty);
    expect(met(b)).toEqual(["problem", "where", "other-side"]);
  });

  it("counts what happened and what you want from the form's notes", () => {
    const b = caseBasics({ ...bare, notes: "What happened: sacked\n\nWhat I want: my job back" }, empty);
    expect(met(b)).toEqual(["what-happened", "what-you-want"]);
  });

  it("counts them from the overview too", () => {
    const b = caseBasics(bare, { ...empty, timeline: [{}] as never, goals: [{}] as never, people: [{}] as never });
    expect(met(b)).toEqual(["other-side", "what-happened", "what-you-want"]);
  });
});
