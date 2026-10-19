"use client";

import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeyValueTable } from "@/components/ui/misc";
import { useApp } from "@/lib/store";
import { sideLabel, type Case } from "@/lib/types";

export function Overview({ c }: { c: Case }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 py-7 md:px-10">
        <KeyValueTable
          rows={[
            { k: "Case title", v: c.title },
            { k: "Type of issue", v: c.area },
            { k: "Location", v: c.where || "Not set" },
            { k: "Your side", v: sideLabel(c.side) },
            {
              k: "Others involved",
              v: c.others.length
                ? c.others.map((o) => `${o.name} (${o.role})`).join(", ")
                : "None added",
            },
            { k: "Documents", v: `${c.files.length} attached` },
          ]}
        />
        <div className="text-xs text-muted">You can edit these details any time.</div>
      </div>
    </div>
  );
}

export function Documents({ c }: { c: Case }) {
  const addCaseFile = useApp((s) => s.addCaseFile);
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 py-7 md:px-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-normal tracking-[-0.02em]">Documents</h2>
          <Button variant="outline" onClick={() => addCaseFile(c.id)}>
            <Plus size={14} />
            Add
          </Button>
        </div>
        {c.files.length === 0 && (
          <div className="text-sm text-ink-2">
            No documents yet. Add contracts, messages or notices so the AI can use them.
          </div>
        )}
        <div className="flex flex-col overflow-hidden rounded-card border border-line">
          {c.files.map((f) => (
            <div
              key={f}
              className="flex items-center gap-3 border-b border-line px-[18px] py-[14px] text-sm last:border-b-0"
            >
              <FileText size={16} className="text-gold" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
