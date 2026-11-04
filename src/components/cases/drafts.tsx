"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { draftHref, draftTitle, draftWhen, useOwnDrafts, type SavedDraft } from "@/lib/cases/drafts";
import { toast } from "@/lib/toast";
import { deleteDraft, openDraft, startNewCase, useWizard } from "@/lib/wizard-store";

// Drafts: a New case left before the case was created (lib/cases/drafts.ts), listed in the sidebar
// and on the Cases page to continue or delete.

const savedToast = () => toast.success("Draft saved", { description: "Continue it any time from Drafts." });

/** New case and Continue: whatever was open on New case is saved as a draft on the way. */
export function useDraftNav() {
  const pathname = usePathname();
  const openId = useWizard((s) => s.draftId);
  const isOpen = (d: SavedDraft) => pathname === "/cases/new" && openId === d.id;

  const startNew = () => {
    if (startNewCase()) savedToast();
  };
  const open = (d: SavedDraft, e?: MouseEvent) => {
    // Already the one showing: nothing to do.
    if (isOpen(d)) {
      e?.preventDefault();
      return;
    }
    if (openDraft(d.id)) savedToast();
  };
  return { startNew, open, isOpen };
}

/** Asks before deleting a draft: unlike a case, there's no archive to get it back from. */
function useDeleteDraft() {
  const [asking, setAsking] = useState<SavedDraft | null>(null);
  const modal = (
    <Modal
      open={asking !== null}
      onClose={() => setAsking(null)}
      title="Delete this draft?"
      subtitle={asking ? `“${draftTitle(asking)}” and anything attached to it will be gone. This can't be undone.` : undefined}
    >
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="outline" size="lg" onClick={() => setAsking(null)}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="lg"
          onClick={() => {
            if (asking) deleteDraft(asking.id);
            setAsking(null);
          }}
        >
          Delete draft
        </Button>
      </div>
    </Modal>
  );
  return { ask: setAsking, modal };
}

const filesLabel = (n: number) => `${n} ${n === 1 ? "file" : "files"}`;

/** The sidebar's Drafts group, above Your cases. Collapsed: a dashed dot per draft. */
export function SidebarDrafts({ collapsed }: { collapsed: boolean }) {
  const drafts = useOwnDrafts();
  const nav = useDraftNav();
  const remove = useDeleteDraft();
  if (drafts.length === 0) return null;

  if (collapsed) {
    return (
      <>
        {drafts.map((d) => {
          const title = draftTitle(d);
          return (
            <Link
              key={d.id}
              href={draftHref(d)}
              onClick={(e) => nav.open(d, e)}
              aria-label={`Draft: ${title}`}
              title={`Draft: ${title}`}
              data-no-tap
              className={cn(
                "flex size-[34px] shrink-0 items-center justify-center rounded-full border border-dashed text-[11px] font-semibold text-ink-2 no-underline hover:text-ink",
                nav.isOpen(d) ? "border-gold bg-chip" : "border-line-input bg-white",
              )}
            >
              {title
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      <div className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[1px] text-muted">Drafts</div>
      {drafts.map((d) => {
        const title = draftTitle(d);
        const active = nav.isOpen(d);
        return (
          <div key={d.id} className={cn("group flex items-center rounded-[10px] border", active ? "border-line bg-white" : "border-transparent")}>
            <Link href={draftHref(d)} onClick={(e) => nav.open(d, e)} className="flex min-w-0 flex-1 flex-col gap-0.5 py-[9px] pl-2.5 no-underline">
              <span className="truncate text-[13px] font-medium leading-snug text-ink">{title}</span>
              <span className="text-[11px] text-muted">Draft · {draftWhen(d.updatedAt)}</span>
            </Link>
            <button
              type="button"
              aria-label={`Delete draft: ${title}`}
              title="Delete draft"
              onClick={() => remove.ask(d)}
              data-no-tap
              className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted opacity-0 hover:bg-chip hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        );
      })}
      {remove.modal}
    </>
  );
}

/** The Cases page's Drafts, above the cases: Continue or delete each. */
export function DraftsSection({ mobile = false }: { mobile?: boolean }) {
  const drafts = useOwnDrafts();
  const nav = useDraftNav();
  const remove = useDeleteDraft();
  if (drafts.length === 0) return null;

  return (
    <section aria-labelledby="drafts-heading" className="flex flex-col gap-2">
      <h2 id="drafts-heading" className={cn("font-semibold uppercase tracking-[1px] text-muted", mobile ? "text-[12px]" : "text-[10px]")}>
        Drafts · not created yet
      </h2>
      <ul className="flex flex-col divide-y divide-line rounded-card border border-dashed border-line-input bg-white">
        {drafts.map((d) => {
          const title = draftTitle(d);
          return (
            <li key={d.id} className={cn("flex items-center gap-3", mobile ? "px-4 py-3.5" : "px-4 py-3")}>
              <Link href={draftHref(d)} onClick={(e) => nav.open(d, e)} className="flex min-w-0 flex-1 flex-col gap-0.5 text-ink no-underline">
                <span className={cn("truncate font-display tracking-[-0.01em] text-ink", mobile ? "text-[17px]" : "text-[16px]")}>{title}</span>
                <span className={cn("text-muted", mobile ? "text-[12.5px]" : "text-[12px]")}>
                  Saved {draftWhen(d.updatedAt)}
                  {d.fileCount > 0 && ` · ${filesLabel(d.fileCount)}`}
                </span>
              </Link>
              {!mobile && (
                <Link href={draftHref(d)} onClick={(e) => nav.open(d, e)} className={buttonClass("outline", "sm", "no-underline text-ink hover:text-ink")}>
                  Continue
                </Link>
              )}
              <button
                type="button"
                aria-label={`Delete draft: ${title}`}
                title="Delete draft"
                onClick={() => remove.ask(d)}
                data-no-tap
                className={cn("flex shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-ink", mobile ? "size-11" : "size-9")}
              >
                <Trash2 size={mobile ? 17 : 15} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      {remove.modal}
    </section>
  );
}
