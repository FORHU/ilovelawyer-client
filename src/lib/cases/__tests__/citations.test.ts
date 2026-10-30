import { describe, it, expect } from "vitest";
import { citationsByDocument } from "../citations";
import type { CaseIntake, IntakeSource } from "@/lib/types";

const doc = (documentId: string): IntakeSource => ({ kind: "DOCUMENT", messageId: null, documentId, documentName: "x.pdf", page: 1 });
const client: IntakeSource = { kind: "CLIENT", messageId: "m1", documentId: null, documentName: null, page: null };

const intake = (over: Partial<CaseIntake>): CaseIntake =>
  ({
    generatedAt: null, status: "READY", updates: { allowed: true, leftToday: 3 }, summary: null,
    people: [], timeline: [], facts: [], goals: [], concerns: [], questionsForLawyer: [], deadlines: [], missing: [], conflicts: [],
    completeness: null,
    ...over,
  }) as CaseIntake;

describe("citationsByDocument", () => {
  it("is empty without an intake", () => {
    expect(citationsByDocument(undefined).size).toBe(0);
  });

  it("lists each item that cites a document, labelled by section", () => {
    const m = citationsByDocument(
      intake({
        timeline: [{ id: "t1", text: "Dismissed by letter", date: "2026-03-06", datePrecision: "DAY", sources: [doc("d1"), client] }],
        facts: [{ id: "f1", text: "loss of trust", sources: [doc("d1")] }],
      }),
    );
    expect(m.get("d1")?.map((c) => c.label)).toEqual(["Timeline · 6 Mar 2026", "Key fact · “loss of trust”"]);
  });

  it("counts an item once however many times it cites the same document", () => {
    const m = citationsByDocument(intake({ facts: [{ id: "f1", text: "a", sources: [doc("d1"), doc("d1")] }] }));
    expect(m.get("d1")).toHaveLength(1);
  });

  it("ignores sources that are not documents", () => {
    expect(citationsByDocument(intake({ facts: [{ id: "f1", text: "a", sources: [client] }] })).size).toBe(0);
  });
});
