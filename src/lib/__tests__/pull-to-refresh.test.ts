import { describe, it, expect } from "vitest";
import { PULL_MAX, PULL_THRESHOLD, canStartPull, pullDistance, reachedThreshold } from "../pull-to-refresh";

describe("pullDistance", () => {
  it("is no pull for upward or zero movement", () => {
    expect(pullDistance(0)).toBe(0);
    expect(pullDistance(-40)).toBe(0);
    expect(pullDistance(NaN)).toBe(0);
  });

  it("follows the finger with resistance and stops at the maximum", () => {
    expect(pullDistance(40)).toBe(20);
    expect(pullDistance(10_000)).toBe(PULL_MAX);
  });
});

describe("canStartPull", () => {
  it("only starts from the top of the scroller", () => {
    expect(canStartPull(0)).toBe(true);
    expect(canStartPull(1)).toBe(false);
    expect(canStartPull(240)).toBe(false);
  });
});

describe("reachedThreshold", () => {
  it("refreshes only once the pull is long enough", () => {
    expect(reachedThreshold(PULL_THRESHOLD - 1)).toBe(false);
    expect(reachedThreshold(PULL_THRESHOLD)).toBe(true);
  });
});
