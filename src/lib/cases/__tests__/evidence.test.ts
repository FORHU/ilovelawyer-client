import { describe, expect, it } from "vitest";
import { NOTE_PATIENCE_MS, checklistOf, memoFormat, memoName, noteStatusOf, stillWorking, type EvidenceState } from "../evidence";
import type { QuestionsState } from "../questions";

describe("noteStatusOf", () => {
  it("follows a document from being read to its note", () => {
    expect(noteStatusOf({ status: "PENDING", note: null, noteBy: null })).toBe("reading");
    expect(noteStatusOf({ status: "READY", note: null, noteBy: null })).toBe("drafting");
    expect(noteStatusOf({ status: "READY", note: "My last payslip.", noteBy: "AI" })).toBe("note");
    expect(noteStatusOf({ status: "READY", note: "My own words.", noteBy: "CLIENT" })).toBe("note");
  });

  it("shows no note once the AI had nothing to say or the client cleared it, and a failed read as failed", () => {
    expect(noteStatusOf({ status: "READY", note: null, noteBy: "AI" })).toBe("none");
    expect(noteStatusOf({ status: "READY", note: null, noteBy: "CLIENT" })).toBe("none");
    expect(noteStatusOf({ status: "FAILED", note: null, noteBy: null })).toBe("failed");
  });

  it("stops waiting for a note that isn't coming: once the screen gives up, or for a document added long before it opened", () => {
    const read = { status: "READY" as const, note: null, noteBy: null, uploadedAt: "2026-11-26T02:19:00.000Z" };
    const added = Date.parse(read.uploadedAt);
    expect(noteStatusOf(read, { at: added + 60_000 })).toBe("drafting");
    expect(noteStatusOf(read, { at: added + 60_000, gaveUp: true })).toBe("none");
    expect(noteStatusOf(read, { at: added + NOTE_PATIENCE_MS + 1 })).toBe("none");
    // A note that came, or a document still being read, isn't affected.
    expect(noteStatusOf({ ...read, note: "My lease.", noteBy: "AI" }, { gaveUp: true })).toBe("note");
    expect(noteStatusOf({ ...read, status: "PENDING" }, { gaveUp: true })).toBe("reading");
  });

  it("keeps checking only while a document is being read or noted", () => {
    expect(stillWorking([{ status: "READY", note: "x", noteBy: "AI" }, { status: "PENDING", note: null, noteBy: null }])).toBe(true);
    expect(stillWorking([{ status: "READY", note: "x", noteBy: "AI" }, { status: "FAILED", note: null, noteBy: null }])).toBe(false);
  });
});

describe("checklistOf", () => {
  const questions = (over: Partial<QuestionsState>): QuestionsState => ({ status: "DONE", total: 4, answered: 4, skipped: 0, current: null, history: [], ...over });
  const evidence = (states: ("OPEN" | "ADDED" | "DISMISSED")[]): EvidenceState => ({
    suggestions: states.map((state, i) => ({ id: `s${i}`, title: "t", why: "", source: "files", state, documentId: null })),
    added: states.filter((s) => s === "ADDED").length,
    open: states.filter((s) => s === "OPEN").length,
  });

  it("lists the story, the details answered, the proof and what's left for the lawyer", () => {
    expect(checklistOf({ questions: questions({ answered: 3, skipped: 1 }), documents: 2, evidence: evidence(["ADDED", "DISMISSED", "OPEN"]) })).toEqual([
      { label: "Your story", value: "Told", tone: "ok" },
      { label: "Details", value: "{answered} of {total} answered, {skipped} skipped", vars: { answered: 3, total: 4, skipped: 1 }, tone: "neutral" },
      { label: "Proof", value: "{count} documents", vars: { count: 2 }, tone: "ok" },
      { label: "Not added", value: "{count} for your lawyer to ask about", vars: { count: 2 }, tone: "neutral" },
    ]);
  });

  it("leaves out the details when there were no questions, and says 1 document in the singular", () => {
    const rows = checklistOf({ questions: questions({ total: 0, answered: 0 }), documents: 1, evidence: evidence(["ADDED"]) });
    expect(rows.map((r) => r.label)).toEqual(["Your story", "Proof"]);
    expect(rows[1]).toEqual({ label: "Proof", value: "1 document", tone: "ok" });
  });
});

describe("voice memos", () => {
  it("records in webm where the browser can, mp4 audio in Safari, and nothing where it can do neither", () => {
    expect(memoFormat((type) => type === "audio/webm")).toEqual({ mimeType: "audio/webm", extension: "webm" });
    expect(memoFormat((type) => type === "audio/mp4")).toEqual({ mimeType: "audio/mp4", extension: "m4a" });
    expect(memoFormat(() => false)).toBeNull();
  });

  it("names a memo by when it was recorded", () => {
    expect(memoName(new Date(2026, 2, 5, 14, 7), "webm")).toBe("Voice memo 2026-03-05 14.07.webm");
  });
});
