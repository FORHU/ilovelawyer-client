import { describe, it, expect } from "vitest";
import { textSegments, formatClock } from "../voice-reply-sync";

const TEXT = '"Well said," she replied.';
// Polly word marks exclude punctuation: Well, said, she, replied
const WORDS = [
  { time: 10, start: 1, end: 5 },
  { time: 10.4, start: 6, end: 10 },
  { time: 11, start: 13, end: 16 },
  { time: 11.3, start: 17, end: 24 },
];

const joined = (segments: { text: string }[]) => segments.map((s) => s.text).join("");
const stateOf = (segments: { text: string; state: string }[], text: string) => segments.find((s) => s.text === text)?.state;

describe("textSegments", () => {
  describe("with word timings", () => {
    it("covers every character of the text exactly once", () => {
      expect(joined(textSegments(TEXT, 12, 10.5, WORDS))).toBe(TEXT);
    });

    it("marks words before, at and after playback", () => {
      const segments = textSegments(TEXT, 12, 10.5, WORDS);
      expect(stateOf(segments, "Well")).toBe("spoken");
      expect(stateOf(segments, "said")).toBe("speaking");
      expect(stateOf(segments, "she")).toBe("upcoming");
    });

    it("leaves the whole text upcoming before the first word starts", () => {
      const segments = textSegments(TEXT, 12, 9.8, WORDS);
      expect(segments.every((s) => s.state === "upcoming")).toBe(true);
    });

    it("reads the trailing period as spoken once the last word starts", () => {
      expect(textSegments(TEXT, 12, 11.5, WORDS).at(-1)).toEqual({ text: ".", state: "spoken" });
    });
  });

  describe("with only sentence timings", () => {
    const text = "First one here. Second one.";
    const sentences = [
      { time: 0, start: 0, end: 15 },
      { time: 5, start: 16, end: 27 },
    ];

    it("covers the whole text", () => {
      expect(joined(textSegments(text, 8, 6, null, sentences)).replace(/\s+/g, " ").trim()).toBe(text);
    });

    it("treats an earlier sentence as fully spoken and a later one as upcoming", () => {
      const midFirst = textSegments(text, 8, 1, null, sentences);
      expect(midFirst.filter((s) => s.text.includes("Second")).every((s) => s.state === "upcoming")).toBe(true);
    });
  });

  describe("with neither (estimated by character share)", () => {
    it("covers the whole text and tracks roughly where playback is", () => {
      const text = "one two three four";
      expect(joined(textSegments(text, 4, 0))).toBe(`${text} `);
      const early = textSegments(text, 4, 0.1);
      expect(early[0]?.state).not.toBe("spoken");
      const late = textSegments(text, 4, 3.9);
      expect(late.some((s) => s.state === "speaking" || s.state === "spoken")).toBe(true);
    });
  });
});

describe("formatClock", () => {
  it("pads seconds under a minute", () => {
    expect(formatClock(5)).toBe("0:05");
  });

  it("formats minutes and seconds", () => {
    expect(formatClock(125)).toBe("2:05");
  });

  it("floors fractional seconds and clamps negative to zero", () => {
    expect(formatClock(1.9)).toBe("0:01");
    expect(formatClock(-5)).toBe("0:00");
  });
});
