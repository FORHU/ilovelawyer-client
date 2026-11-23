import { describe, expect, it } from "vitest";
import { FAILED, appendSpoken, clock, liveTranscript, refusalMessage } from "../live-dictation";
import { PcmDownsampler } from "../pcm";

describe("PcmDownsampler", () => {
  it("turns 48 kHz into a third as many 16 kHz samples", () => {
    const down = new PcmDownsampler(48_000);
    expect(down.push(new Float32Array(4800)).length).toBe(1600);
  });

  it("carries a part sample over to the next block, so nothing is lost or doubled", () => {
    // 44.1 kHz doesn't divide evenly into 16 kHz: over a second, blocks of any size still add up.
    const down = new PcmDownsampler(44_100);
    let total = 0;
    for (let i = 0; i < 441; i++) total += down.push(new Float32Array(100)).length;
    expect(Math.abs(total - 16_000)).toBeLessThanOrEqual(1);
  });

  it("averages each output sample's span and scales it to 16-bit", () => {
    const down = new PcmDownsampler(32_000);
    const out = down.push(new Float32Array([1, 1, -1, -1, 0.5, 0, 1, -1]));
    expect(Array.from(out)).toEqual([32767, -32768, Math.round(0.25 * 32767), 0]);
  });

  it("clips anything past full scale instead of wrapping round", () => {
    const down = new PcmDownsampler(16_000);
    expect(Array.from(down.push(new Float32Array([2, -2])))).toEqual([32767, -32768]);
  });

  it("refuses a rate below what the API takes", () => {
    expect(() => new PcmDownsampler(8_000)).toThrow();
  });
});

describe("live dictation text", () => {
  it("shows the finished stretches, then the one still being spoken", () => {
    expect(liveTranscript(["I was fired."], "My employer")).toBe("I was fired. My employer");
    expect(liveTranscript([], "  ")).toBe("");
    expect(liveTranscript(["One.", " Two. "], "")).toBe("One. Two.");
  });

  it("adds spoken words after what was typed, never in place of it", () => {
    expect(appendSpoken("", "I was fired.")).toBe("I was fired.");
    expect(appendSpoken("My landlord  ", "won't fix the boiler.")).toBe("My landlord won't fix the boiler.");
    expect(appendSpoken("Typed.", "   ")).toBe("Typed.");
  });

  it("shows the time as minutes and seconds", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(7.9)).toBe("0:07");
    expect(clock(179)).toBe("2:59");
  });

  it("shows the API's reason for a refused start, or a general one", () => {
    expect(refusalMessage({ ok: false, message: "This needs your consent, which is switched off.", code: "CONSENT_REQUIRED" })).toBe(
      "This needs your consent, which is switched off.",
    );
    expect(refusalMessage({ ok: false })).toBe(FAILED);
    expect(refusalMessage(null)).toBe(FAILED);
  });
});
