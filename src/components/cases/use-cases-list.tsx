"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Archive, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { RemoveMode } from "@/components/case/remove-case-modal";
import { isLanding } from "@/lib/landing";
import { parseNotes } from "@/lib/cases/notes";
import { useArchivedCasesQuery, useCasesQuery, useUnarchiveCaseMutation } from "@/lib/cases/queries";
import { useOpenLawyerRequestsQuery } from "@/lib/lawyer-requests/api";
import { usePricingQuery } from "@/lib/pricing";
import { useApp } from "@/lib/store";
import { areasLabel, type Case } from "@/lib/types";
import { startNewCase } from "@/lib/wizard-store";

// The cases list follows the lawyer app's case portfolio: one entry per case with sortable dates,
// search, an Active / Archived switch, a notes line, a menu and pages of ten. The API returns all of
// a client's cases at once, so search, sort and paging happen here. This hook is all of that; the
// desktop view draws it as a table and the mobile view as cards.

export const PAGE_SIZE = 10;

export type SortField = "created" | "updated";
export type SortOrder = "asc" | "desc";
export const SORT_LABELS: Record<SortField, string> = { created: "Created", updated: "Updated" };
export const SORT_FIELDS = Object.keys(SORT_LABELS) as SortField[];
const SORT_KEY: Record<SortField, "createdAt" | "updatedAt"> = { created: "createdAt", updated: "updatedAt" };

export type CaseMenuItem = { label: string; icon: ReactNode; onSelect: () => void; danger?: boolean };

export const formatDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** One line of what the client wrote about the case, under the parties. */
export function notesLine(notes: string) {
  const { happened, wants } = parseNotes(notes);
  return (happened || wants || notes).replace(/\s+/g, " ").trim();
}

export function useCasesList() {
  const router = useRouter();
  // A fresh draft each time: a refresh of New case keeps what's typed, a new visit doesn't.
  const newCase = () => {
    startNewCase();
    router.push("/cases/new");
  };
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ field: SortField; order: SortOrder }>({ field: "updated", order: "desc" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Case | null>(null);
  const [removing, setRemoving] = useState<{ c: Case; mode: RemoveMode } | null>(null);

  const active = useCasesQuery();
  const archived = useArchivedCasesQuery(status === "ARCHIVED");
  const list = status === "ACTIVE" ? active : archived;
  const { data: openRequests } = useOpenLawyerRequestsQuery();
  const { data: pricing } = usePricingQuery();
  const restore = useUnarchiveCaseMutation();

  // Landing here with no cases goes straight to the chat that starts one (lib/landing.ts). Until
  // the list has loaded, and while it is empty, nothing is drawn so the empty page never flashes.
  const landing = isLanding();
  const noCases = active.data?.length === 0;
  useEffect(() => {
    if (landing && noCases) router.replace("/cases/new");
  }, [landing, noCases, router]);
  const hidden = landing && (active.isPending || noCases);

  const included = pricing?.case.credits ?? "…";
  const total = active.data?.length ?? 0;
  const count = active.isPending ? "Loading your cases…" : `${total} ${total === 1 ? "case" : "cases"}`;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const key = SORT_KEY[sort.field];
    const matches = (list.data ?? []).filter(
      (c) =>
        !q ||
        [c.title, areasLabel(c.areas), c.where, notesLine(c.notes), ...c.others.map((o) => o.name)].some((text) => text.toLowerCase().includes(q)),
    );
    const direction = sort.order === "asc" ? 1 : -1;
    return matches.sort((a, b) => direction * (Date.parse(a[key]) - Date.parse(b[key])));
  }, [list.data, search, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  /** Everything up to the current page, for the phone's "Show more". */
  const shownThrough = rows.slice(0, current * PAGE_SIZE);

  const switchStatus = (next: "ACTIVE" | "ARCHIVED") => {
    setStatus(next);
    setPage(1);
  };
  // The sorted column again reverses it; another column starts newest first.
  const switchSort = (field: SortField) => {
    setSort((s) => (s.field === field ? { field, order: s.order === "asc" ? "desc" : "asc" } : { field, order: "desc" }));
    setPage(1);
  };
  const applySort = (field: SortField, order: SortOrder) => {
    setSort({ field, order });
    setPage(1);
  };
  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const menuFor = (c: Case): CaseMenuItem[] =>
    status === "ACTIVE"
      ? [
          { label: "Edit details", icon: <Pencil size={14} />, onSelect: () => setEditing(c) },
          { label: "Archive case", icon: <Archive size={14} />, onSelect: () => setRemoving({ c, mode: "archive" }) },
          { label: "Delete case", icon: <Trash2 size={14} />, onSelect: () => setRemoving({ c, mode: "delete" }), danger: true },
        ]
      : [
          {
            label: "Restore case",
            icon: <RotateCcw size={14} />,
            onSelect: () => restore.mutate(c.id, { onSuccess: () => useApp.getState().setBanner("Case restored.") }),
          },
          { label: "Delete case", icon: <Trash2 size={14} />, onSelect: () => setRemoving({ c, mode: "delete" }), danger: true },
        ];

  const searching = search.trim() !== "";
  const emptyAll = !list.isPending && !list.error && (list.data?.length ?? 0) === 0;

  return {
    newCase,
    status,
    search,
    sort,
    editing,
    setEditing,
    removing,
    setRemoving,
    list,
    restore,
    openRequests,
    hidden,
    included,
    total,
    count,
    rows,
    totalPages,
    current,
    shown,
    shownThrough,
    setPage,
    switchStatus,
    switchSort,
    applySort,
    updateSearch,
    menuFor,
    searching,
    emptyAll,
  };
}

export type CasesList = ReturnType<typeof useCasesList>;
