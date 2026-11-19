import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setCurrentSite } from "@/lib/tenant/current-site";
import type { CaseArea, UkJurisdiction } from "@/lib/types";
import { chosenLawyerFit, useChosenLawyer, type ChosenLawyer } from "../chosen-lawyer";

const JANE: ChosenLawyer = { id: "l1", name: "Jane Smith", caseAreas: ["EMPLOYMENT"], qualifiedJurisdictions: ["England and Wales" as UkJurisdiction] };
const area = (code: string) => ({ code, name: code }) as CaseArea;
const theCase = (codes: string[], ukJurisdiction: string | null) => ({ areas: codes.map(area), ukJurisdiction: ukJurisdiction as UkJurisdiction | null });

describe("chosenLawyerFit", () => {
  it("fits when the lawyer takes one of the case's areas in its part of the UK", () => {
    expect(chosenLawyerFit(JANE, theCase(["HOUSING", "EMPLOYMENT"], "England and Wales"))).toBe("fits");
  });

  it("is a mismatch on the wrong area or the wrong part of the UK", () => {
    expect(chosenLawyerFit(JANE, theCase(["HOUSING"], "England and Wales"))).toBe("mismatch");
    expect(chosenLawyerFit(JANE, theCase(["EMPLOYMENT"], "Scotland"))).toBe("mismatch");
  });

  it("is unknown until the case has an area and a part of the UK", () => {
    expect(chosenLawyerFit(JANE, theCase([], "England and Wales"))).toBe("unknown");
    expect(chosenLawyerFit(JANE, theCase(["EMPLOYMENT"], null))).toBe("unknown");
  });
});

describe("chosenLawyerFit on the Korean site", () => {
  const SEO: ChosenLawyer = { id: "l2", name: "Kim Minjun", caseAreas: ["EMPLOYMENT"], qualifiedJurisdictions: [] };
  beforeEach(() => setCurrentSite("KR"));
  afterEach(() => setCurrentSite("UK"));

  it("goes by the area alone: Korea has no parts with their own law", () => {
    expect(chosenLawyerFit(SEO, theCase(["EMPLOYMENT"], null))).toBe("fits");
    expect(chosenLawyerFit(SEO, theCase(["HOUSING"], null))).toBe("mismatch");
  });

  it("is unknown until the case has an area", () => {
    expect(chosenLawyerFit(SEO, theCase([], null))).toBe("unknown");
  });
});

describe("useChosenLawyer", () => {
  beforeEach(() => useChosenLawyer.setState({ pending: null, byCase: {} }));

  it("keeps the lawyer chosen first for the case it becomes", () => {
    const s = useChosenLawyer.getState();
    s.choose({ ...JANE, avatarUrl: null } as ChosenLawyer, "u1");
    expect(useChosenLawyer.getState().pending).toEqual({ ...JANE, ownerId: "u1" });

    s.attach("c1", "u1");
    expect(useChosenLawyer.getState().pending).toBeNull();
    expect(useChosenLawyer.getState().byCase.c1).toEqual(JANE);
  });

  it("doesn't give another client's choice to their case", () => {
    const s = useChosenLawyer.getState();
    s.choose(JANE, "u1");
    s.attach("c1", "u2");
    expect(useChosenLawyer.getState().byCase).toEqual({});
    expect(useChosenLawyer.getState().pending?.ownerId).toBe("u1");
  });

  it("forgets the lawyer once the case is sent", () => {
    const s = useChosenLawyer.getState();
    s.choose(JANE, "u1");
    s.attach("c1", "u1");
    s.forget("c1");
    expect(useChosenLawyer.getState().byCase).toEqual({});
  });
});
