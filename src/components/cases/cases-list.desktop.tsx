"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, FolderPlus, Plus, Search, X } from "lucide-react";
import { EditCaseModal } from "@/components/case/edit-case-modal";
import { RemoveCaseModal } from "@/components/case/remove-case-modal";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button, buttonClass } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Eyebrow } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { clientRequestStatusLabel } from "@/lib/lawyer-requests/api";
import { areasLabel } from "@/lib/types";
import { startNewCase } from "@/lib/wizard-store";
import { SORT_FIELDS, SORT_LABELS, formatDate, notesLine, useCasesList, type SortField, type SortOrder } from "./use-cases-list";

/** Name, created, updated, lawyer, menu. Stacked into a card below md. */
const GRID = "md:grid md:grid-cols-[minmax(180px,2fr)_104px_104px_150px_44px] md:items-center md:gap-4";

const toggleTrack = "flex items-center gap-1 rounded-full border border-line bg-subtle p-1";
const toggleButton = (active: boolean) =>
  cn(
    "h-8 rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[1px] transition-colors",
    active ? "border-line bg-white text-ink shadow-sm" : "border-transparent text-muted hover:text-ink",
  );

function SortHeader({ field, sort, onSort }: { field: SortField; sort: { field: SortField; order: SortOrder }; onSort: (f: SortField) => void }) {
  const active = sort.field === field;
  const Icon = !active ? ArrowUpDown : sort.order === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      data-no-tap
      className={cn(
        "-mx-1 inline-flex items-center gap-1.5 justify-self-start rounded px-1 py-0.5 uppercase tracking-[1px] transition-colors hover:text-ink",
        active && "text-ink",
      )}
    >
      {SORT_LABELS[field]}
      <Icon size={12} className={active ? "" : "opacity-40"} aria-hidden />
      <span className="sr-only">{active ? (sort.order === "asc" ? "Sorted oldest first" : "Sorted newest first") : "Sort by this column"}</span>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn("flex flex-col gap-3 border-b border-line px-4 py-4", GRID)}>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-3/5 animate-pulse rounded bg-chip" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-chip" />
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-chip" />
          <div className="hidden h-3 w-20 animate-pulse rounded bg-chip md:block" />
          <div className="hidden h-3 w-24 animate-pulse rounded bg-chip md:block" />
          <div className="size-8 animate-pulse justify-self-end rounded-full bg-chip" />
        </div>
      ))}
    </div>
  );
}

