"use client";

import { useState, type Ref } from "react";
import { Eye, Lock, MoreHorizontal, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { BottomSheet, SheetRow } from "@/components/mobile/bottom-sheet";
import { useDeleteDocumentMutation, useRetryDocumentMutation } from "@/lib/cases/queries";
import { cn } from "@/lib/cn";
import type { CaseDocument, DocumentStatus } from "@/lib/types";
import { KindBadge, documentMeta } from "./document-row";

const STATUS: Record<DocumentStatus, { text: string; className: string }> = {
  READY: { text: "Ready", className: "bg-success-bg text-success-ink" },
  PENDING: { text: "Reading…", className: "bg-warn-bg text-warn-ink" },
  FAILED: { text: "Couldn't read", className: "bg-error-bg text-error-ink" },
};

/** One document on a phone: a card. Tapping it opens its details in a sheet; the "…" opens the
 * short list of things to do with it. Remove asks first, in the details sheet. */
export function DocumentCardMobile({
  caseId,
  d,
  usedIn,
  cites,
  highlighted,
  onOpen,
  opening,
  openError,
  onOpenOverview,
  rowRef,
}: {
  caseId: string;
  d: CaseDocument;
  /** How many overview items cite this document. */
  usedIn: number;
  cites: { label: string }[];
  /** Brought here from an Overview source: shown for a moment. */
  highlighted: boolean;
  onOpen: () => void;
  opening: boolean;
  openError?: string;
  onOpenOverview: () => void;
  rowRef: Ref<HTMLDivElement>;
}) {
  const remove = useDeleteDocumentMutation(caseId);
  const retry = useRetryDocumentMutation(caseId);
  const [sheet, setSheet] = useState<"details" | "actions" | null>(null);
  const [confirming, setConfirming] = useState(false);

  const status = STATUS[d.status];
  const used = usedIn > 0 ? `Used in ${usedIn} ${usedIn === 1 ? "item" : "items"}` : d.status === "READY" ? "Not used yet" : "";
  const close = () => {
    setSheet(null);
    setConfirming(false);
  };
  const none =
    d.status === "PENDING"
      ? "Still reading this file — it will show up here when it is done."
      : d.status === "FAILED"
        ? "This file couldn't be read, so the AI can't use it yet."
        : "Nothing in your overview comes from this file yet.";

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex flex-col rounded-card border bg-white transition-colors",
        highlighted ? "border-gold bg-warn-bg" : "border-line",
      )}
    >
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          onClick={() => setSheet("details")}
          data-no-tap
          className="flex min-h-[68px] min-w-0 flex-1 items-center gap-3 rounded-card px-3 text-left active:bg-chip"
        >
          <KindBadge name={d.name} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-medium">{d.name}</span>
            <span className="text-[12.5px] text-ink-2">{documentMeta(d)}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("rounded-full px-2 py-[2px] text-[11.5px] font-medium", status.className)}>{status.text}</span>
              {used && <span className={cn("text-[12px]", usedIn > 0 ? "text-gold" : "text-ink-2")}>{used}</span>}
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label={`More actions for ${d.name}`}
          onClick={() => setSheet("actions")}
          data-no-tap
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 active:bg-chip"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </div>

      {d.status === "FAILED" && (
        <div className="mx-3 mb-3 flex flex-col gap-2 rounded-xl border border-error-line bg-error-bg px-3 py-2.5 text-[13px] text-error-ink">
          <span>We couldn&apos;t read this file. Try a PDF or a clearer scan — your lawyer can still see it.</span>
          <Button variant="soft" size="lg" className="w-full" onClick={() => retry.mutate(d.id)} disabled={retry.isPending}>
            <RotateCw size={14} aria-hidden />
            {retry.isPending ? "Retrying…" : "Retry reading"}
          </Button>
        </div>
      )}
      {retry.error && sheet === null && (
        <div className="px-3 pb-3">
          <ErrorBox message={retry.error.message} />
        </div>
      )}

      <BottomSheet open={sheet === "actions"} onClose={close} title={d.name}>
        <SheetRow
          icon={<Eye size={18} />}
          disabled={opening}
          // Opened inside this tap, before anything else: a tab opened later is blocked on iOS.
          onSelect={() => {
            onOpen();
            close();
          }}
        >
          {opening ? "Opening…" : "Open"}
        </SheetRow>
        {d.status === "FAILED" && (
          <SheetRow
            icon={<RotateCw size={18} />}
            disabled={retry.isPending}
            onSelect={() => {
              retry.mutate(d.id);
              close();
            }}
          >
            {retry.isPending ? "Retrying…" : "Retry reading"}
          </SheetRow>
        )}
        <SheetRow
          icon={<Trash2 size={18} />}
          danger
          onSelect={() => {
            remove.reset();
            setConfirming(true);
            setSheet("details");
          }}
        >
          Remove
        </SheetRow>
      </BottomSheet>

      <BottomSheet open={sheet === "details"} onClose={close} title="Document">
        <div className="flex flex-col gap-4 px-3 pb-2 pt-1">
          <div className="flex items-center gap-3">
            <KindBadge name={d.name} size="lg" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="break-words text-[16px] font-semibold">{d.name}</span>
              <span className="text-[13px] text-ink-2">{documentMeta(d)}</span>
            </div>
          </div>

          {confirming ? (
            <div className="flex flex-col gap-3 rounded-xl border border-error-line bg-error-bg p-3.5">
              <span className="text-[14px] leading-[1.45] text-error-ink">Remove this document? The overview will need updating.</span>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="soft" size="lg" onClick={() => setConfirming(false)} disabled={remove.isPending}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="!normal-case !text-[14px] !font-semibold tracking-normal"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(d.id, { onSuccess: close })}
                >
                  {remove.isPending ? "Removing…" : "Remove"}
                </Button>
              </div>
              {remove.error && <ErrorBox message={remove.error.message} />}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="dark"
                size="lg"
                className="w-full"
                disabled={opening}
                // Opened inside this tap, before anything else: a tab opened later is blocked on iOS.
                onClick={onOpen}
              >
                <Eye size={16} aria-hidden />
                {opening ? "Opening…" : "Open"}
              </Button>
              {openError && (
                <span role="alert" className="text-[13px] text-error">
                  {openError}
                </span>
              )}
              <Button
                variant="quiet"
                size="lg"
                className="w-full !text-error hover:!text-error-ink"
                onClick={() => {
                  remove.reset();
                  setConfirming(true);
                }}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[1px] text-ink-2">Cited in your overview</h3>
            {cites.length > 0 ? (
              <ul className="flex flex-col">
                {cites.map((cite, i) => (
                  <li key={`${cite.label}-${i}`}>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        onOpenOverview();
                      }}
                      data-no-tap
                      className="min-h-11 text-left text-[14px] text-gold underline"
                    >
                      {cite.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[14px] text-ink-2">{none}</span>
            )}
          </div>

          <div className="flex gap-2 rounded-xl bg-chip px-3 py-2.5 text-[12.5px] text-[#4a4a4a]">
            <Lock size={14} aria-hidden className="mt-px shrink-0" />
            <span>Only you can see this file. A lawyer sees it once you confirm them — before that, they only see an anonymised summary.</span>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
