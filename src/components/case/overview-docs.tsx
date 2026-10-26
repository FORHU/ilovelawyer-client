"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { useIntakeQuery, useUploadDocumentsMutation, useUploadingFiles } from "@/lib/cases/queries";
import { useFailedUploads, useFailedUploadsOf } from "@/lib/failed-uploads";
import type { Case } from "@/lib/types";
import { DocumentRow, UploadingRow } from "./document-row";

// Overview moved to components/case/overview/overview.tsx (#45). This file keeps the Documents
// tab, which Overview's document links switch to (via focusDocumentId below).

/** How many overview items cite each document, from every sourced list in the intake. */
function usageCounts(itemLists: { sources: { kind: string; documentId: string | null }[] }[][]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const list of itemLists) {
    for (const item of list) {
      for (const s of item.sources) {
        if (s.kind !== "DOCUMENT" || !s.documentId) continue;
        counts.set(s.documentId, (counts.get(s.documentId) ?? 0) + 1);
      }
    }
  }
  return counts;
}

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
  const { data: intake } = useIntakeQuery(c.id, c.documents.some((d) => d.status === "PENDING"));
  const [failed, setFailed] = useState<string[]>([]);
  const usedIn = useMemo(
    () =>
      usageCounts(
        intake
          ? [intake.people, intake.timeline, intake.facts, intake.goals, intake.concerns, intake.questionsForLawyer, intake.deadlines, intake.conflicts]
          : [],
      ),
    [intake],
  );
  /** Files from the wizard that didn't upload when the case was made (kept in memory only). */
  const leftOver = useFailedUploadsOf(c.id);
  const rows = useRef<Record<string, HTMLDivElement | null>>({});
  /** Files still uploading, here or from the chat: listed as rows until they're on the case. */
  const uploading = useUploadingFiles(c.id);
  /** The row asking whether to remove its document, if any. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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
              <Button variant="outline" onClick={open}>
                <Plus size={14} />
                Add
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
        {c.documents.length === 0 && uploading.length === 0 && (
          <div className="text-sm text-ink-2">
            No documents yet. Add contracts, messages or notices so the AI can use them.
          </div>
        )}
        {(c.documents.length > 0 || uploading.length > 0) && (
          <div className="flex flex-col overflow-hidden rounded-card border border-line">
            {c.documents.map((d) => (
              <DocumentRow
                key={d.id}
                caseId={c.id}
                d={d}
                focused={focusDocumentId === d.id}
                confirming={confirmingId === d.id}
                onConfirmChange={(on) => setConfirmingId(on ? d.id : null)}
                usedIn={usedIn.get(d.id) ?? 0}
                rowRef={(el) => {
                  rows.current[d.id] = el;
                }}
              />
            ))}
            {uploading.map((file, i) => (
              <UploadingRow key={`${file.name}-${i}`} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
