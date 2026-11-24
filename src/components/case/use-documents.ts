"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { useSensitiveInfoGate } from "@/lib/consent/sensitive-info";
import { citationsByDocument } from "@/lib/cases/citations";
import { useIntakeQuery, useUploadDocumentsMutation, useUploadForGapMutation, useUploadingFiles } from "@/lib/cases/queries";
import { applyDocumentView, filterTests, type FilterKey, type SortKey } from "@/lib/documents/filter-sort";
import { nextSuggestedGap, useMissingEvidenceQuery } from "@/lib/documents/evidence-gaps";
import { useFailedUploads, useFailedUploadsOf } from "@/lib/failed-uploads";
import type { Case, CaseDocument } from "@/lib/types";
import { useFileDrop } from "@/lib/use-file-drop";
import { useOpenDocument } from "./document-row";

/** Everything the Documents tab reads and does, shared by its desktop and mobile views. The views
 * only decide how it is laid out. */
export function useDocuments(c: Case, focusDocumentId?: string | null, onFocused?: () => void) {
  const upload = useUploadDocumentsMutation(c.id);
  const uploadForGapMutation = useUploadForGapMutation(c.id);
  const ensureAgreed = useSensitiveInfoGate();
  const { data: limits } = useLimitsQuery();
  const { data: intake } = useIntakeQuery(c.id, c.documents.some((d) => d.status === "PENDING"));
  const { data: missingEvidence } = useMissingEvidenceQuery(c.id);
  const [failed, setFailed] = useState<string[]>([]);
  const citations = useMemo(() => citationsByDocument(intake), [intake]);
  const opener = useOpenDocument(c.id, c.documents);
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

  const add = async (picked: File[]) => {
    const { accepted, rejected } = checkFiles(picked, limits);
    setFailed(rejected);
    if (!accepted.length) return;
    // Asked once, before the first file would reach the AI (#173). Without agreeing it still uploads,
    // and waits, unread, until they do.
    await ensureAgreed();
    upload.mutate(accepted, { onSuccess: (r) => setFailed((prev) => [...prev, ...r.failed.map((f) => f.reason)]) });
  };

  const { dragging, dragProps } = useFileDrop(add);

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
  const tests = filterTests(usedCount);
  const needle = query.trim().toLowerCase();
  const visible = applyDocumentView(c.documents, { filter, sort, query }, usedCount);

  // Only a document the list is showing can be the one picked, so its Remove has a row to confirm in.
  const picked = visible.find((d) => d.id === pickedId) ?? null;
  const totalBytes = c.documents.reduce((sum, d) => sum + (d.size ?? 0), 0);
  const hasAny = c.documents.length > 0 || uploading.length > 0;
  // #159: CW's pick of the single most useful thing to upload next, from the case's open
  // CaseMissingEvidence gaps — not CaseIntake.missing, see evidence-gaps.ts's own note on why.
  const nextGap = nextSuggestedGap(missingEvidence);
  const uploadForGap = async (gapId: string, file: File) => {
    // Same consent gate as `add` above (#173): a gap-targeted upload reaches the AI exactly the
    // same way a plain one does, so it needs the same wait, not a second path that skips it.
    await ensureAgreed();
    uploadForGapMutation.mutate({ file, missingEvidenceId: gapId });
  };

  return {
    upload, limits, failed, citations, opener, leftOver, uploading, confirmingId, setConfirmingId, filter, setFilter, sort, setSort,
    query, setQuery, setPickedId, dragging, dragProps, add, retry, usedCount, tests, needle, visible, picked, totalBytes, hasAny, intake,
    missingEvidence, nextGap, uploadForGap,
    registerRow: (id: string) => (el: HTMLDivElement | null) => {
      rows.current[id] = el;
    },
  };
}
