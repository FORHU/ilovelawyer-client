"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { KeyValueTable } from "@/components/ui/misc";
import { useUploadDocumentsMutation } from "@/lib/cases/queries";
import { AREA_LABELS, regionLabel, sideLabel, type Case, type DocumentStatus } from "@/lib/types";

export function Overview({ c }: { c: Case }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 py-7 md:px-10">
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
  const [failed, setFailed] = useState<string[]>([]);

  const add = (files: File[]) => {
    setFailed([]);
    upload.mutate(files, { onSuccess: (r) => setFailed(r.failed.map((f) => f.reason)) });
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
