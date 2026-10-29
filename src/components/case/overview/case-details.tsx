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
    <section className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-center gap-2 py-3 pl-2 pr-3.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          data-no-tap
          className="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-1.5 text-left font-medium"
        >
          <ChevronRight size={16} aria-hidden className={`shrink-0 text-ink-2 transition-transform ${open ? "rotate-90" : ""}`} />
          Case details
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          data-no-tap
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3 text-xs font-semibold text-gold hover:text-gold-hover"
        >
          <Pencil size={12} aria-hidden />
          Edit
        </button>
      </div>
      {open && (
        <dl className="border-t border-line text-[13px]">
          {rows.map((r) => (
            <div key={r.k} className="border-b border-line px-3.5 py-[9px] last:border-b-0">
              <dt className="text-[11.5px] text-ink-2">{r.k}</dt>
              <dd className="m-0 break-words">{r.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {editing && <EditCaseModal c={c} onClose={() => setEditing(false)} />}
    </section>
  );
}
