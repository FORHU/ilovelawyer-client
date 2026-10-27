"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Trash2, Zap } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { ProgressBar, type ProgressTone } from "@/components/ui/progress-bar";
import { GetLawyerAction } from "@/components/case/get-lawyer-action";
import { RemoveCaseModal, type RemoveMode } from "@/components/case/remove-case-modal";
import { areasLabel, type Case } from "@/lib/types";
import { usePayment } from "@/lib/payment-store";
import { usePricingQuery } from "@/lib/pricing";
import { creditsStatus, creditsUsedPercent } from "@/lib/cases/credit-usage";

const TONE_BY_STATUS: Record<ReturnType<typeof creditsStatus>, ProgressTone> = {
  normal: "gold",
  warning: "warning",
  critical: "critical",
};

const TEXT_CLASS_BY_STATUS: Record<ReturnType<typeof creditsStatus>, string> = {
  normal: "text-ink-2",
  warning: "text-amber-600",
  critical: "text-error-ink",
};

export function CaseHeader({ c }: { c: Case }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<RemoveMode | null>(null);
  const { data: pricing } = usePricingQuery();
  // Baseline is the credits a case comes with; a case that's never been topped up matches it
  // exactly. See credit-usage.ts for why a top-up reads as "0% used" rather than negative.
  const included = pricing?.case.credits ?? null;
  const percent = included ? creditsUsedPercent(c.credits, included) : null;
  const status = included ? creditsStatus(c.credits, included) : "normal";

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-line px-4 py-3 md:px-6 md:py-[14px]">
      <button
        type="button"
        aria-label="Back to cases"
        onClick={() => router.push("/cases")}
        data-no-tap
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white md:size-9"
      >
        <ArrowLeft size={15} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[1px] text-gold">
          {areasLabel(c.areas)}
          {` · ${c.where || c.ukJurisdiction || "Outside the UK"}`}
        </div>
        <div className="font-display text-xl leading-[1.25] tracking-[-0.02em] md:truncate">
          {c.title}
        </div>
      </div>
      <div className="flex w-full shrink-0 gap-2 md:w-auto">
        <button
          type="button"
          onClick={() => usePayment.getState().openFor("topup", c.id)}
          data-no-tap
          className="flex flex-1 shrink-0 flex-col gap-1.5 rounded-card border border-line bg-subtle px-3.5 py-2 text-[12.5px] font-medium text-ink md:w-[230px] md:flex-none"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-gold" />
              {c.credits} credits
            </span>
            <span className="font-semibold text-gold">Top up</span>
          </span>
          {percent !== null && (
            <span className="flex items-center gap-2">
              <ProgressBar value={percent} tone={TONE_BY_STATUS[status]} className="flex-1" />
              <span className={`shrink-0 text-[10.5px] font-semibold tabular-nums ${TEXT_CLASS_BY_STATUS[status]}`}>
                {percent}% used
              </span>
            </span>
          )}
        </button>
        <GetLawyerAction caseId={c.id} />
        <ActionMenu
          label="More actions"
          items={[
            { label: "Archive case", icon: <Archive size={14} />, onSelect: () => setRemoving("archive") },
            { label: "Delete case", icon: <Trash2 size={14} />, onSelect: () => setRemoving("delete"), danger: true },
          ]}
        />
      </div>
      {removing && <RemoveCaseModal c={c} mode={removing} onClose={() => setRemoving(null)} />}
    </div>
  );
}
