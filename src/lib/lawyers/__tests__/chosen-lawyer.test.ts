import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useSession } from "@/lib/auth/session";
import { setCurrentSite } from "@/lib/tenant/current-site";
import type { CaseArea, UkJurisdiction } from "@/lib/types";
import type { LawyerReadiness } from "@/lib/cases/readiness";
import type { LawyerRequestEligibility } from "@/lib/lawyer-requests/api";
import { chosenLawyerCardState, chosenLawyerFit, useChosenLawyer, type ChosenLawyer, type ChosenLawyerCardInput } from "../chosen-lawyer";

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

describe("useChosenLawyer on sign-out", () => {
  it("clears the lawyer waiting for a new case and every case's lawyer", () => {
    const s = useChosenLawyer.getState();
    s.choose(JANE, "u1");
    s.attach("c1", "u1");
    s.choose(JANE, "u1");
    s.clear();
    expect(useChosenLawyer.getState().pending).toBeNull();
    expect(useChosenLawyer.getState().byCase).toEqual({});
  });
});

describe("useChosenLawyer when the session ends", () => {
  const USER = { id: "u1", username: "u", email: "u@example.com", name: null, role: "USER" as const };
  afterEach(() => useSession.getState().clear());

  it("clears what's remembered when the session is cleared, as a failed refresh does", () => {
    useSession.getState().setSession(USER, "token");
    const s = useChosenLawyer.getState();
    s.choose(JANE, "u1");
    s.attach("c1", "u1");
    s.choose(JANE, "u1");
    useSession.getState().clear();
    expect(useChosenLawyer.getState().pending).toBeNull();
    expect(useChosenLawyer.getState().byCase).toEqual({});
  });

  it("keeps it while the session is only refreshed", () => {
    useSession.getState().setSession(USER, "token");
    useChosenLawyer.getState().choose(JANE, "u1");
    useSession.getState().setAccessToken("newer");
    useSession.getState().setUser({ ...USER, name: "Una" });
    expect(useChosenLawyer.getState().pending?.id).toBe("l1");
  });
});

describe("chosenLawyerCardState", () => {
  const ELIGIBLE: LawyerRequestEligibility = { eligible: true, reason: null, openRequestId: null };
  const criterion = (key: string, met: boolean) => ({ key, label: key, met, confidence: 1 });
  const readiness = (over: Partial<LawyerReadiness> = {}): LawyerReadiness => ({
    enabled: true,
    ready: true,
    criteria: [],
    caseAreas: [],
    ukJurisdiction: null,
    blockedBy: null,
    unavailable: false,
    checkedAt: null,
    basedOnMessageId: null,
    ...over,
  });
  const input = (over: Partial<ChosenLawyerCardInput> = {}): ChosenLawyerCardInput => ({
    chosen: JANE,
    theCase: theCase(["EMPLOYMENT"], "England and Wales"),
    eligibility: ELIGIBLE,
    readiness: readiness(),
    readinessExpected: true,
    openRequest: null,
    ...over,
  });

  it("is none with no lawyer chosen, or while eligibility loads", () => {
    expect(chosenLawyerCardState(input({ chosen: null })).kind).toBe("none");
    expect(chosenLawyerCardState(input({ eligibility: undefined })).kind).toBe("none");
  });

  it("is sent while the request is with one lawyer by name, chosen first or not", () => {
    const openRequest = { requestedLawyer: { id: "l1", name: "Jane Smith" }, requestedOnly: true, routingExpiresAt: "2026-11-21T10:00:00Z" };
    expect(chosenLawyerCardState(input({ openRequest }))).toEqual({ kind: "sent", lawyer: openRequest.requestedLawyer, routingExpiresAt: openRequest.routingExpiresAt });
    expect(chosenLawyerCardState(input({ chosen: null, openRequest })).kind).toBe("sent");
  });

  it("is none once the request has gone to every matching lawyer", () => {
    const openRequest = { requestedLawyer: { id: "l1", name: "Jane Smith" }, requestedOnly: false, routingExpiresAt: null };
    expect(chosenLawyerCardState(input({ openRequest })).kind).toBe("none");
    expect(chosenLawyerCardState(input({ openRequest: { requestedLawyer: null, requestedOnly: false, routingExpiresAt: null } })).kind).toBe("none");
  });

  it("is not ready, listing what's missing, until the case has what a lawyer needs", () => {
    const state = chosenLawyerCardState(input({ readiness: readiness({ ready: false, criteria: [criterion("dates", true), criterion("goal", false)] }) }));
    expect(state).toEqual({ kind: "not-ready", lawyer: JANE, reason: null, missing: [criterion("goal", false)] });
  });

  it("is not ready before the AI has answered (no readiness to go on yet)", () => {
    expect(chosenLawyerCardState(input({ readiness: undefined }))).toMatchObject({ kind: "not-ready", reason: null, missing: [] });
  });

  it("is not ready, with the reason, when the case can't go to a lawyer", () => {
    expect(chosenLawyerCardState(input({ eligibility: { eligible: false, reason: "REGION_UNKNOWN", openRequestId: null } }))).toMatchObject({
      kind: "not-ready",
      reason: "REGION_UNKNOWN",
    });
    expect(chosenLawyerCardState(input({ readiness: readiness({ blockedBy: "PERSONAL_INJURY" }) }))).toMatchObject({
      kind: "not-ready",
      reason: "PERSONAL_INJURY_EXCLUDED",
    });
  });

  it("is none when eligibility says a request is already open (it shows as one next)", () => {
    expect(chosenLawyerCardState(input({ eligibility: { eligible: false, reason: "REQUEST_ALREADY_OPEN", openRequestId: "r1" } })).kind).toBe("none");
  });

  it("is a mismatch only once the case is ready, not on the area guessed at first", () => {
    const housing = theCase(["HOUSING"], "England and Wales");
    expect(chosenLawyerCardState(input({ theCase: housing })).kind).toBe("mismatch");
    expect(chosenLawyerCardState(input({ theCase: housing, readiness: readiness({ ready: false }) })).kind).toBe("not-ready");
  });

  it("is ready when the lawyer fits, or while the fit is still unknown (the API checks on send)", () => {
    expect(chosenLawyerCardState(input())).toEqual({ kind: "ready", lawyer: JANE });
    expect(chosenLawyerCardState(input({ theCase: theCase(["EMPLOYMENT"], null) })).kind).toBe("ready");
  });

  it("goes by eligibility and fit alone where the site has no readiness check, or the check is off or failed", () => {
    expect(chosenLawyerCardState(input({ readinessExpected: false, readiness: undefined })).kind).toBe("ready");
    expect(chosenLawyerCardState(input({ readiness: readiness({ enabled: false, ready: false }) })).kind).toBe("ready");
    expect(chosenLawyerCardState(input({ readiness: readiness({ unavailable: true, ready: false }) })).kind).toBe("ready");
  });

  describe("on the Korean site", () => {
    beforeEach(() => setCurrentSite("KR"));
    afterEach(() => setCurrentSite("UK"));
    const SEO: ChosenLawyer = { id: "l2", name: "Kim Minjun", caseAreas: ["EMPLOYMENT"], qualifiedJurisdictions: [] };

    it("is ready or a mismatch by area, with no part of the country", () => {
      expect(chosenLawyerCardState(input({ chosen: SEO, theCase: theCase(["EMPLOYMENT"], null) })).kind).toBe("ready");
      expect(chosenLawyerCardState(input({ chosen: SEO, theCase: theCase(["HOUSING"], null) })).kind).toBe("mismatch");
    });
  });
});
