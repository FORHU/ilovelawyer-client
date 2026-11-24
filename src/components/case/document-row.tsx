"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { ActionMenu } from "@/components/ui/action-menu";
import { useDeleteDocumentMutation, useDocumentUrlMutation, useRetryDocumentMutation } from "@/lib/cases/queries";
import { formatBytes, formatDay } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DocumentPreviewModal } from "./document-preview-modal";
import type { CaseDocument, DocumentStatus } from "@/lib/types";
import { useT } from "@/components/site/language-provider";
import { useSensitiveInfoStatus } from "@/lib/consent/sensitive-info";
import { msg } from "@/lib/i18n/msg";
import { tr, type T } from "@/lib/i18n/translate";

/** Name, status and "In overview" columns on a wide screen; the status and use drop under the name on a phone. */
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_32px] items-center gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1fr)_132px_120px_32px]";

export function TableHead() {
  const t = useT();
  return (
    <div className={cn(ROW_GRID, "hidden border-b border-line bg-subtle px-[18px] py-2.5 text-[10.5px] font-semibold uppercase tracking-[1px] text-ink-2 md:grid")}>
      <span>{t("Name")}</span>
      <span>{t("Status")}</span>
      <span>{t("In overview")}</span>
      <span />
    </div>
  );
}

export const DOCUMENT_STATUS: Record<DocumentStatus, { text: string; className: string }> = {
  READY: { text: msg("Ready"), className: "bg-success-bg text-success-ink" },
  PENDING: { text: msg("Reading…"), className: "bg-warn-bg text-warn-ink" },
  FAILED: { text: msg("Couldn't read"), className: "bg-error-bg text-error-ink" },
};

/** The status to show for a document. One still waiting to be read is held back, not slow, when the
 * client hasn't agreed to the AI reading sensitive information (#173): it is read once they do. */
export function useDocumentStatus(d: CaseDocument) {
  const consent = useSensitiveInfoStatus();
  if (d.status === "PENDING" && (consent === "withdrawn" || consent === "not_set")) {
    return { text: msg("Waiting for your agreement"), className: "bg-chip text-ink-2" };
  }
  return DOCUMENT_STATUS[d.status];
}

/** "Used in 2 items", "Not used yet", or `none` while it isn't ready. */
export function usedLabel(t: T, usedIn: number, ready: boolean, none: string) {
  if (usedIn > 0) return usedIn === 1 ? t("Used in {n} item", { n: 1 }) : t("Used in {n} items", { n: usedIn });
  return ready ? t("Not used yet") : none;
}

type Kind = "PDF" | "DOC" | "XLS" | "IMG" | "TXT";

const KIND_STYLE: Record<Kind, string> = {
  PDF: "bg-error-bg text-error-ink",
  DOC: "bg-info-bg text-info-ink",
  XLS: "bg-success-bg text-success-ink",
  IMG: "bg-success-bg text-success-ink",
  TXT: "bg-chip text-ink-soft",
};

/** What a file is, from its extension, for the badge beside its name. */
export function fileKind(name: string): Kind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
  if (ext === "doc" || ext === "docx") return "DOC";
  if (ext === "xlsx" || ext === "xls") return "XLS";
  if (["jpg", "jpeg", "png"].includes(ext)) return "IMG";
  return "TXT";
}

export function KindBadge({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const kind = fileKind(name);
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] text-[10px] font-bold tracking-[0.5px]",
        size === "lg" ? "size-12" : "size-[38px]",
        KIND_STYLE[kind],
      )}
    >
      {kind}
    </span>
  );
}

/** Opens a document over the page (a short-lived link from the API, shown in DocumentPreviewModal).
 * One at a time: while a link is being fetched, a second click does nothing, and it says which
 * document is opening or failed. Render `modal` once in the view that uses it. */
export function useOpenDocument(caseId: string, documents: CaseDocument[]) {
  const link = useDocumentUrlMutation(caseId);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const [opened, setOpened] = useState<{ name: string; url: string } | null>(null);
  const open = (id: string) => {
    if (link.isPending) return;
    setFailure(null);
    link.mutate(id, {
      onSuccess: ({ url }) => {
        // The API's link is a path on this app (app/files/[token]); the viewer needs it absolute to fetch it.
        const name = documents.find((d) => d.id === id)?.name ?? tr("Document");
        setOpened({ name, url: new URL(url, window.location.origin).href });
      },
      onError: (err) => setFailure({ id, message: err.message }),
    });
  };
  return {
    open,
    openingId: link.isPending ? (link.variables ?? null) : null,
    errorFor: (id: string) => (failure?.id === id ? failure.message : undefined),
    modal: opened ? <DocumentPreviewModal name={opened.name} url={opened.url} onClose={() => setOpened(null)} /> : null,
  };
}

/** "182 KB · 12 Oct 2026" */
export function documentMeta(d: CaseDocument) {
  return [d.size != null ? formatBytes(d.size) : null, formatDay(d.uploadedAt)].filter(Boolean).join(" · ");
}

