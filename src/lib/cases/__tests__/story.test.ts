import { describe, expect, it } from "vitest";
import type { CaseIntake, IntakeStatus } from "@/lib/types";
import { READING_PATIENCE_MS, storyReading, storySegments } from "../story";

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
