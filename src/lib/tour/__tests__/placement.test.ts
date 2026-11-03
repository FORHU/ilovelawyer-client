import { describe, expect, it } from "vitest";
import { CARD_WIDTH, placeCard, rectMoved, sheetAtTop, type Rect } from "../placement";

const W = 1280;
const H = 800;
const rect = (over: Partial<Rect>): Rect => ({ x: 600, y: 300, w: 100, h: 40, radius: 8, ...over });

describe("placeCard", () => {
  it("puts the card under the target, centred on it, when that side is preferred and fits", () => {
    const { left, top } = placeCard(rect({}), 190, "bottom", W, H);
    expect(left).toBe(650 - CARD_WIDTH / 2);
    expect(top).toBe(300 + 40 + 16);
  });

  it("falls back to another side when the preferred one has no room", () => {
    const r = rect({ y: 640 });
    const { top } = placeCard(r, 190, "bottom", W, H);
    expect(top + 190).toBeLessThanOrEqual(r.y);
  });

  it("keeps the card inside the screen edges", () => {
    const { left } = placeCard(rect({ x: 1230, w: 40 }), 190, "bottom", W, H);
    expect(left).toBe(W - CARD_WIDTH - 16);
  });

  it("docks to a corner when no side fits", () => {
    const { left } = placeCard(rect({ x: 20, y: 20, w: 1240, h: 700 }), 190, "bottom", W, H);
    expect(left).toBeGreaterThanOrEqual(16);
  });
});

describe("sheetAtTop", () => {
  it("is at the top when the target is in the lower half", () => {
    expect(sheetAtTop(rect({ y: 600 }), 677)).toBe(true);
    expect(sheetAtTop(rect({ y: 100 }), 677)).toBe(false);
  });
});

describe("rectMoved", () => {
  it("ignores sub-pixel jitter", () => {
    expect(rectMoved(rect({}), rect({ x: 600.3 }))).toBe(false);
    expect(rectMoved(rect({}), rect({ x: 602 }))).toBe(true);
    expect(rectMoved(null, rect({}))).toBe(true);
  });
});
