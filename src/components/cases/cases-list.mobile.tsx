"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownUp, ChevronRight, FileText, FolderPlus, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { EditCaseModal } from "@/components/case/edit-case-modal";
import { RemoveCaseModal } from "@/components/case/remove-case-modal";
import { BottomSheet, SheetRow } from "@/components/mobile/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { cn } from "@/lib/cn";
import { clientRequestStatusLabel } from "@/lib/lawyer-requests/api";
import { areasLabel, type Case } from "@/lib/types";
import { DraftsSection } from "./drafts";
import { SORT_FIELDS, SORT_LABELS, PAGE_SIZE, notesLine, useCasesList, type CaseMenuItem, type SortField, type SortOrder } from "./use-cases-list";

const shortDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));

/** One case as a card: the whole card opens it, and the "…" sits clear of that tap target. */
function CaseCard({ c, archived, request, onMenu }: { c: Case; archived: boolean; request?: string; onMenu: () => void }) {
  const note = notesLine(c.notes);
  const docs = `${c.documents.length} ${c.documents.length === 1 ? "document" : "documents"}`;
  const body = (
    <>
      <span className="line-clamp-2 pr-10 font-display text-[18px] leading-[1.25] tracking-[-0.01em] text-ink">{c.title}</span>
      <span className="truncate text-[12px] font-semibold uppercase tracking-[0.6px] text-gold">{areasLabel(c.areas)}</span>
      {note && <span className="line-clamp-2 text-[14px] leading-[1.45] text-ink-2">{note}</span>}
      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
        <span>Updated {shortDate(c.updatedAt)}</span>
        <span className="inline-flex items-center gap-1">
          <FileText size={12} aria-hidden="true" />
          {docs}
        </span>
        <span className="tabular-nums">{c.credits} credits</span>
      </span>
      <span className="mt-1 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[13px]">
        <span className={cn("font-medium", request ? "text-gold" : "text-muted")}>{request ?? (archived ? "Archived" : "No lawyer request")}</span>
        {!archived && <ChevronRight size={16} className="text-muted" aria-hidden="true" />}
      </span>
    </>
  );
  return (
    <li className="relative rounded-card border border-line bg-white">
      {archived ? (
        <div className="flex flex-col gap-1.5 p-4">{body}</div>
      ) : (
        <Link href={`/cases/${c.id}`} className="flex flex-col gap-1.5 rounded-card p-4 text-ink no-underline active:bg-subtle">
          {body}
        </Link>
      )}
      <button
        type="button"
        onClick={onMenu}
        aria-label={`Actions for ${c.title}`}
        aria-haspopup="dialog"
        data-no-tap
        className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-full text-ink-2 active:bg-chip"
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
    </li>
  );
}

function CardSkeleton() {
  return (
    <ul aria-hidden className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-2.5 rounded-card border border-line p-4">
          <div className="h-5 w-3/5 animate-pulse rounded bg-chip" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-chip" />
          <div className="h-3.5 w-full animate-pulse rounded bg-chip" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-chip" />
        </li>
      ))}
    </ul>
  );
}

