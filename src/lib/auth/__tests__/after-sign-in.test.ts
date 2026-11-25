import { describe, expect, it } from "vitest";
import { FIRST_CASE_PATH, ONBOARDING_PRIVACY_PATH, SIGNED_IN_PATH, afterSignInPath } from "../after-sign-in";

describe("afterSignInPath", () => {
  it("takes an account made just now on to the privacy step, where the site has the story-first way in", () => {
    expect(afterSignInPath({ isNewAccount: true, hasCases: false, storyIntake: true, searchText: null })).toBe(ONBOARDING_PRIVACY_PATH);
    // A problem typed on the landing page waits for the story screen, after the privacy step.
    expect(afterSignInPath({ isNewAccount: true, hasCases: false, storyIntake: true, searchText: "I was fired" })).toBe(ONBOARDING_PRIVACY_PATH);
  });

  it("takes a new account on a site without it straight to making its first case, not an empty list", () => {
    expect(afterSignInPath({ isNewAccount: true, hasCases: false, storyIntake: false, searchText: null })).toBe(FIRST_CASE_PATH);
    expect(afterSignInPath({ isNewAccount: true, hasCases: false, storyIntake: false, searchText: "I was fired" })).toBe(FIRST_CASE_PATH);
  });

  it("sends a returning client with no case yet (left before their story, or verified later) to make one", () => {
    expect(afterSignInPath({ isNewAccount: false, hasCases: false, storyIntake: true, searchText: null })).toBe(ONBOARDING_PRIVACY_PATH);
    expect(afterSignInPath({ isNewAccount: false, hasCases: false, storyIntake: false, searchText: null })).toBe(FIRST_CASE_PATH);
  });

  it("lands a returning client with cases on them, and never through the onboarding", () => {
    expect(afterSignInPath({ isNewAccount: false, hasCases: true, storyIntake: true, searchText: null })).toBe(SIGNED_IN_PATH);
    expect(afterSignInPath({ isNewAccount: false, hasCases: true, storyIntake: true, searchText: "I was fired" })).toBe(FIRST_CASE_PATH);
  });

  it("lands as a returning client when the cases couldn't be checked", () => {
    expect(afterSignInPath({ isNewAccount: false, hasCases: null, storyIntake: true, searchText: null })).toBe(SIGNED_IN_PATH);
  });
});
