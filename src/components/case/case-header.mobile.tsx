"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, CircleHelp, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { GetLawyerAction } from "@/components/case/get-lawyer-action";
import { RemoveCaseModal, type RemoveMode } from "@/components/case/remove-case-modal";
import { cn } from "@/lib/cn";
import { areasLabel, type Case } from "@/lib/types";
import { usePayment } from "@/lib/payment-store";
import { useTour } from "@/lib/tour/store";
import { useCaseCredits } from "./use-case-credits";

const CREDITS_TONE = {
  normal: "border-line bg-subtle text-ink",
  warning: "border-warn-line bg-warn-bg text-warn-ink",
  critical: "border-error-line bg-error-bg text-error-ink",
} as const;

/** The phone's case header: one row (back, title, credits, menu), plus a full-width "Get a lawyer"
 * row only when there is one. The credits chip opens the top-up; its colour carries the warning
 * and its label the words, so it never needs a second line. */
export function CaseHeaderMobile({ c }: { c: Case }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<RemoveMode | null>(null);
  const { status } = useCaseCredits(c);

  return (
    <div className="keyboard-hide shrink-0 border-b border-line px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Back to cases"
          onClick={() => router.push("/cases")}
          data-no-tap
          className="flex size-11 shrink-0 items-center justify-center rounded-full active:bg-chip"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10.5px] font-semibold uppercase tracking-[0.8px] text-gold">
            {areasLabel(c.areas)}
            {` · ${c.where || c.ukJurisdiction || "Outside the UK"}`}
          </div>
          <h1 className="truncate font-display text-[18px] leading-[1.25] tracking-[-0.01em]">{c.title}</h1>
        </div>
        <button
          type="button"
          onClick={() => usePayment.getState().openFor(c.id)}
          data-tour="case-credits"
          data-no-tap
          aria-label={`${c.credits} credits left. Top up`}
          className={cn("flex min-h-11 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold tabular-nums", CREDITS_TONE[status])}
        >
          {c.credits}
          <span className="ml-1 font-medium">credits</span>
        </button>
        <ActionMenu
          label="More actions"
          tourId="case-menu"
          items={[
            { label: "Guide", icon: <CircleHelp size={14} />, onSelect: () => useTour.getState().setGuideOpen(true) },
            { label: "Archive case", icon: <Archive size={14} />, onSelect: () => setRemoving("archive") },
            { label: "Delete case", icon: <Trash2 size={14} />, onSelect: () => setRemoving("delete"), danger: true },
          ]}
        />
      </div>
      <div className="flex empty:hidden [&:not(:empty)]:mt-2">
        <GetLawyerAction caseId={c.id} />
      </div>
      {removing && <RemoveCaseModal c={c} mode={removing} onClose={() => setRemoving(null)} />}
    </div>
  );
}
