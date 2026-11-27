import { describe, expect, it } from "vitest";
import { caseFileOf } from "../case-file";
import type { IntakeFormFields } from "@/lib/types";

const fields = (over: Partial<IntakeFormFields> = {}): IntakeFormFields => ({
  parties: [],
  witnesses: [],
  typeOfAction: [],
  venue: null,
  timeline: [],
  clientGoals: [],
  relationship: [],
  roleAndTerms: [],
  reasonGiven: [],
  missing: [],
  ...over,
});

const current = (id: string) => ({ id, detail: id.split(".")[0] as never, question: "?", why: "", chips: [], followUp: id.includes(".") });

describe("caseFileOf", () => {
  it("shows an answer as soon as it's given, in the client's words", () => {
    const rows = caseFileOf(
      { history: [{ id: "otherSide", question: "Who?", why: "", answer: "ABC Corporation", skipped: false }], current: current("reasonGiven") },
      fields(),
    );
    expect(rows).toEqual([
      { detail: "otherSide", label: "The other side", value: "ABC Corporation", state: "filled" },
      { detail: "reasonGiven", label: "Reason given", value: null, state: "asking" },
    ]);
  });

  it("joins a detail's follow-up to its answer", () => {
    const rows = caseFileOf(
      {
        history: [
          { id: "terms", question: "Your job?", why: "", answer: "Driver", skipped: false },
          { id: "terms.followUp", question: "Pay?", why: "", answer: "₩3,000,000 a month", skipped: false },
        ],
        current: null,
      },
      null,
    );
    expect(rows).toEqual([{ detail: "terms", label: "Your role and pay", value: "Driver · ₩3,000,000 a month", state: "filled" }]);
  });

  it("fills what the story already told, and marks a skipped detail", () => {
    const rows = caseFileOf(
      { history: [{ id: "witnesses", question: "Anyone saw?", why: "", answer: null, skipped: true }], current: null },
      fields({ parties: [{ id: "p", text: "", sources: [], name: "Acme Logistics", role: "the employer" }], venue: "Seoul" }),
    );
    expect(rows.map((r) => [r.detail, r.value, r.state])).toEqual([
      ["otherSide", "Acme Logistics", "filled"],
      ["place", "Seoul", "filled"],
      ["witnesses", null, "skipped"],
    ]);
  });

  it("lists nothing before anything is known", () => {
    expect(caseFileOf(null, null)).toEqual([]);
    expect(caseFileOf({ history: [], current: null }, fields())).toEqual([]);
  });
});
