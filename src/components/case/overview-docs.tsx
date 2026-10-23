"use client";

import { useState } from "react";
import { FileText, Pencil, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { KeyValueTable } from "@/components/ui/misc";
import { EditCaseModal } from "@/components/case/edit-case-modal";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { parseNotes } from "@/lib/cases/notes";
import { useUploadDocumentsMutation } from "@/lib/cases/queries";
import { useFailedUploads, useFailedUploadsOf } from "@/lib/failed-uploads";
import { AREA_LABELS, regionLabel, sideLabel, type Case, type DocumentStatus } from "@/lib/types";

export function Overview({ c }: { c: Case }) {
  const [editing, setEditing] = useState(false);
  const notes = parseNotes(c.notes);
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 py-7 md:px-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-ink-2">You can edit these details any time.</p>
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil size={14} />
            Edit
          </Button>
        </div>
        {editing && <EditCaseModal c={c} onClose={() => setEditing(false)} />}
        <KeyValueTable
          rows={[
            { k: "Case title", v: c.title },
            { k: "Type of issue", v: AREA_LABELS[c.area] },
            { k: "Part of the UK", v: regionLabel(c.ukJurisdiction) },
            { k: "Town or city", v: c.where || "Not set" },
            { k: "Your side", v: sideLabel(c.side) },
            {
              k: "Others involved",
              v: c.others.length
                ? c.others.map((o) => `${o.name} (${o.role})`).join(", ")
                : "None added",
            },
            { k: "What happened", v: notes.happened || "Not added" },
            { k: "What you want", v: notes.wants || "Not added" },
            { k: "Documents", v: `${c.documents.length} attached` },
          ]}
        />
      </div>
    </div>
  );
}

const STATUS_TEXT: Record<DocumentStatus, string> = {
  PENDING: "Reading…",
  READY: "Ready",
  FAILED: "Couldn't read this file",
};

export function Documents({ c }: { c: Case }) {
  const upload = useUploadDocumentsMutation(c.id);
  const { data: limits } = useLimitsQuery();
  const [failed, setFailed] = useState<string[]>([]);
  /** Files from the wizard that didn't upload when the case was made (kept in memory only). */
  const leftOver = useFailedUploadsOf(c.id);

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
                className="flex items-center gap-3 border-b border-line px-[18px] py-[14px] text-sm last:border-b-0"
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
