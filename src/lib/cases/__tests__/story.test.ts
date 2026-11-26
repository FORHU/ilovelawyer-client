import { describe, expect, it } from "vitest";
import type { CaseIntake, IntakeStatus } from "@/lib/types";
import { FACT_LINGER_MS, FACT_POP_MS, FACT_STEP_MS, READING_PATIENCE_MS, STORY_SUGGESTIONS, factsRevealMs, factsShown, offersSuggestions, storyReading, storySegments } from "../story";

const withStatus = (status: IntakeStatus) => ({ status }) as CaseIntake;

describe("storySegments", () => {
  it("bolds what sits between ** pairs", () => {
    expect(storySegments("Your manager let you go on **3 March 2026**, effective immediately.")).toEqual([
      { text: "Your manager let you go on ", bold: false },
      { text: "3 March 2026", bold: true },
      { text: ", effective immediately.", bold: false },
    ]);
  });

  it("handles several bold parts and one at the very start", () => {
    expect(storySegments("**Acme** owes you **2 months' pay**.")).toEqual([
      { text: "Acme", bold: true },
      { text: " owes you ", bold: false },
      { text: "2 months' pay", bold: true },
      { text: ".", bold: false },
    ]);
  });

  it("keeps a line with an unpaired marker as written, all plain", () => {
    expect(storySegments("You were let go on **3 March.")).toEqual([{ text: "You were let go on **3 March.", bold: false }]);
  });

  it("never treats anything else as markup", () => {
    expect(storySegments("<b>not bold</b> and **<i>this</i>**")).toEqual([
      { text: "<b>not bold</b> and ", bold: false },
      { text: "<i>this</i>", bold: true },
    ]);
  });
});

describe("storyReading", () => {
  it("is reading until there's an answer, and while it runs", () => {
    expect(storyReading(undefined, 0)).toBe("reading");
    expect(storyReading(withStatus("RUNNING"), 10_000)).toBe("reading");
  });

  it("lets the client carry on once it has taken too long", () => {
    expect(storyReading(withStatus("RUNNING"), READING_PATIENCE_MS)).toBe("slow");
    expect(storyReading(undefined, READING_PATIENCE_MS + 1)).toBe("slow");
  });

  it("is understood once read, even if the case has moved on since", () => {
    expect(storyReading(withStatus("READY"), 0)).toBe("understood");
    expect(storyReading(withStatus("STALE"), 0)).toBe("understood");
  });

  it("stops waiting when the intake can't be read, but never discards a finished reading", () => {
    expect(storyReading(withStatus("RUNNING"), 2000, true)).toBe("unread");
    expect(storyReading(undefined, 2000, true)).toBe("unread");
    expect(storyReading(withStatus("READY"), 2000, true)).toBe("understood");
  });

  it("is unread when the reading failed or never started", () => {
    expect(storyReading(withStatus("FAILED"), 0)).toBe("unread");
    expect(storyReading(withStatus("EMPTY"), 0)).toBe("unread");
  });
});

describe("story suggestions", () => {
  const same = (key: string) => key;

  it("groups the ways to start by kind of problem", () => {
    expect(STORY_SUGGESTIONS.map((g) => g.area)).toEqual(["Employment", "Housing", "Family", "Money"]);
    expect(STORY_SUGGESTIONS.flatMap((g) => g.prompts)).toContain("My landlord kept my deposit");
  });

  it("offers them while the box is empty or holds one as tapped, and not once the client writes their own", () => {
    expect(offersSuggestions("", same)).toBe(true);
    expect(offersSuggestions("  ", same)).toBe(true);
    expect(offersSuggestions("I was let go without notice", same)).toBe(true);
    expect(offersSuggestions("I was let go without notice on 3 March", same)).toBe(false);
  });

  it("knows a tapped suggestion in the client's language", () => {
    const ko = (key: string) => (key === "I got an eviction notice" ? "퇴거 통보를 받았어요" : key);
    expect(offersSuggestions("퇴거 통보를 받았어요", ko)).toBe(true);
  });
});

describe("the story's facts popping in", () => {
  it("shows the first as soon as they arrive, then one every step, never more than there are", () => {
    expect(factsShown(4, -50)).toBe(0);
    expect(factsShown(4, 0)).toBe(1);
    expect(factsShown(4, FACT_STEP_MS - 1)).toBe(1);
    expect(factsShown(4, FACT_STEP_MS)).toBe(2);
    expect(factsShown(4, FACT_STEP_MS * 3)).toBe(4);
    expect(factsShown(4, FACT_STEP_MS * 10)).toBe(4);
    expect(factsShown(0, 1000)).toBe(0);
  });

  it("holds the screen until the last has popped in and lingered, and not at all with none", () => {
    expect(factsRevealMs(6)).toBe(5 * FACT_STEP_MS + FACT_POP_MS + FACT_LINGER_MS);
    expect(factsRevealMs(1)).toBe(FACT_POP_MS + FACT_LINGER_MS);
    expect(factsRevealMs(0)).toBe(0);
  });
});