export function CasesListMobile() {
  const v = useCasesList();
  const [menuFor, setMenuFor] = useState<Case | null>(null);
  const [sorting, setSorting] = useState(false);
  const { status, list, searching } = v;

  if (v.hidden) return <div className="flex-1" />;

  const items: CaseMenuItem[] = menuFor ? v.menuFor(menuFor) : [];
  const remaining = v.rows.length - v.shownThrough.length;
  const showControls = v.total > 0 || status === "ARCHIVED" || searching;
  const sortWords = `${SORT_LABELS[v.sort.field]}, ${v.sort.order === "asc" ? "oldest first" : "newest first"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
          <div>
            <h1 className="font-display text-[28px] font-normal leading-[1.1] tracking-[-0.02em]">Your cases</h1>
            <p data-tour="cases-credits" className="mt-1.5 text-[14px] leading-[1.45] text-ink-2">
              {v.count}. Each case is free and includes {v.included} chat credits.
            </p>
          </div>

          {showControls && (
            <div className="flex flex-col gap-3">
              <div role="group" aria-label="Which cases" className="grid grid-cols-2 rounded-full border border-line bg-subtle p-1">
                {(["ACTIVE", "ARCHIVED"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={status === s}
                    onClick={() => v.switchStatus(s)}
                    data-no-tap
                    className={cn(
                      "h-10 rounded-full border text-[14px] font-medium transition-colors",
                      status === s ? "border-line bg-white text-ink shadow-sm" : "border-transparent text-muted",
                    )}
                  >
                    {s === "ACTIVE" ? "Active" : "Archived"}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center">
                <Search size={18} className="pointer-events-none absolute left-4 text-muted" aria-hidden="true" />
                <input
                  type="search"
                  enterKeyHint="search"
                  value={v.search}
                  onChange={(e) => v.updateSearch(e.target.value)}
                  placeholder="Search your cases"
                  aria-label="Search your cases"
                  className="box-border h-12 w-full rounded-full border border-line-input bg-white pl-11 pr-11 text-base text-ink outline-none transition-colors focus:border-ink-2 [&::-webkit-search-cancel-button]:hidden"
                />
                {searching && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => v.updateSearch("")}
                    data-no-tap
                    className="absolute right-1 flex size-11 items-center justify-center rounded-full text-muted active:bg-chip"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted" aria-live="polite">
                  {searching ? `${v.rows.length} ${v.rows.length === 1 ? "match" : "matches"}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setSorting(true)}
                  aria-haspopup="dialog"
                  aria-label={`Sort: ${sortWords}. Change`}
                  data-no-tap
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-ink-2 active:bg-chip"
                >
                  <ArrowDownUp size={16} aria-hidden="true" />
                  {SORT_LABELS[v.sort.field]} · {v.sort.order === "asc" ? "Oldest" : "Newest"}
                </button>
              </div>
            </div>
          )}

          {status === "ACTIVE" && !searching && <DraftsSection mobile />}

          {list.error && <ErrorBox message={list.error.message} />}
          {v.restore.error && <ErrorBox message={v.restore.error.message} />}

          {list.isPending && <CardSkeleton />}

          {!list.isPending && !list.error && v.shownThrough.length > 0 && (
            <ul className="flex flex-col gap-3">
              {v.shownThrough.map((c) => {
                const open = v.openRequests?.get(c.id);
                return <CaseCard key={c.id} c={c} archived={status === "ARCHIVED"} request={open ? clientRequestStatusLabel(open.status) : undefined} onMenu={() => setMenuFor(c)} />;
              })}
            </ul>
          )}

          {remaining > 0 && (
            <Button variant="outline" size="lg" className="w-full" onClick={() => v.setPage(v.current + 1)}>
              Show {Math.min(PAGE_SIZE, remaining)} more · {remaining} left
            </Button>
          )}

          {v.emptyAll && status === "ACTIVE" && !searching && (
            <div className="flex flex-col items-center gap-3 rounded-modal border border-dashed border-line-input px-5 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-line text-gold">
                <FolderPlus size={20} aria-hidden="true" />
              </div>
              <div className="font-display text-[22px] tracking-[-0.02em]">Create your first case</div>
              <div className="text-[14px] leading-[1.55] text-ink-2">
                Each case keeps your details, documents and AI consultation in one place. Free to create, with {v.included} chat credits included.
              </div>
            </div>
          )}
          {v.emptyAll && status === "ARCHIVED" && (
            <div className="py-8 text-center text-[14px] leading-[1.5] text-ink-2">No archived cases. A case you archive waits here until you restore it.</div>
          )}
          {!list.isPending && !list.error && !v.emptyAll && v.rows.length === 0 && (
            <div className="py-8 text-center text-[14px] text-ink-2">No cases match &ldquo;{v.search.trim()}&rdquo;.</div>
          )}
        </div>
      </div>

      <div data-tour="sticky-bar" className="shrink-0 border-t border-line bg-white px-4 py-3">
        <Button size="xl" className="w-full" data-tour="new-case" onClick={v.newCase}>
          <Plus size={16} aria-hidden="true" />
          New case
        </Button>
      </div>

      <BottomSheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.title ?? "Case"}>
        <div role="menu" aria-label="Case actions">
          {items.map((item) => (
            <SheetRow
              key={item.label}
              icon={item.icon}
              danger={item.danger}
              onSelect={() => {
                setMenuFor(null);
                item.onSelect();
              }}
            >
              {item.label}
            </SheetRow>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={sorting} onClose={() => setSorting(false)} title="Sort cases">
        <div role="group" aria-label="Sort by">
          {SORT_FIELDS.map((f: SortField) => (
            <SheetRow key={f} selected={v.sort.field === f} onSelect={() => v.applySort(f, v.sort.order)}>
              {SORT_LABELS[f]} date
            </SheetRow>
          ))}
        </div>
        <div className="mx-3 my-1 border-t border-line" />
        <div role="group" aria-label="Order">
          {(["desc", "asc"] as SortOrder[]).map((o) => (
            <SheetRow
              key={o}
              selected={v.sort.order === o}
              onSelect={() => {
                v.applySort(v.sort.field, o);
                setSorting(false);
              }}
            >
              {o === "desc" ? "Newest first" : "Oldest first"}
            </SheetRow>
          ))}
        </div>
      </BottomSheet>

      {v.editing && <EditCaseModal c={v.editing} onClose={() => v.setEditing(null)} />}
      {v.removing && <RemoveCaseModal c={v.removing.c} mode={v.removing.mode} onClose={() => v.setRemoving(null)} />}
    </div>
  );
}
