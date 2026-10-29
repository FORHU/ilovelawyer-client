"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Lock, RotateCw, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { checkFiles, describeLimits, useLimitsQuery } from "@/lib/cases/limits";
import { citationsByDocument } from "@/lib/cases/citations";
import { useIntakeQuery, useUploadDocumentsMutation, useUploadingFiles } from "@/lib/cases/queries";
import { useFailedUploads, useFailedUploadsOf } from "@/lib/failed-uploads";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";
import type { Case, CaseDocument } from "@/lib/types";
import { DocumentRow, KindBadge, TABLE_HEAD, UploadingRow, documentMeta, useOpenDocument } from "./document-row";

// Overview moved to components/case/overview/overview.tsx (#45). This file keeps the Documents
// tab, which Overview's document links switch to (via focusDocumentId below).

type FilterKey = "all" | "attention" | "used" | "unused";
type SortKey = "newest" | "oldest" | "name" | "cited";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "used", label: "Used in overview" },
  { key: "unused", label: "Not used yet" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "name", label: "Name" },
  { key: "cited", label: "Most cited" },
];

export function Documents({
  c,
  focusDocumentId,
  onFocused,
  onOpenOverview,
}: {
  c: Case;
  /** Scrolled into view and selected — a document link from Overview (#45). */
  focusDocumentId?: string | null;
  onFocused?: () => void;
  /** Switches to the Overview tab, from the "Cited in your overview" links. */
  onOpenOverview: () => void;
}) {
  const upload = useUploadDocumentsMutation(c.id);
  const { data: limits } = useLimitsQuery();
  const { data: intake } = useIntakeQuery(c.id, c.documents.some((d) => d.status === "PENDING"));
  const [failed, setFailed] = useState<string[]>([]);
  const citations = useMemo(() => citationsByDocument(intake), [intake]);
  const opener = useOpenDocument(c.id);
  /** Files from the wizard that didn't upload when the case was made (kept in memory only). */
  const leftOver = useFailedUploadsOf(c.id);
  const rows = useRef<Record<string, HTMLDivElement | null>>({});
  /** Files still uploading, here or from the chat: listed as rows until they're on the case. */
  const uploading = useUploadingFiles(c.id);
  /** The row asking whether to remove its document, if any. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // A document link from Overview selects that file: adjust state while rendering, not in an effect.
  const [seenFocus, setSeenFocus] = useState<string | null>(null);
  if (focusDocumentId && focusDocumentId !== seenFocus) {
    setSeenFocus(focusDocumentId);
    setPickedId(focusDocumentId);
    setFilter("all");
    setQuery("");
  }

  useEffect(() => {
    if (!focusDocumentId) return;
    rows.current[focusDocumentId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => onFocused?.(), 1600);
    return () => clearTimeout(timer);
  }, [focusDocumentId, onFocused]);

  const add = (picked: File[]) => {
    const { accepted, rejected } = checkFiles(picked, limits);
    setFailed(rejected);
    if (!accepted.length) return;
    upload.mutate(accepted, { onSuccess: (r) => setFailed((prev) => [...prev, ...r.failed.map((f) => f.reason)]) });
  };

  const retry = () => {
    const files = leftOver;
    useFailedUploads.getState().clear(c.id);
    setFailed([]);
    upload.mutate(files, {
      onSuccess: (r) => {
        setFailed(r.failed.map((f) => f.reason));
        // Whatever still failed stays available to try again.
        const stillFailed = files.filter((f) => r.failed.some((x) => x.name === f.name));
        useFailedUploads.getState().set(c.id, stillFailed);
      },
    });
  };

  const usedCount = (d: CaseDocument) => citations.get(d.id)?.length ?? 0;
  const tests: Record<FilterKey, (d: CaseDocument) => boolean> = {
    all: () => true,
    attention: (d) => d.status === "FAILED",
    used: (d) => usedCount(d) > 0,
    unused: (d) => d.status === "READY" && usedCount(d) === 0,
  };

  const needle = query.trim().toLowerCase();
  const visible = c.documents
    .filter((d) => tests[filter](d) && (!needle || d.name.toLowerCase().includes(needle)))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "cited") return usedCount(b) - usedCount(a);
      const diff = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      return sort === "oldest" ? diff : -diff;
    });

  const selected = c.documents.find((d) => d.id === pickedId) ?? visible[0] ?? null;
  const totalBytes = c.documents.reduce((sum, d) => sum + (d.size ?? 0), 0);
  const hasAny = c.documents.length > 0 || uploading.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                add(Array.from(e.dataTransfer.files));
              }}
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
                    opening={opener.pending}
                    rowRef={(el) => {
                      rows.current[d.id] = el;
                    }}
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
                  opening={opener.pending}
                  openError={opener.error?.message}
                  onRemove={() => setConfirmingId(selected.id)}
                  onOpenOverview={onOpenOverview}
                />
              )}
            </div>
          </>
        )}
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
