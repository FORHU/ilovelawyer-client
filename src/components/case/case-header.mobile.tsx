"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { GetLawyerAction } from "@/components/case/get-lawyer-action";
import { cn } from "@/lib/cn";
import { areasLabel, type Case } from "@/lib/types";
import { usePayment } from "@/lib/payment-store";
import { useCaseActions } from "./use-case-actions";
import { useCaseCredits } from "./use-case-credits";

const CREDITS_TONE = {
  normal: "border-line bg-subtle text-ink",
  warning: "border-warn-line bg-warn-bg text-warn-ink",
  critical: "border-error-line bg-error-bg text-error-ink",
} as const;

/** The phone's case header: one row (back, title, credits, menu), plus a full-width "Get a lawyer"
 * row only when there is one. The credits chip opens the top-up. A low balance is shown by its
 * colour and by an icon, and the chip's label says so for a screen reader, so colour is not the
 * only sign. */
export function CaseHeaderMobile({ c }: { c: Case }) {
  const router = useRouter();
  const { items, modal } = useCaseActions(c);
  const { percent, status } = useCaseCredits(c);
  const low = status !== "normal";
  const usage = low && percent !== null ? `, ${percent}% used` : "";

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
          aria-label={`${c.credits} credits left${usage}${low ? ", running low" : ""}. Top up`}
          className={cn("flex min-h-11 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold tabular-nums", CREDITS_TONE[status])}
        >
          {low && <TriangleAlert size={13} aria-hidden="true" className="mr-1 shrink-0" />}
          {c.credits}
          <span className="ml-1 font-medium">credits</span>
        </button>
        <ActionMenu label="More actions" tourId="case-menu" items={items} />
      </div>
      <div className="flex empty:hidden [&:not(:empty)]:mt-2">
        <GetLawyerAction caseId={c.id} />
      </div>
      {modal}
    </div>
  );
}