/** One document in the Documents table: its name, status and how much of the overview cites it. A
 * file that couldn't be read says why and offers Retry; Remove asks first, in the row itself. */
export function DocumentRow({
  caseId,
  d,
  selected,
  onSelect,
  confirming,
  onConfirmChange,
  usedIn = 0,
  rowRef,
  onOpen,
  opening,
}: {
  caseId: string;
  d: CaseDocument;
  /** The document the side panel is showing. */
  selected: boolean;
  onSelect: () => void;
  /** This row is asking whether to remove the document. One row at a time (Documents keeps which). */
  confirming: boolean;
  onConfirmChange: (confirming: boolean) => void;
  /** How many overview items cite this document (Overview's intake sources). */
  usedIn?: number;
  rowRef: Ref<HTMLDivElement>;
  onOpen: () => void;
  opening: boolean;
}) {
  const remove = useDeleteDocumentMutation(caseId);
  const retry = useRetryDocumentMutation(caseId);
  const selectButton = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(confirming);

  // Backing out of the question puts focus back on the row.
  useEffect(() => {
    if (wasConfirming.current && !confirming) selectButton.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const t = useT();
  const status = useDocumentStatus(d);
  const error = remove.error ?? retry.error;
  const used = usedLabel(t, usedIn, d.status === "READY", "—");

  const askRemove = () => {
    remove.reset();
    onConfirmChange(true);
  };

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex flex-col gap-2.5 border-b border-line px-[18px] py-3 text-sm transition-colors last:border-b-0",
        selected ? "bg-chip shadow-[inset_3px_0_0_var(--color-gold)]" : "bg-surface",
      )}
    >
      <div className={ROW_GRID}>
        <button
          ref={selectButton}
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          data-no-tap
          className="flex min-h-[44px] min-w-0 items-center gap-3 text-left md:min-h-0"
        >
          <KindBadge name={d.name} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{d.name}</span>
            <span className="text-xs text-ink-2">{documentMeta(d)}</span>
          </span>
        </button>
        <ActionMenu
          label={t("More actions for {name}", { name: d.name })}
          className="md:order-last"
          items={[
            { label: opening ? t("Opening…") : t("Open"), onSelect: onOpen, disabled: opening },
            ...(d.status === "FAILED" ? [{ label: retry.isPending ? t("Retrying…") : t("Retry reading"), onSelect: () => retry.mutate(d.id), disabled: retry.isPending }] : []),
            { label: t("Remove"), onSelect: askRemove, danger: true },
          ]}
        />
        <span className={cn("col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 md:contents")}>
          <span className={cn("justify-self-start rounded-full px-2.5 py-[3px] text-xs font-medium", status.className)}>{t(status.text)}</span>
          <span className={cn("text-[12.5px]", usedIn > 0 ? "text-gold" : "text-ink-2")}>{used}</span>
        </span>
      </div>

      {d.status === "FAILED" && !confirming && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-error-line bg-error-bg px-3 py-2.5 text-[12.5px] text-error-ink">
          <span className="min-w-[200px] flex-1">{t("We couldn't read this file. Try a PDF or a clearer scan — your lawyer can still see it.")}</span>
          <Button variant="soft" size="sm" className="!h-[30px] !px-3 !text-xs" onClick={() => retry.mutate(d.id)} disabled={retry.isPending}>
            {retry.isPending ? t("Retrying…") : t("Retry")}
          </Button>
        </div>
      )}

      {confirming && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl border border-error-line bg-error-bg px-3 py-2.5"
          onKeyDown={(e) => {
            if (e.key === "Escape") onConfirmChange(false);
          }}
        >
          <span className="min-w-[200px] flex-1 text-[13px] text-error-ink">{t("Remove this document? The overview will need updating.")}</span>
          <Button variant="soft" size="sm" autoFocus onClick={() => onConfirmChange(false)} disabled={remove.isPending}>
            {t("Cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="!normal-case !text-[13px] !font-semibold tracking-normal"
            disabled={remove.isPending}
            onClick={() => remove.mutate(d.id, { onSuccess: () => onConfirmChange(false) })}
          >
            {remove.isPending ? t("Removing…") : t("Remove")}
          </Button>
        </div>
      )}
      {error && <ErrorBox message={error.message} />}
    </div>
  );
}

/** A file on its way up: shown in the table until the upload finishes and the real row replaces it. */
export function UploadingRow({ file }: { file: File }) {
  const t = useT();
  return (
    <div className={cn(ROW_GRID, "border-b border-line px-[18px] py-3 text-sm last:border-b-0")}>
      <div className="flex min-w-0 items-center gap-3">
        <KindBadge name={file.name} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink-2">{file.name}</span>
          <span className="text-xs text-ink-2">{formatBytes(file.size)}</span>
        </span>
      </div>
      <span role="status" className="col-span-2 justify-self-start rounded-full bg-chip px-2.5 py-[3px] text-xs font-medium text-ink-2 md:col-span-1">
        {t("Uploading…")}
      </span>
    </div>
  );
}
