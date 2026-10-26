"use client";

import { useEffect, useRef, type Ref } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { useDeleteDocumentMutation, useDocumentUrlMutation, useRetryDocumentMutation } from "@/lib/cases/queries";
import { formatBytes, formatDay } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CaseDocument, DocumentStatus } from "@/lib/types";

const STATUS_TEXT: Record<DocumentStatus, string> = {
  PENDING: "Reading…",
  READY: "Ready",
  FAILED: "Couldn't read this file",
};

/** 44px to tap on a phone, the usual 36px from md up (as get-lawyer-action.tsx). */
const ACTION = "h-11 !px-3 md:h-9";

/** One document on the Documents tab: its size, date and status, and View, Retry (when it couldn't be
 * read) and Remove. Remove asks first, in the row itself. */
export function DocumentRow({
  caseId,
  d,
  focused,
  confirming,
  onConfirmChange,
  rowRef,
}: {
  caseId: string;
  d: CaseDocument;
  /** Briefly highlighted: a document link from Overview landed here. */
  focused: boolean;
  /** This row is asking whether to remove the document. One row at a time (Documents keeps which). */
  confirming: boolean;
  onConfirmChange: (confirming: boolean) => void;
  rowRef: Ref<HTMLDivElement>;
}) {
  const remove = useDeleteDocumentMutation(caseId);
  const retry = useRetryDocumentMutation(caseId);
  const link = useDocumentUrlMutation(caseId);
  const removeButton = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(confirming);

  // Backing out of the question puts focus back on the Remove button that asked it.
  useEffect(() => {
    if (wasConfirming.current && !confirming) removeButton.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const view = () => {
    // Opened now, while this is still the click: a tab opened after the request comes back counts
    // as a popup, and iOS Safari blocks it.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    link.mutate(d.id, {
      onSuccess: ({ url }) => {
        // The API's link is a path on this app (app/files/[token]); the blank tab has no base to read it against.
        const href = new URL(url, window.location.origin).href;
        if (tab) tab.location.href = href;
        else window.location.assign(href);
      },
      onError: () => tab?.close(),
    });
  };

  const error = remove.error ?? retry.error ?? link.error;
  const meta = [d.size != null ? formatBytes(d.size) : null, formatDay(d.uploadedAt)].filter(Boolean).join(" · ");

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex flex-col gap-2 border-b border-line px-[18px] py-[14px] text-sm transition-colors last:border-b-0",
        focused && "bg-chip",
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <FileText size={16} className="mt-0.5 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <div className="truncate">{d.name}</div>
            <div className="text-xs text-muted">
              {meta} · <span className={d.status === "FAILED" ? "text-error" : undefined}>{STATUS_TEXT[d.status]}</span>
            </div>
          </div>
        </div>
        {confirming ? (
          <div
            className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0"
            onKeyDown={(e) => {
              if (e.key === "Escape") onConfirmChange(false);
            }}
          >
            <span className="basis-full text-[13px] text-ink-2 sm:basis-auto">Remove this document? The overview will need updating.</span>
            <Button variant="outline" size="sm" className={ACTION} autoFocus onClick={() => onConfirmChange(false)} disabled={remove.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              className={ACTION}
              disabled={remove.isPending}
              onClick={() => remove.mutate(d.id, { onSuccess: () => onConfirmChange(false) })}
            >
              {remove.isPending ? "Removing…" : "Remove"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1 pl-4 sm:pl-0">
            <Button variant="ghost" size="sm" className={ACTION} onClick={view} disabled={link.isPending}>
              {link.isPending ? "Opening…" : "View"}
            </Button>
            {d.status === "FAILED" && (
              <Button variant="ghost" size="sm" className={ACTION} onClick={() => retry.mutate(d.id)} disabled={retry.isPending}>
                {retry.isPending ? "Retrying…" : "Retry"}
              </Button>
            )}
            <Button
              ref={removeButton}
              variant="ghost"
              size="sm"
              className={ACTION}
              onClick={() => {
                remove.reset();
                onConfirmChange(true);
              }}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
      {error && <ErrorBox message={error.message} />}
    </div>
  );
}

/** A file on its way up: shown in the list until the upload finishes and the real row replaces it. */
export function UploadingRow({ file }: { file: File }) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-[18px] py-[14px] text-sm last:border-b-0">
      <FileText size={16} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-ink-2">{file.name}</div>
        <div className="text-xs text-muted">{formatBytes(file.size)} · Uploading…</div>
      </div>
    </div>
  );
}
