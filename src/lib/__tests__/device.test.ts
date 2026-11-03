import { describe, expect, it } from "vitest";
import { deviceFromUserAgent } from "../device";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

describe("deviceFromUserAgent", () => {
  it("treats phones as mobile", () => {
    expect(deviceFromUserAgent(IPHONE)).toBe("mobile");
    expect(deviceFromUserAgent(ANDROID_PHONE)).toBe("mobile");
  });

  it("treats tablets and desktops as desktop", () => {
    expect(deviceFromUserAgent(IPAD)).toBe("desktop");
    expect(deviceFromUserAgent(ANDROID_TABLET)).toBe("desktop");
    expect(deviceFromUserAgent(DESKTOP)).toBe("desktop");
  });

  it("falls back to desktop with no UA", () => {
    expect(deviceFromUserAgent(null)).toBe("desktop");
    expect(deviceFromUserAgent(undefined)).toBe("desktop");
  });

  it("lets Sec-CH-UA-Mobile win over the UA string", () => {
    expect(deviceFromUserAgent(DESKTOP, "?1")).toBe("mobile");
    expect(deviceFromUserAgent(IPHONE, "?0")).toBe("desktop");
  });
});
