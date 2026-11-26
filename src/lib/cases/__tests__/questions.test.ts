import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/fetch";
import {
  END_ALL_ANSWERED,
  END_NOTHING_TO_ASK,
  END_WITH_SKIPS,
  endMessageOf,
  isBehind,
  isStillPreparing,
  progressOf,
  remainingOf,
  threadOf,
  type QuestionsState,
} from "../questions";

const state = (over: Partial<QuestionsState> = {}): QuestionsState => ({
  status: "OPEN",
  total: 5,
  answered: 0,
  skipped: 0,
  current: null,
  history: [],
  ...over,
});

describe("progressOf", () => {
  it("counts answered and skipped details out of the fixed total", () => {
    expect(progressOf(state({ answered: 2, skipped: 1 }))).toEqual({ done: 3, total: 5, percent: 60 });
  });

  it("is full when there was nothing to ask, and never goes past the total", () => {
    expect(progressOf(state({ total: 0 }))).toEqual({ done: 0, total: 0, percent: 100 });
    expect(progressOf(state({ total: 2, answered: 3 })).done).toBe(2);
  });
});

describe("threadOf", () => {
  it("lays out each question with what the client said, then the question they're on", () => {
    const turns = threadOf(
      state({
        history: [
          { id: "place", question: "Which part of the UK?", why: "Lawyers are qualified by part.", answer: "Scotland", skipped: false },
          { id: "place.followUp", question: "Which town or city?", why: "", answer: null, skipped: true },
        ],
        current: { id: "terms", detail: "terms", question: "What was your pay?", why: "It sets what you're owed.", chips: [], followUp: false },
      }),
    );
    expect(turns).toEqual([
      { kind: "question", key: "q-place", text: "Which part of the UK?", why: "Lawyers are qualified by part." },
      { kind: "answer", key: "a-place", text: "Scotland", skipped: false },
      { kind: "question", key: "q-place.followUp", text: "Which town or city?", why: "" },
      { kind: "answer", key: "a-place.followUp", text: null, skipped: true },
      { kind: "question", key: "q-terms", text: "What was your pay?", why: "It sets what you're owed." },
    ]);
  });

  it("has no question at the end once done", () => {
    expect(threadOf(state({ status: "DONE", current: null }))).toEqual([]);
  });
});

describe("endMessageOf", () => {
  it("says what comes next, mentioning the skipped ones for the lawyer", () => {
    expect(endMessageOf(state({ total: 0 }))).toBe(END_NOTHING_TO_ASK);
    expect(endMessageOf(state({ total: 3, answered: 3 }))).toBe(END_ALL_ANSWERED);
    expect(endMessageOf(state({ total: 3, answered: 2, skipped: 1 }))).toBe(END_WITH_SKIPS);
  });
});

describe("remainingOf", () => {
  it("counts what's left to answer while the questions are under way, and nothing otherwise", () => {
    expect(remainingOf(state({ total: 5, answered: 2, skipped: 1 }))).toBe(2);
    expect(remainingOf(state({ status: "DONE", total: 5, answered: 5 }))).toBe(0);
    expect(remainingOf(null)).toBe(0);
    expect(remainingOf(undefined)).toBe(0);
  });
});

describe("isBehind", () => {
  it("re-reads the questions when the screen is behind what's saved, and on nothing else", () => {
    expect(isBehind(new ApiError("moved on", 409, "QUESTION_NOT_CURRENT"))).toBe(true);
    expect(isBehind(new ApiError("done", 409, "QUESTIONS_DONE"))).toBe(true);
    expect(isBehind(new ApiError("not started", 409, "QUESTIONS_NOT_STARTED"))).toBe(true);
    expect(isBehind(new ApiError("chat busy", 409, "TURN_IN_PROGRESS"))).toBe(false);
    expect(isBehind(new Error("network"))).toBe(false);
  });
});

describe("isStillPreparing", () => {
  it("waits on the story's reading or the list being written, and nothing else", () => {
    expect(isStillPreparing(new ApiError("reading", 409, "INTAKE_RUNNING"))).toBe(true);
    expect(isStillPreparing(new ApiError("writing", 409, "QUESTIONS_PREPARING"))).toBe(true);
    expect(isStillPreparing(new ApiError("failed", 502, "QUESTIONS_FAILED"))).toBe(false);
    expect(isStillPreparing(new Error("network"))).toBe(false);
  });
});
