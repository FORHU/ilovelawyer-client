import { describe, it, expect } from "vitest";
import { resolveClientSite, siteForHost } from "../resolve-host";

describe("resolveClientSite", () => {
  it("maps each local client host to its site, with or without the port", () => {
    expect(resolveClientSite("uk-client.ilovelawyer.localhost:3004")).toBe("UK");
    expect(resolveClientSite("ph-client.ilovelawyer.localhost:3004")).toBe("PH");
    expect(resolveClientSite("kr-client.ilovelawyer.localhost")).toBe("KR");
  });

  it("maps the https local, hosted dev and production hosts", () => {
    expect(resolveClientSite("kr-client-local.ilovelawyer.com:3004")).toBe("KR");
    expect(resolveClientSite("ph-client-dev.ilovelawyer.com")).toBe("PH");
    expect(resolveClientSite("uk-client.ilovelawyer.com")).toBe("UK");
  });

  it("ignores case and surrounding space", () => {
    expect(resolveClientSite(" KR-Client.ilovelawyer.localhost:3004 ")).toBe("KR");
  });

  it("doesn't take a lawyer host, a lookalike or an unknown host for a client site", () => {
    expect(resolveClientSite("uk.ilovelawyer.local:3002")).toBeNull();
    expect(resolveClientSite("kr-dev.ilovelawyer.com")).toBeNull();
    expect(resolveClientSite("kr-client.ilovelawyer.localhost.evil.com")).toBeNull();
    expect(resolveClientSite("localhost:3004")).toBeNull();
    expect(resolveClientSite("")).toBeNull();
    expect(resolveClientSite(null)).toBeNull();
  });
});

describe("siteForHost", () => {
  it("shows the UK on any host that isn't a site's own, as before there were three", () => {
    expect(siteForHost("localhost:3004")).toBe("UK");
    expect(siteForHost("client-local.ilovelawyer.com:3004")).toBe("UK");
    expect(siteForHost("ilovelawyer.com")).toBe("UK");
    expect(siteForHost(undefined)).toBe("UK");
  });

  it("shows a site's own host as that site", () => {
    expect(siteForHost("kr-client.ilovelawyer.localhost:3004")).toBe("KR");
  });
});
