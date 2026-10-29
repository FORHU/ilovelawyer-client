import { describe, it, expect } from "vitest";
import { withLawyers, type LawyerRequest } from "../api";

const lawyer = { id: "l1", name: "Lena", regulator: null, qualifiedJurisdictions: [], practiceAreas: [], languages: [], bio: "", firstConsultationFee: null } as unknown as NonNullable<LawyerRequest["lawyer"]>;
const quote = { type: "FIXED_FEE", amount: { amountMinor: 50_000, currency: "GBP" }, message: "Fixed fee.", sentAt: "2026-10-29T10:00:00Z" } as const;
const base = { id: "r1", caseId: "c1", status: "QUOTED", createdAt: "2026-10-29T09:00:00Z", lawyer, quote } as unknown as LawyerRequest;

describe("withLawyers", () => {
  it("leaves a request from the several-lawyers API as it is", () => {
    const r = { ...base, lawyers: [], pickByAt: null };
    expect(withLawyers(r)).toBe(r);
  });

  it("turns an older API's one lawyer and quote into the list, with no claimId", () => {
    const r = withLawyers(base);
    expect(r.lawyers).toEqual([{ claimId: "", joinedAt: base.createdAt, lawyer, quote }]);
    expect(r.pickByAt).toBe(null);
  });

  it("gives an older API's request with no lawyer yet an empty list", () => {
    expect(withLawyers({ ...base, lawyer: null, quote: null }).lawyers).toEqual([]);
  });
});
