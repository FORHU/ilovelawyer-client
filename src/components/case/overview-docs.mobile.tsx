"use client";

import { useState } from "react";
import { ArrowUpDown, RotateCw, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { BottomSheet, SheetRow } from "@/components/mobile/bottom-sheet";
import { ChatBar } from "@/components/mobile/chat";
import { describeLimits } from "@/lib/cases/limits";
import { cn } from "@/lib/cn";
import { FILTERS, SORTS } from "@/lib/documents/filter-sort";
import { formatBytes } from "@/lib/format";
import { DocumentCardMobile } from "./document-card.mobile";
import { UploadingRow } from "./document-row";
import type { DocumentsProps } from "./overview-docs";
import { useDocuments } from "./use-documents";

/** The phone's Documents: cards instead of a table, a sheet for each file's details and actions,
 * and Upload in a bar at the bottom where the thumb is. There is no drag-and-drop zone on a phone. */
export function DocumentsMobile({ c, focusDocumentId, onFocused, onOpenOverview }: DocumentsProps) {
  const {
    upload, limits, failed, citations, opener, leftOver, uploading, filter, setFilter, sort, setSort, query, setQuery,
    add, retry, usedCount, tests, needle, visible, totalBytes, hasAny, registerRow,
  } = useDocuments(c, focusDocumentId, onFocused);
  const [sorting, setSorting] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {opener.modal}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-3.5 px-4 pb-6 pt-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-display text-[24px] font-normal tracking-[-0.02em]">Documents</h2>
            <span className="text-[13px] leading-[1.45] text-ink-2">
              {c.documents.length} {c.documents.length === 1 ? "file" : "files"}
              {totalBytes > 0 && ` · ${formatBytes(totalBytes)}`} · the AI reads each one and cites it in your overview
            </span>
          </div>

          {leftOver.length > 0 && (
            <div className="flex flex-col gap-3 rounded-card border border-error-line bg-error-bg px-4 py-3">
              <div className="text-[13.5px] leading-[1.5] text-error-ink">
                {leftOver.length === 1 ? "1 file didn't" : `${leftOver.length} files didn't`} upload when your case was created:{" "}
                {leftOver.map((f) => f.name).join(", ")}.
              </div>
              <Button variant="soft" size="lg" className="w-full" onClick={retry} disabled={upload.isPending}>
                <RotateCw size={14} aria-hidden />
                Try again
              </Button>
            </div>
          )}
          {failed.length > 0 && (
            <div role="alert" className="text-[13.5px] text-error">
              {failed.join(" ")}
            </div>
          )}

          {!hasAny && (
            <div className="rounded-card border border-dashed border-line-input px-4 py-8 text-center text-[15px] leading-[1.5] text-ink-2">
              No documents yet. Add contracts, messages or notices so the AI can use them.
            </div>
          )}

          {hasAny && (
            <>
              <div className="flex items-center gap-2">
                <label className="relative flex min-w-0 flex-1 items-center">
                  <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 text-ink-2" />
                  <input
                    type="search"
                    aria-label="Search documents"
                    placeholder="Search documents"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-11 w-full rounded-full border border-line-input bg-white pl-10 pr-3.5 outline-none focus-visible:border-gold"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSorting(true)}
                  aria-label={`Sort: ${SORTS.find((s) => s.key === sort)?.label}`}
                  data-no-tap
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line-input bg-white text-ink-2 active:bg-chip"
                >
                  <ArrowUpDown size={18} aria-hidden="true" />
                </button>
              </div>

              <div role="group" aria-label="Filter documents" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
                {FILTERS.map((f) => {
                  const on = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFilter(f.key)}
                      data-no-tap
                      className={cn(
                        "min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium",
                        on ? "border-ink bg-ink text-white" : "border-line-input bg-white text-ink active:bg-chip",
                      )}
                    >
                      {f.label} <span className="opacity-70">{c.documents.filter(tests[f.key]).length}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2.5">
                {visible.map((d) => (
                  <DocumentCardMobile
                    key={d.id}
                    caseId={c.id}
                    d={d}
                    usedIn={usedCount(d)}
                    cites={citations.get(d.id) ?? []}
                    highlighted={focusDocumentId === d.id}
                    onOpen={() => opener.open(d.id)}
                    opening={opener.openingId === d.id}
                    openError={opener.errorFor(d.id)}
                    onOpenOverview={onOpenOverview}
                    rowRef={registerRow(d.id)}
                  />
                ))}
                {filter === "all" && !needle && uploading.length > 0 && (
                  <div className="overflow-hidden rounded-card border border-line bg-white">
                    {uploading.map((file, i) => (
                      <UploadingRow key={`${file.name}-${i}`} file={file} />
                    ))}
                  </div>
                )}
                {visible.length === 0 && (filter !== "all" || needle || uploading.length === 0) && (
                  <div className="py-8 text-center text-[14px] text-ink-2">No documents match.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ChatBar>
        <FilePicker onPick={add}>
          {(open) => (
            <Button variant="dark" size="lg" className="w-full" onClick={open} disabled={upload.isPending}>
              <Upload size={16} aria-hidden />
              {upload.isPending ? "Uploading…" : "Upload documents"}
            </Button>
          )}
        </FilePicker>
        <p className="mt-2 text-center text-[11.5px] leading-[1.4] text-muted">{describeLimits(limits)}</p>
      </ChatBar>

      <BottomSheet open={sorting} onClose={() => setSorting(false)} title="Sort documents">
        {SORTS.map((s) => (
          <SheetRow
            key={s.key}
            selected={sort === s.key}
            onSelect={() => {
              setSort(s.key);
              setSorting(false);
            }}
          >
            {s.label}
          </SheetRow>
        ))}
      </BottomSheet>
    </div>
  );
}
