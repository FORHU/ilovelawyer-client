import { describe, it, expect } from "vitest";
import { documentSyncLabel, gapForDocument, nextSuggestedGap } from "../evidence-gaps";
import type { CaseDocument, MissingEvidenceItem, MissingEvidenceResponse } from "@/lib/types";

const doc = (over: Partial<CaseDocument> = {}): CaseDocument =>
  ({ id: "d1", name: "evidence.png", status: "READY", size: 1000, uploadedAt: "2026-11-01T00:00:00Z", createdAt: "2026-11-01T00:00:00Z", ...over }) as CaseDocument;

const gap = (id: string, over: Partial<MissingEvidenceItem> = {}): MissingEvidenceItem => ({
  id,
  label: `Label ${id}`,
  detail: `Detail ${id}`,
  severity: "MODERATE",
  suggestedSource: null,
  filledByDocumentId: null,
  filledAt: null,
  ...over,
});

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
  it("finds the gap whose filledByDocumentId is this document", () => {
    const gaps = [gap("g1"), gap("g2", { filledByDocumentId: "d1" })];
    expect(gapForDocument(doc({ id: "d1" }), gaps)?.id).toBe("g2");
  });

  it("returns null when no gap points at this document, or the list is absent", () => {
    expect(gapForDocument(doc({ id: "d1" }), [gap("g1")])).toBeNull();
    expect(gapForDocument(doc({ id: "d1" }), [gap("g1", { filledByDocumentId: "d2" })])).toBeNull();
    expect(gapForDocument(doc({ id: "d1" }), undefined)).toBeNull();
  });
});

describe("nextSuggestedGap", () => {
  const response = (gaps: MissingEvidenceItem[], suggestion: MissingEvidenceResponse["suggestion"]): MissingEvidenceResponse => ({ gaps, suggestion });

  it("resolves CW's suggestion against the gap it names", () => {
    const gaps = [gap("g1"), gap("g2")];
    expect(nextSuggestedGap(response(gaps, { gapId: "g2", message: "Upload your payslip" }))?.id).toBe("g2");
  });

  it("returns null when there's no suggestion, or it's absent entirely", () => {
    expect(nextSuggestedGap(response([gap("g1")], null))).toBeNull();
    expect(nextSuggestedGap(undefined)).toBeNull();
  });

  it("returns null (defensively) if the suggestion names a gap not in the list", () => {
    expect(nextSuggestedGap(response([gap("g1")], { gapId: "gone", message: "..." }))).toBeNull();
  });
});
