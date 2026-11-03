import { describe, it, expect } from "vitest";
import { activityOf, canWithdrawIn, phaseOf, POSITION, showsVisibilityIn, stepsFor, VISIBILITY, type Phase } from "../phase";
import type { LawyerRequest } from "../api";

const lawyer = (name: string) => ({ id: name, name }) as never;
const quote = (sentAt: string) => ({ type: "FIXED_FEE", amount: { amountMinor: 50000, currency: "GBP" }, sentAt }) as never;

const request = (over: Partial<LawyerRequest> = {}): LawyerRequest =>
  ({
    id: "r1",
    status: "REQUESTED",
    createdAt: "2026-11-01T09:00:00Z",
    lawyers: [],
    lawyer: null,
    engagedAt: null,
    closedAt: null,
    closedBy: null,
    ...over,
  }) as LawyerRequest;

describe("phaseOf", () => {
  it("maps each status to a phase, folding withdrawn into expired", () => {
    const phases = Object.fromEntries(
      (["REQUESTED", "ROUTED", "CLAIMED", "QUOTED", "CONFIRMED", "ENGAGED", "CLOSED", "EXPIRED", "WITHDRAWN"] as const).map((s) => [s, phaseOf(request({ status: s }))]),
    );
    expect(phases).toEqual({
      REQUESTED: "sent",
      ROUTED: "finding",
      CLAIMED: "reviewing",
      QUOTED: "quote",
      CONFIRMED: "finalising",
      ENGAGED: "engaged",
      CLOSED: "closed",
      EXPIRED: "expired",
      WITHDRAWN: "expired",
    });
  });

  it("puts every phase on the five-step line", () => {
    const phases: Phase[] = ["sent", "finding", "reviewing", "quote", "finalising", "engaged", "closed", "expired"];
    for (const p of phases) expect(POSITION[p]).toBeGreaterThanOrEqual(0);
    expect(POSITION.closed).toBe(5);
    expect(POSITION.expired).toBe(POSITION.finding);
  });
});

describe("stepsFor", () => {
  it("always has five steps", () => {
    expect(stepsFor(request(), "sent")).toHaveLength(5);
  });

  it("counts the lawyers reviewing and the quotes to compare", () => {
    const r = request({
      lawyers: [
        { claimId: "1", joinedAt: "2026-11-01T10:00:00Z", lawyer: lawyer("A"), quote: quote("2026-11-01T12:00:00Z") },
        { claimId: "2", joinedAt: "2026-11-01T11:00:00Z", lawyer: lawyer("B"), quote: quote("2026-11-01T13:00:00Z") },
      ] as never,
    });
    const steps = stepsFor(r, "quote");
    expect(steps[2]!.label).toBe("2 lawyers are reviewing");
    expect(steps[3]!.label).toBe("Compare the quotes");
  });

  it("says nobody picked it up when the request expired", () => {
    expect(stepsFor(request(), "expired")[1]!.label).toBe("No lawyer picked it up");
  });

  it("names the lawyer being finalised with", () => {
    const r = request({ lawyer: { name: "Priya Patel" } as never });
    expect(stepsFor(r, "finalising")[4]!.label).toBe("Finalising with Priya");
  });
});

describe("activityOf", () => {
  it("lists what happened, oldest first", () => {
    const r = request({
      lawyers: [{ claimId: "1", joinedAt: "2026-11-01T10:00:00Z", lawyer: lawyer("Asha Rao"), quote: quote("2026-11-01T12:00:00Z") }] as never,
      lawyer: { name: "Asha Rao" } as never,
      engagedAt: "2026-11-02T09:00:00Z",
      closedAt: "2026-11-05T09:00:00Z",
      closedBy: "LAWYER",
    });
    expect(activityOf(r).map((e) => e.text)).toEqual([
      "You sent your request",
      "Asha Rao took up your request",
      "Asha Rao sent a £500 quote",
      "You confirmed Asha Rao, who can now see your case",
      "Your lawyer ended the engagement",
    ]);
  });
});

describe("VISIBILITY and phase flags", () => {
  it("shows the case as visible only once engaged", () => {
    expect(VISIBILITY(false).map((v) => v.yes)).toEqual([true, true, false]);
    expect(VISIBILITY(true, "2026-11-02T09:00:00Z")[2]).toMatchObject({ yes: true, when: expect.stringMatching(/^Since /) });
    expect(VISIBILITY(true)[2]!.when).toBe("Now");
  });

  it("allows withdrawing only before the engagement, and hides visibility once it is over", () => {
    expect(canWithdrawIn("quote")).toBe(true);
    expect(canWithdrawIn("finalising")).toBe(false);
    expect(canWithdrawIn("engaged")).toBe(false);
    expect(showsVisibilityIn("engaged")).toBe(true);
    expect(showsVisibilityIn("closed")).toBe(false);
    expect(showsVisibilityIn("expired")).toBe(false);
  });
});
