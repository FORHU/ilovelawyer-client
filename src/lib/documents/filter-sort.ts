import type { CaseDocument } from "@/lib/types";

export type FilterKey = "all" | "attention" | "used" | "unused";
export type SortKey = "newest" | "oldest" | "name" | "cited";

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "used", label: "Used in overview" },
  { key: "unused", label: "Not used yet" },
];

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "name", label: "Name" },
  { key: "cited", label: "Most cited" },
];

/** Whether a document belongs under each filter. `usedCount` is how many overview items cite it. */
export function filterTests(usedCount: (d: CaseDocument) => number): Record<FilterKey, (d: CaseDocument) => boolean> {
  return {
    all: () => true,
    attention: (d) => d.status === "FAILED",
    used: (d) => usedCount(d) > 0,
    unused: (d) => d.status === "READY" && usedCount(d) === 0,
  };
}

/** The documents the list shows: the chosen filter, a case-insensitive name search, and the sort.
 * Ties keep the order the API gave them. */
export function applyDocumentView(
  docs: CaseDocument[],
  view: { filter: FilterKey; sort: SortKey; query: string },
  usedCount: (d: CaseDocument) => number,
): CaseDocument[] {
  const test = filterTests(usedCount)[view.filter];
  const needle = view.query.trim().toLowerCase();
  return docs
    .filter((d) => test(d) && (!needle || d.name.toLowerCase().includes(needle)))
    .sort((a, b) => {
      if (view.sort === "name") return a.name.localeCompare(b.name);
      if (view.sort === "cited") return usedCount(b) - usedCount(a);
      const diff = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      return view.sort === "oldest" ? diff : -diff;
    });
}
