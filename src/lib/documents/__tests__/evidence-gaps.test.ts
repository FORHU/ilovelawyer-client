import { describe, it, expect } from "vitest";
import { documentSyncLabel, gapForDocument, nextSuggestedGap } from "../evidence-gaps";
import type { CaseDocument, CaseIntake, IntakeGap } from "@/lib/types";

const doc = (over: Partial<CaseDocument> = {}): CaseDocument =>
  ({ id: "d1", name: "evidence.png", status: "READY", size: 1000, uploadedAt: "2026-11-01T00:00:00Z", createdAt: "2026-11-01T00:00:00Z", ...over }) as CaseDocument;

const gap = (id: string, question = `Question ${id}`): IntakeGap => ({ id, question, why: `Why ${id}` });

const intake = (missing: IntakeGap[]): CaseIntake =>
  ({ missing }) as CaseIntake;

describe("documentSyncLabel", () => {
  it("prefers the relabeled syncStatus when the API sends it", () => {
    expect(documentSyncLabel(doc({ syncStatus: "uploading" }))).toBe("Uploading…");
    expect(documentSyncLabel(doc({ syncStatus: "processing" }))).toBe("Processing…");
    expect(documentSyncLabel(doc({ syncStatus: "done" }))).toBe("Ready");
    expect(documentSyncLabel(doc({ syncStatus: "failed" }))).toBe("Couldn't be read");
  });

  it("falls back to the existing status when syncStatus is absent", () => {
    expect(documentSyncLabel(doc({ status: "PENDING" }))).toBe("Processing…");
    expect(documentSyncLabel(doc({ status: "READY" }))).toBe("Ready");
    expect(documentSyncLabel(doc({ status: "FAILED" }))).toBe("Couldn't be read");
  });
});

describe("gapForDocument", () => {
  it("finds the gap a document resolved", () => {
    const i = intake([gap("g1"), gap("g2")]);
    expect(gapForDocument(doc({ filledGapId: "g2" }), i)?.id).toBe("g2");
  });

  it("returns null when the document fills no gap, or the gap no longer exists", () => {
    const i = intake([gap("g1")]);
    expect(gapForDocument(doc({ filledGapId: null }), i)).toBeNull();
    expect(gapForDocument(doc({ filledGapId: "gone" }), i)).toBeNull();
    expect(gapForDocument(doc({ filledGapId: "g1" }), undefined)).toBeNull();
  });
});

describe("nextSuggestedGap", () => {
  it("suggests the first open gap nothing has resolved yet", () => {
    const i = intake([gap("g1"), gap("g2")]);
    expect(nextSuggestedGap(i, [doc({ filledGapId: "g1" })])?.id).toBe("g2");
  });

  it("returns null once every gap is resolved, or there's nothing missing", () => {
    const i = intake([gap("g1")]);
    expect(nextSuggestedGap(i, [doc({ filledGapId: "g1" })])).toBeNull();
    expect(nextSuggestedGap(intake([]), [])).toBeNull();
    expect(nextSuggestedGap(undefined, [])).toBeNull();
  });
});
