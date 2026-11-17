import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/fetch";
import { wrongTenantSite } from "@/lib/auth/errors";
import { getClientTerms } from "@/lib/auth/terms";
import { hostForClientTenant, resolveClientTenantCode } from "../client-tenant";

describe("resolveClientTenantCode", () => {
  it("maps each client site to its region, port ignored", () => {
    expect(resolveClientTenantCode("kr.ilovelawyer.com")).toBe("KR");
    expect(resolveClientTenantCode("kr-app.ilovelawyer.com")).toBe("KR");
    expect(resolveClientTenantCode("kr-client-local.ilovelawyer.com:3004")).toBe("KR");
    expect(resolveClientTenantCode("ilovelawyer.com")).toBe("UK");
    expect(resolveClientTenantCode("app.ilovelawyer.com")).toBe("UK");
    expect(resolveClientTenantCode("localhost:3004")).toBe("UK");
  });

  it("is case-insensitive and falls back to UK for an unknown or missing host", () => {
    expect(resolveClientTenantCode("KR.ILOVELAWYER.COM")).toBe("KR");
    expect(resolveClientTenantCode("evil.example.com")).toBe("UK");
    expect(resolveClientTenantCode("kr.ilovelawyer.com.evil.com")).toBe("UK");
    expect(resolveClientTenantCode(null)).toBe("UK");
    expect(resolveClientTenantCode(undefined)).toBe("UK");
  });
});

describe("hostForClientTenant", () => {
  it("keeps the hosting flavour and the port", () => {
    expect(hostForClientTenant("KR", "ilovelawyer.com")).toBe("kr.ilovelawyer.com");
    expect(hostForClientTenant("UK", "kr.ilovelawyer.com")).toBe("ilovelawyer.com");
    expect(hostForClientTenant("KR", "app.ilovelawyer.com")).toBe("kr-app.ilovelawyer.com");
    expect(hostForClientTenant("UK", "kr-app.ilovelawyer.com")).toBe("app.ilovelawyer.com");
    expect(hostForClientTenant("KR", "client-local.ilovelawyer.com:3004")).toBe("kr-client-local.ilovelawyer.com:3004");
    expect(hostForClientTenant("UK", "kr-client-local.ilovelawyer.com:3004")).toBe("client-local.ilovelawyer.com:3004");
  });

  it("gives null for an unknown host or a region with no site", () => {
    expect(hostForClientTenant("KR", "evil.example.com")).toBeNull();
    expect(hostForClientTenant("PH", "ilovelawyer.com")).toBeNull();
    expect(hostForClientTenant("KR", "localhost:3004")).toBeNull();
  });
});

describe("wrongTenantSite", () => {
  it("reads the account's site off a WRONG_TENANT error", () => {
    expect(wrongTenantSite(new ApiError("nope", 409, "WRONG_TENANT", { site: "KR" }))).toBe("KR");
  });

  it("is null for other errors and for a site it doesn't know", () => {
    expect(wrongTenantSite(new ApiError("nope", 409, "WRONG_APP", { site: "KR" }))).toBeNull();
    expect(wrongTenantSite(new ApiError("nope", 409, "WRONG_TENANT", { site: "XX" }))).toBeNull();
    expect(wrongTenantSite(new Error("x"))).toBeNull();
  });
});

describe("getClientTerms governing law", () => {
  it("names the site's law for UK and falls back to the generic paragraph for KR", () => {
    expect(getClientTerms("UK").effectiveDate).toContain("England and Wales");
    const kr = getClientTerms("KR");
    expect(kr.effectiveDate).not.toContain("Governing law");
    expect(kr.sections.at(-1)?.paragraphs[0]).toContain("country of the ilovelawyer site");
  });
});
