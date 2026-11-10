"use client";

import { useState } from "react";
import { Eye, Lock, Mail, RotateCw, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropOverlay } from "@/components/ui/drop-overlay";
import { FilePicker } from "@/components/ui/file-picker";
import { GmailImportModal } from "@/components/gmail/gmail-import-modal";
import { describeLimits } from "@/lib/cases/limits";
import { cn } from "@/lib/cn";
import { FILTERS, SORTS, type SortKey } from "@/lib/documents/filter-sort";
import { formatBytes } from "@/lib/format";
import type { CaseDocument } from "@/lib/types";
import { DocumentRow, KindBadge, TABLE_HEAD, UploadingRow, documentMeta } from "./document-row";
import type { DocumentsProps } from "./overview-docs";
import { useDocuments } from "./use-documents";

export function DocumentsDesktop({ c, focusDocumentId, onFocused, onOpenOverview }: DocumentsProps) {
  const {
    upload, limits, failed, citations, opener, leftOver, uploading, confirmingId, setConfirmingId, filter, setFilter, sort, setSort,
    query, setQuery, setPickedId, dragging, dragProps, add, retry, usedCount, tests, needle, visible, picked, totalBytes, hasAny, registerRow,
  } = useDocuments(c, focusDocumentId, onFocused);
  const [gmailOpen, setGmailOpen] = useState(false);

  // The panel always shows a document: the picked one, or else the first in the list.
  const selected = picked ?? visible[0] ?? null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" {...dragProps}>
      {opener.modal}
      <GmailImportModal open={gmailOpen} onClose={() => setGmailOpen(false)} />
      {dragging && <DropOverlay label="Drop to upload" />}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-[18px] px-4 pb-14 pt-7 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-display text-[26px] font-normal tracking-[-0.02em]">Documents</h2>
            <span className="text-[13px] text-ink-2">
              {c.documents.length} {c.documents.length === 1 ? "file" : "files"}
              {totalBytes > 0 && ` · ${formatBytes(totalBytes)}`} · the AI reads each one and cites it in your overview
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex items-center">
              <Search size={15} aria-hidden className="pointer-events-none absolute left-3.5 text-ink-2" />
              <input
                type="search"
                aria-label="Search documents"
                placeholder="Search documents"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-[38px] w-[220px] rounded-full border border-line-input bg-white pl-[38px] pr-3.5 text-[13px] outline-none focus-visible:border-gold"
              />
            </label>
            <label className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-[38px] rounded-full border border-line-input bg-white px-2.5 text-[13px] text-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="soft" onClick={() => setGmailOpen(true)} className="!h-[38px] !px-4">
              <Mail size={14} aria-hidden />
              From Gmail
            </Button>
            <FilePicker onPick={add}>
              {(open) => (
                <Button variant="dark" onClick={open} className="!h-[38px] !px-4">
                  <Upload size={14} aria-hidden />
                  Upload
                </Button>
              )}
            </FilePicker>
          </div>
        </div>

        <FilePicker onPick={add}>
          {(open) => (
            <div
              className={cn(
                "flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 rounded-card border-[1.5px] border-dashed bg-subtle p-[18px] text-center transition-colors",
                dragging ? "border-gold bg-warn-bg" : "border-line-input",
              )}
            >
              <Upload size={18} aria-hidden className="text-ink-2" />
              <span className="text-[13px]">
                Drag files here, or{" "}
                <button type="button" onClick={open} className="font-medium text-gold underline hover:text-gold-hover">
                  browse
                </button>
              </span>
              <span className="text-xs text-ink-2">{describeLimits(limits)}</span>
            </div>
          )}
        </FilePicker>

        {leftOver.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-error-line bg-error-bg px-4 py-3">
            <div className="min-w-[200px] flex-1 text-[13px] leading-[1.5] text-error-ink">
              {leftOver.length === 1 ? "1 file didn't" : `${leftOver.length} files didn't`} upload when your case was created:{" "}
              {leftOver.map((f) => f.name).join(", ")}.
            </div>
            <Button variant="soft" onClick={retry} disabled={upload.isPending}>
              <RotateCw size={14} aria-hidden />
              Try again
            </Button>
          </div>
        )}
        {failed.length > 0 && (
          <div role="alert" className="text-[13px] text-error">
            {failed.join(" ")}
          </div>
        )}

        {!hasAny && <div className="text-sm text-ink-2">No documents yet. Add contracts, messages or notices so the AI can use them.</div>}

        {hasAny && (
          <>
            <div role="group" aria-label="Filter documents" className="flex flex-wrap gap-1.5">
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
                      "h-8 rounded-full border px-3.5 text-[12.5px] font-medium",
                      on ? "border-ink bg-ink text-white" : "border-line-input bg-white text-ink hover:border-line-hover",
                    )}
                  >
                    {f.label} <span className="opacity-70">{c.documents.filter(tests[f.key]).length}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-start gap-5">
              <div className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-card border border-line bg-white">
                {TABLE_HEAD}
                {visible.map((d) => (
                  <DocumentRow
                    key={d.id}
                    caseId={c.id}
                    d={d}
                    selected={selected?.id === d.id}
                    onSelect={() => setPickedId(d.id)}
                    confirming={confirmingId === d.id}
                    onConfirmChange={(on) => setConfirmingId(on ? d.id : null)}
                    usedIn={usedCount(d)}
                    onOpen={() => opener.open(d.id)}
                    opening={opener.openingId === d.id}
                    rowRef={registerRow(d.id)}
                  />
                ))}
                {filter === "all" && !needle && uploading.map((file, i) => <UploadingRow key={`${file.name}-${i}`} file={file} />)}
                {visible.length === 0 && (filter !== "all" || needle || uploading.length === 0) && (
                  <div className="px-[18px] py-7 text-center text-[13px] text-ink-2">No documents match.</div>
                )}
              </div>

              {selected && (
                <DocumentPanel
                  d={selected}
                  cites={citations.get(selected.id) ?? []}
                  onOpen={() => opener.open(selected.id)}
                  opening={opener.openingId === selected.id}
                  openError={opener.errorFor(selected.id)}
                  onRemove={() => setConfirmingId(selected.id)}
                  onOpenOverview={onOpenOverview}
                />
              )}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

