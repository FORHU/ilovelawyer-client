import { describe, expect, it } from "vitest";
import { areaName } from "../types";

describe("areaName", () => {
  it("shows a KR area's Korean part in Korean and its bracketed English part in English", () => {
    expect(areaName("부동산·임대차 (Real Estate and Leases)", "ko")).toBe("부동산·임대차");
    expect(areaName("부동산·임대차 (Real Estate and Leases)", "en")).toBe("Real Estate and Leases");
  });

  it("leaves any other name as it is", () => {
    expect(areaName("Employment", "en")).toBe("Employment");
    expect(areaName("Debt (consumer)", "ko")).toBe("Debt (consumer)");
    expect(areaName("부동산", "en")).toBe("부동산");
  });
});
