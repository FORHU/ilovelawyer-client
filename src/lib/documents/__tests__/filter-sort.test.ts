import { describe, it, expect } from "vitest";
import { applyDocumentView, filterTests } from "../filter-sort";
import type { CaseDocument } from "@/lib/types";

const doc = (id: string, name: string, status: CaseDocument["status"], uploadedAt: string): CaseDocument =>
  ({ id, name, status, uploadedAt, size: 1000 }) as CaseDocument;

const docs = [
  doc("a", "Contract.pdf", "READY", "2026-10-01T10:00:00Z"),
  doc("b", "bank-statement.pdf", "READY", "2026-10-03T10:00:00Z"),
  doc("c", "Scan.png", "FAILED", "2026-10-02T10:00:00Z"),
  doc("d", "notes.txt", "PENDING", "2026-10-04T10:00:00Z"),
];
const cited: Record<string, number> = { a: 3, b: 0, c: 0, d: 0 };
const used = (d: CaseDocument) => cited[d.id] ?? 0;
const ids = (list: CaseDocument[]) => list.map((d) => d.id);
const view = (over: Partial<Parameters<typeof applyDocumentView>[1]> = {}) =>
  ids(applyDocumentView(docs, { filter: "all", sort: "newest", query: "", ...over }, used));

describe("filterTests", () => {
  it("sorts documents into attention, used and unused", () => {
    expect(ids(docs.filter(filterTests(used).attention))).toEqual(["c"]);
    expect(ids(docs.filter(filterTests(used).used))).toEqual(["a"]);
    // A file still being read is not "not used yet": it hasn't been read.
    expect(ids(docs.filter(filterTests(used).unused))).toEqual(["b"]);
  });
});

describe("applyDocumentView", () => {
  it("sorts newest and oldest first", () => {
    expect(view({ sort: "newest" })).toEqual(["d", "b", "c", "a"]);
    expect(view({ sort: "oldest" })).toEqual(["a", "c", "b", "d"]);
  });

  it("sorts by name and by how much is cited", () => {
    expect(view({ sort: "name" })).toEqual(["b", "a", "d", "c"]);
    expect(view({ sort: "cited" })[0]).toBe("a");
  });

  it("keeps the given order for documents that tie", () => {
    expect(view({ sort: "cited" })).toEqual(["a", "b", "c", "d"]);
  });

  it("searches names without regard to case or surrounding spaces", () => {
    expect(view({ query: "  CONTRACT " })).toEqual(["a"]);
    expect(view({ query: "xyz" })).toEqual([]);
  });

  it("combines a filter with a search, and does not change the list it was given", () => {
    expect(view({ filter: "unused", query: "bank" })).toEqual(["b"]);
    expect(ids(docs)).toEqual(["a", "b", "c", "d"]);
  });
});
