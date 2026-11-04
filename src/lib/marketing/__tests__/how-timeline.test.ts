import { describe, expect, it } from "vitest";
import { HOW_HEADINGS, HOW_OPENING_D, headingOpacity, heroExit, howPose, howScene, paperFlight, phoneTarget, type HowLayout } from "../how-timeline";

const desktop: HowLayout = { W: 1440, H: 900, mob: false, headingH: 61, leftW: 480, rightW: 480 };
const phone: HowLayout = { W: 390, H: 844, mob: true, headingH: 60, leftW: 358, rightW: 358 };

describe("howScene", () => {
  it("steps through the six screens in order", () => {
    expect([0, 2, 3, 4, 5, 6].map(howScene)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("changes screen exactly at each boundary", () => {
    expect(howScene(1.97)).toBe(0);
    expect(howScene(1.98)).toBe(1);
    expect(howScene(5.4)).toBe(5);
  });
});

describe("howPose", () => {
  it("starts with the phone below the screen and nothing else showing", () => {
    const p = howPose(-1, desktop);
    expect(p.phone.y).toBeGreaterThan(desktop.H * 0.6);
    expect(p.desk.opacity).toBe(0);
    expect(p.intro.opacity).toBe(0);
    expect(p.terminal.opacity).toBe(0);
    expect(p.headings.every((v) => v === 0)).toBe(true);
  });

  it("centres the phone once the section fills the screen", () => {
    const p = howPose(0, desktop);
    expect(p.phone.x).toBeCloseTo(0);
    expect(p.phone.y).toBeCloseTo(0);
    expect(p.phone.opacity).toBe(1);
  });

  it("shows the intro, then clears it for the laptop", () => {
    expect(howPose(0.7, desktop).intro.opacity).toBe(1);
    expect(howPose(0.7, desktop).intro.interactive).toBe(true);
    expect(howPose(1, desktop).intro.opacity).toBe(0);
    expect(howPose(1, desktop).intro.interactive).toBe(false);
  });

  it("lands How it works links on the opening line, on both layouts", () => {
    for (const layout of [desktop, phone]) {
      expect(howPose(HOW_OPENING_D, layout).intro.opacity).toBe(1);
      expect(howPose(HOW_OPENING_D, layout).intro.interactive).toBe(true);
    }
  });

  it("removes the phone once the case is on the laptop", () => {
    expect(howPose(3, desktop).phone.opacity).toBe(0);
    expect(howPose(3, desktop).desk.opacity).toBe(1);
  });

  it("shows one client and solicitor photo pair at a time", () => {
    for (const d of [3.4, 4.2, 5, 5.8]) {
      const shown = howPose(d, desktop).photos.pair.filter((v) => v > 0.99);
      expect(shown).toHaveLength(1);
    }
  });

  it("swaps the laptop for the terminal, whose image always covers the screen", () => {
    for (const layout of [desktop, phone]) {
      const p = howPose(7, layout);
      expect(p.desk.opacity).toBe(0);
      expect(p.terminal.opacity).toBe(1);
      expect(p.terminal.x).toBeLessThanOrEqual(0);
      expect(p.terminal.y).toBeLessThanOrEqual(0);
    }
  });

  it("walks the four monitors in order, one caption at a time", () => {
    expect([6.5, 6.7, 7.0, 7.4, 7.7, 7.95].map((d) => howPose(d, desktop).terminal.monitor)).toEqual([-1, 0, 1, 2, 3, -1]);
    for (const d of [6.8, 7.1, 7.45, 7.8]) expect(howPose(d, desktop).terminal.captions.filter((v) => v > 0)).toHaveLength(1);
  });

  it("never leaves an empty black screen before the next section", () => {
    for (let d = 6.5; d <= 9; d += 0.05) {
      const p = howPose(d, desktop);
      expect(p.terminal.opacity).toBe(1);
      expect(p.headings.at(-1)).toBe(1);
    }
  });

  it("keeps the photos inside the screen on a phone", () => {
    const { photos } = howPose(4, phone);
    expect(photos.leftX).toBeGreaterThanOrEqual(0);
    expect(photos.rightX + photos.w).toBeLessThanOrEqual(phone.W);
    expect(photos.top).toBeGreaterThanOrEqual(0);
  });
});

describe("headings", () => {
  it("shows at most one heading at any point in the story", () => {
    for (let d = -1; d < 8.4; d += 0.01) {
      const visible = HOW_HEADINGS.filter((h) => headingOpacity(d, h.at) > 0);
      expect(visible.length).toBeLessThanOrEqual(1);
    }
  });
});

describe("the hero's papers", () => {
  const from = { x: 100, y: 200, r: 8, s: 0.9 };
  const H = 900;

  it("rest until the story starts arriving", () => {
    expect(paperFlight(3, heroExit(-1), phoneTarget(-1, 1440, H, false), from, H)).toBeNull();
  });

  it("are all gone into the phone just after the story fills the screen", () => {
    for (let k = 0; k < 22; k++) {
      const flight = paperFlight(k, heroExit(0.25), phoneTarget(0.25, 1440, H, false), from, H);
      expect(flight?.opacity).toBeCloseTo(0);
    }
  });

  it("retrace the same path when scrubbed back", () => {
    const at = () => paperFlight(7, heroExit(-0.4), phoneTarget(-0.4, 1440, H, false), from, H);
    expect(at()).toEqual(at());
  });

  it("aim for the phone, centred horizontally", () => {
    expect(phoneTarget(0, 1440, H, false).x).toBe(720);
  });
});
