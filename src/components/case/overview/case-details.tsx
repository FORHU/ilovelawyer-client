"use client";

import { useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { EditCaseModal } from "@/components/case/edit-case-modal";
import { formatBudget } from "@/lib/cases/budget";
import { parseNotes } from "@/lib/cases/notes";
import { areasLabel, regionLabel, sideLabel, type Case } from "@/lib/types";
import { useSite } from "@/components/site/site-provider";
import { useT } from "@/components/site/language-provider";

/** The intake form's own answers, as a collapsible block (A2's Edit action is unchanged) — kept
 * out of the way once there's an overview to read, open by default before there is one. */
export function CaseDetails({ c, defaultOpen }: { c: Case; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const notes = parseNotes(c.notes);
  const { regionQuestion, clientRequests } = useSite();
  const t = useT();

  const rows: { k: string; v: string }[] = [
    { k: t("Case title"), v: c.title },
    { k: t("Type of issue"), v: areasLabel(c.areas) },
    ...(regionQuestion ? [{ k: "Part of the UK", v: regionLabel(c) }] : []),
    { k: t("Town or city"), v: c.where || t("Not set") },
    { k: t("Your side"), v: sideLabel(c.side) },
    { k: t("Others involved"), v: c.others.length ? c.others.map((o) => `${o.name} (${t(o.role)})`).join(", ") : t("None added") },
    { k: t("What happened"), v: notes.happened || t("Not added") },
    { k: t("What you want"), v: notes.wants || t("Not added") },
    // A budget is for lawyers: only where they take requests.
    ...(clientRequests === "open" ? [{ k: "Budget", v: formatBudget(c.budget ?? null) }] : []),
    { k: t("Documents"), v: t("{n} attached", { n: c.documents.length }) },
  ];

  return (
    <section className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-center gap-2 py-3 pl-2 pr-3.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          data-no-tap
          className="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-1.5 text-left font-medium max-md:min-h-11"
        >
          <ChevronRight size={16} aria-hidden className={`shrink-0 text-ink-2 transition-transform ${open ? "rotate-90" : ""}`} />
          {t("Case details")}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          data-no-tap
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3 text-xs font-semibold text-gold hover:text-gold-hover max-md:h-11 max-md:px-4"
        >
          <Pencil size={12} aria-hidden />
          {t("Edit")}
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
