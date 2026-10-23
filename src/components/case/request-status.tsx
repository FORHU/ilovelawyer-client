"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { RequestTimeline } from "@/components/case/request-timeline";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import type { LawyerRequestStatus } from "@/lib/lawyer-requests/api";
import { describeStatus } from "@/lib/lawyer-requests/status";

/** The request's current step as a button in the lawyer header; tapping it opens the timeline. Its
 * text and icon carry the status, the colour only backs them up. */
export function RequestStatusChip({ status, sentAt }: { status: LawyerRequestStatus; sentAt?: string }) {
  const [open, setOpen] = useState(false);
  const view = describeStatus(status);
  const tone = view.step === null ? "ended" : view.step === "confirmed" ? "done" : "active";
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Request status: ${view.title}. Open timeline`}
        onClick={() => setOpen(true)}
        data-no-tap
        className={cn(
          "flex h-11 max-w-full shrink-0 items-center gap-2 rounded-full border px-3.5 text-[12.5px] font-medium md:h-9",
          tone === "active" && "border-gold/40 bg-chip text-gold",
          tone === "done" && "border-success-line bg-success-bg text-success-ink",
          tone === "ended" && "border-line bg-subtle text-ink-2",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-2 shrink-0 rounded-full", tone === "active" && "bg-gold", tone === "done" && "bg-success", tone === "ended" && "bg-muted")}
        />
        <span className="truncate">{view.title}</span>
        <Info size={14} aria-hidden="true" className="shrink-0" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Your lawyer request">
        <RequestTimeline status={status} sentAt={sentAt} />
        <div className="flex md:justify-end">
          <Button variant="outline" size="lg" className="w-full md:w-auto" onClick={() => setOpen(false)} autoFocus>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
