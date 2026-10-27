"use client";

import { useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { EditCaseModal } from "@/components/case/edit-case-modal";
import { parseNotes } from "@/lib/cases/notes";
import { areasLabel, regionLabel, sideLabel, type Case } from "@/lib/types";

/** The intake form's own answers, as a collapsible block (A2's Edit action is unchanged) — kept
 * out of the way once there's an overview to read, open by default before there is one. */
export function CaseDetails({ c, defaultOpen }: { c: Case; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const notes = parseNotes(c.notes);

  const rows: { k: string; v: string }[] = [
    { k: "Case title", v: c.title },
    { k: "Type of issue", v: areasLabel(c.areas) },
    { k: "Part of the UK", v: regionLabel(c.ukJurisdiction) },
    { k: "Town or city", v: c.where || "Not set" },
    { k: "Your side", v: sideLabel(c.side) },
    { k: "Others involved", v: c.others.length ? c.others.map((o) => `${o.name} (${o.role})`).join(", ") : "None added" },
    { k: "What happened", v: notes.happened || "Not added" },
    { k: "What you want", v: notes.wants || "Not added" },
    { k: "Documents", v: `${c.documents.length} attached` },
  ];

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-[14px] py-3 text-left"
      >
        <ChevronRight size={16} className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="min-w-0 flex-1 font-medium">Case details</span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              setEditing(true);
            }
          }}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-gold hover:text-gold-hover"
        >
          <Pencil size={12} />
          Edit
        </span>
      </button>
      {open && (
        <dl className="border-t border-line">
          {rows.map((r) => (
            <div key={r.k} className="flex flex-col gap-0.5 border-b border-line px-[14px] py-2.5 text-sm last:border-b-0">
              <dt className="text-xs text-muted">{r.k}</dt>
              <dd className="m-0 break-words">{r.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {editing && <EditCaseModal c={c} onClose={() => setEditing(false)} />}
    </div>
  );
}
