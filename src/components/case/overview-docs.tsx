"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { useUploadDocumentsMutation } from "@/lib/cases/queries";
import { useFailedUploads, useFailedUploadsOf } from "@/lib/failed-uploads";
import { cn } from "@/lib/cn";
import type { Case, DocumentStatus } from "@/lib/types";

// Overview moved to components/case/overview/overview.tsx (#45). This file keeps the Documents
// tab, which Overview's document links switch to (via focusDocumentId below).

const STATUS_TEXT: Record<DocumentStatus, string> = {
  PENDING: "Reading…",
  READY: "Ready",
  FAILED: "Couldn't read this file",
};

export function Documents({
  c,
  focusDocumentId,
  onFocused,
}: {
  c: Case;
  /** Scrolled into view and briefly highlighted once — a document link from Overview (#45). */
  focusDocumentId?: string | null;
  onFocused?: () => void;
}) {
  const upload = useUploadDocumentsMutation(c.id);
  const { data: limits } = useLimitsQuery();
  const [failed, setFailed] = useState<string[]>([]);
  /** Files from the wizard that didn't upload when the case was made (kept in memory only). */
  const leftOver = useFailedUploadsOf(c.id);
  const rows = useRef<Record<string, HTMLDivElement | null>>({});

  // Highlight follows focusDocumentId directly (no state of its own) — onFocused clears it in
  // the parent once the highlight has had time to be seen, which ends it here too.
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 py-7 md:px-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-normal tracking-[-0.02em]">Documents</h2>
          <FilePicker onPick={add}>
            {(open) => (
              <Button variant="outline" onClick={open} disabled={upload.isPending}>
                <Plus size={14} />
                {upload.isPending ? "Uploading…" : "Add"}
              </Button>
            )}
          </FilePicker>
        </div>
        {leftOver.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-error-line bg-error-bg px-4 py-3">
            <div className="min-w-[200px] flex-1 text-[13px] leading-[1.5] text-error-ink">
              {leftOver.length === 1 ? "1 file didn't" : `${leftOver.length} files didn't`} upload when your case was created:{" "}
              {leftOver.map((f) => f.name).join(", ")}.
            </div>
            <Button variant="outline" onClick={retry} disabled={upload.isPending}>
              <RotateCw size={14} />
              Try again
            </Button>
          </div>
        )}
        {failed.length > 0 && <div className="text-[13px] text-error">{failed.join(" ")}</div>}
        {c.documents.length === 0 && (
          <div className="text-sm text-ink-2">
            No documents yet. Add contracts, messages or notices so the AI can use them.
          </div>
        )}
        {c.documents.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-card border border-line">
            {c.documents.map((d) => (
              <div
                key={d.id}
                ref={(el) => {
                  rows.current[d.id] = el;
                }}
                className={cn(
                  "flex items-center gap-3 border-b border-line px-[18px] py-[14px] text-sm transition-colors last:border-b-0",
                  focusDocumentId === d.id && "bg-chip",
                )}
              >
                <FileText size={16} className="text-gold" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className={d.status === "FAILED" ? "text-xs text-error" : "text-xs text-muted"}>
                  {STATUS_TEXT[d.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
