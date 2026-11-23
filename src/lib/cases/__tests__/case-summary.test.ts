import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/fetch";
import { translate } from "@/lib/i18n/translate";
import type { CaseIntake, IntakeStatus } from "@/lib/types";
import { caseSummaryFilename, summaryAvailability, summaryProblemOf } from "../case-summary";

const en = (key: string, vars?: Record<string, string | number>) => translate("en", key, vars);

function intake(status: IntakeStatus, generatedAt: string | null): CaseIntake {
  return {
    generatedAt,
    status,
    updates: { allowed: true, leftToday: 3 },
    summary: null,
    people: [],
    timeline: [],
    facts: [],
    goals: [],
    concerns: [],
    questionsForLawyer: [],
    deadlines: [],
    missing: [],
    conflicts: [],
    completeness: null,
  };
}

const AT = "2026-11-18T09:00:00.000Z";

describe("summaryAvailability", () => {
  it.each([
    ["READY", AT, "ready"],
    ["STALE", AT, "ready"],
    ["FAILED", AT, "ready"],
    ["RUNNING", AT, "preparing"],
    ["RUNNING", null, "preparing"],
    ["EMPTY", null, "empty"],
    ["FAILED", null, "empty"],
    ["READY", null, "empty"],
  ] as const)("%s with generatedAt %s is %s", (status, generatedAt, expected) => {
    expect(summaryAvailability(intake(status, generatedAt))).toBe(expected);
  });

  it("leaves it to the API when nothing is cached", () => {
    expect(summaryAvailability(undefined)).toBe("unknown");
  });
});

describe("summaryProblemOf", () => {
  it("reads INTAKE_EMPTY as nothing to summarise yet", () => {
    const problem = summaryProblemOf(new ApiError("Nothing yet", 409, "INTAKE_EMPTY"), en);
    expect(problem).toEqual({ tone: "info", text: "There's nothing to put in a case summary yet. Tell us about your case in the chat first." });
  });

  it("reads INTAKE_RUNNING as still being prepared", () => {
    const problem = summaryProblemOf(new ApiError("Running", 409, "INTAKE_RUNNING"), en);
    expect(problem).toEqual({ tone: "info", text: "Your overview is still being prepared. Try again in a moment." });
  });

  it("says the case can't be found on the API's own 404 (another client's case)", () => {
    const err = new ApiError("Case not found", 404, undefined, { message: "Case not found" });
    expect(summaryProblemOf(err, en)).toEqual({ tone: "error", text: "We couldn't find this case." });
  });

  it("doesn't blame the case when the route itself is missing (Express's HTML 404)", () => {
    const err = new ApiError("Request failed", 404, undefined, {});
    expect(summaryProblemOf(err, en)).toEqual({ tone: "error", text: "Couldn't prepare your case summary. Try again." });
  });

  it.each([0, 500, 503])("keeps apiFetch's own message for status %i", (status) => {
    expect(summaryProblemOf(new ApiError("Couldn't reach ilovelawyer.", status), en)).toEqual({ tone: "error", text: "Couldn't reach ilovelawyer." });
  });

  it("falls back to a generic message for anything else", () => {
    const generic = { tone: "error", text: "Couldn't prepare your case summary. Try again." };
    expect(summaryProblemOf(new ApiError("Bad request", 400), en)).toEqual(generic);
    expect(summaryProblemOf(new Error("boom"), en)).toEqual(generic);
  });

  it("translates for a Korean viewer", () => {
    const ko = (key: string) => translate("ko", key);
    expect(summaryProblemOf(new ApiError("x", 409, "INTAKE_RUNNING"), ko).text).toBe("개요를 아직 준비하고 있습니다. 잠시 후 다시 시도하세요.");
  });
});

describe("caseSummaryFilename", () => {
  const now = new Date("2026-11-20T10:00:00.000Z");

  it("slugs the title and dates the file", () => {
    expect(caseSummaryFilename("Landlord won't return my deposit!", now)).toBe("case-summary-landlord-won-t-return-my-deposit-2026-11-20.pdf");
  });

  it("keeps letters of any script", () => {
    expect(caseSummaryFilename("전세 보증금 반환", now)).toBe("case-summary-전세-보증금-반환-2026-11-20.pdf");
  });

  it("strips path and reserved characters", () => {
    expect(caseSummaryFilename("../a/b:c*?\"<>|", now)).toBe("case-summary-a-b-c-2026-11-20.pdf");
  });

  it("falls back when nothing is left of the title", () => {
    expect(caseSummaryFilename("   ***  ", now)).toBe("case-summary-case-2026-11-20.pdf");
  });

  it("caps a long title without a trailing dash", () => {
    const name = caseSummaryFilename(`${"a".repeat(59)} ${"b".repeat(20)}`, now);
    expect(name).toBe(`case-summary-${"a".repeat(59)}-2026-11-20.pdf`);
  });
});