export function CasesListDesktop() {
  const {
    newCase, status, search, sort, editing, setEditing, removing, setRemoving, list, restore, openRequests, hidden,
    included, total, count, totalPages, current, shown, setPage, switchStatus, switchSort, updateSearch, menuFor,
    searching, emptyAll,
  } = useCasesList();

  if (hidden) return <div className="flex-1" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-6 px-4 pt-8 md:px-10 md:pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Case portfolio</Eyebrow>
            <h1 className="font-display text-[32px] font-normal tracking-[-0.02em]">Your cases</h1>
            <div data-tour="cases-credits" className="text-sm text-ink-2">
              {count}. Each case is free and includes {included} chat credits.
            </div>
          </div>
          <Link href="/cases/new" onClick={startNewCase} data-tour="new-case" className={buttonClass("primary", "md", "no-underline text-white hover:text-white")}>
            <Plus size={15} />
            New case
          </Link>
        </div>

        {(total > 0 || status === "ARCHIVED" || searching) && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex w-full items-center sm:max-w-80">
              <Search size={16} className="pointer-events-none absolute left-4 text-muted" aria-hidden />
              <input
                type="text"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search your cases"
                aria-label="Search your cases"
                className="box-border h-11 w-full rounded-full border border-line-input bg-white pl-11 pr-9 text-base text-ink outline-none transition-colors hover:border-line-hover focus:border-ink-2 md:h-10 md:text-[13px]"
              />
              {searching && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => updateSearch("")}
                  className="absolute right-3 flex size-5 items-center justify-center rounded-full text-muted hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={toggleTrack} role="group" aria-label="Which cases">
              <button type="button" aria-pressed={status === "ACTIVE"} onClick={() => switchStatus("ACTIVE")} className={toggleButton(status === "ACTIVE")}>
                Active
              </button>
              <button type="button" aria-pressed={status === "ARCHIVED"} onClick={() => switchStatus("ARCHIVED")} className={toggleButton(status === "ARCHIVED")}>
                Archived
              </button>
            </div>
          </div>
        )}

        {list.error && <ErrorBox message={list.error.message} />}
        {restore.error && <ErrorBox message={restore.error.message} />}

        {list.isPending && <ListSkeleton />}

        {!list.isPending && !list.error && shown.length > 0 && (
          <div className="md:overflow-x-auto">
            <div className={cn("hidden border-b border-line px-4 py-3 text-[10px] font-semibold uppercase tracking-[1px] text-muted md:min-w-[720px]", GRID)}>
              <span>Case</span>
              {SORT_FIELDS.map((f) => (
                <SortHeader key={f} field={f} sort={sort} onSort={switchSort} />
              ))}
              <span>Lawyer</span>
              <span />
            </div>
            <div className="md:min-w-[720px]">
              {shown.map((c) => {
                const openRequest = openRequests?.get(c.id);
                const note = notesLine(c.notes);
                const title = (
                  <>
                    <span className="truncate font-display text-[16px] leading-tight tracking-[-0.02em] text-ink">{c.title}</span>
                    <span className="truncate text-[12px] text-ink-2">
                      {c.others.length > 0 ? c.others.map((o) => o.name).join(" · ") : "No other party listed"}
                    </span>
                    {note && (
                      <span className="truncate text-[12px] text-muted" title={c.notes}>
                        {note}
                      </span>
                    )}
                    <span className="text-[11px] text-muted">
                      {areasLabel(c.areas)} · {c.documents.length} {c.documents.length === 1 ? "document" : "documents"} · {c.credits} credits
                    </span>
                  </>
                );
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex flex-col gap-3 border-b border-line px-4 py-4 transition-colors md:rounded-lg md:hover:bg-subtle",
                      GRID,
                    )}
                  >
                    {status === "ACTIVE" ? (
                      <Link href={`/cases/${c.id}`} className="flex min-w-0 flex-col gap-1 text-ink no-underline">
                        {title}
                      </Link>
                    ) : (
                      <div className="flex min-w-0 flex-col gap-1">{title}</div>
                    )}
                    <div className="flex basis-full flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-muted md:contents">
                      <span className="md:text-[13px] md:text-ink">
                        <span className="md:hidden">Created </span>
                        {formatDate(c.createdAt)}
                      </span>
                      <span className="md:text-[13px] md:text-ink">
                        <span className="md:hidden">Updated </span>
                        {formatDate(c.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:contents">
                      <span className={cn("text-[12px] md:text-[13px]", openRequest ? "text-gold" : "text-muted")}>
                        {openRequest ? clientRequestStatusLabel(openRequest.status) : status === "ACTIVE" ? "No request" : "Archived"}
                      </span>
                      <ActionMenu label={`Actions for ${c.title}`} items={menuFor(c)} className="justify-self-end" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!list.isPending && !list.error && totalPages > 1 && (
          <nav aria-label="Pages of cases" className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <span className="text-[13px] text-ink-2">
              Page {current} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={current === totalPages} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </nav>
        )}

        {emptyAll && status === "ACTIVE" && !searching && (
          <div className="flex flex-col items-center gap-3 rounded-modal border border-dashed border-line-input px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-line text-gold">
              <FolderPlus size={20} />
            </div>
            <div className="font-display text-2xl tracking-[-0.02em]">Create your first case</div>
            <div className="max-w-[380px] text-sm leading-[1.6] text-ink-2">
              Each case keeps your details, documents and AI consultation in one place. Free to create, with {included} chat credits
              included.
            </div>
            <Button className="mt-1.5" onClick={newCase}>
              New case
            </Button>
          </div>
        )}
        {emptyAll && status === "ARCHIVED" && <div className="py-10 text-center text-sm text-ink-2">No archived cases. A case you archive waits here until you restore it.</div>}
        {!list.isPending && !list.error && !emptyAll && shown.length === 0 && (
          <div className="py-10 text-center text-sm text-ink-2">No cases match &ldquo;{search.trim()}&rdquo;.</div>
        )}

        {editing && <EditCaseModal c={editing} onClose={() => setEditing(null)} />}
        {removing && <RemoveCaseModal c={removing.c} mode={removing.mode} onClose={() => setRemoving(null)} />}
      </div>
    </div>
  );
}