function DocumentPanel({
  d,
  cites,
  onOpen,
  opening,
  openError,
  onRemove,
  onOpenOverview,
}: {
  d: CaseDocument;
  cites: { label: string }[];
  onOpen: () => void;
  opening: boolean;
  openError?: string;
  onRemove: () => void;
  onOpenOverview: () => void;
}) {
  const none =
    d.status === "PENDING"
      ? "Still reading this file — it will show up here when it is done."
      : d.status === "FAILED"
        ? "This file couldn't be read, so the AI can't use it yet."
        : "Nothing in your overview comes from this file yet.";

  return (
    <aside aria-label="Selected document" className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-card border border-line bg-white p-[18px]">
      <div className="flex items-center gap-3">
        <KindBadge name={d.name} size="lg" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="break-words font-semibold">{d.name}</span>
          <span className="text-xs text-ink-2">{documentMeta(d)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" size="sm" onClick={onOpen} disabled={opening} className="!h-[34px] !px-3.5 !text-[12.5px]">
          <Eye size={14} aria-hidden />
          {opening ? "Opening…" : "Open"}
        </Button>
        <Button variant="quiet" size="sm" onClick={onRemove} className="!h-[34px] !px-3.5 !text-error hover:!text-error-ink">
          Remove
        </Button>
      </div>
      {openError && <span role="alert" className="text-xs text-error">{openError}</span>}

      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[1px] text-ink-2">Cited in your overview</h3>
        {cites.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {cites.map((cite, i) => (
              <li key={`${cite.label}-${i}`}>
                <button type="button" onClick={onOpenOverview} className="text-left text-[13px] text-gold underline hover:text-gold-hover">
                  {cite.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[13px] text-ink-2">{none}</span>
        )}
      </div>

      <div className="flex gap-2 rounded-xl bg-chip px-3 py-2.5 text-xs text-[#4a4a4a]">
        <Lock size={14} aria-hidden className="mt-px shrink-0" />
        <span>Only you can see this file. A lawyer sees it once you confirm them — before that, they only see an anonymised summary.</span>
      </div>
    </aside>
  );
}
