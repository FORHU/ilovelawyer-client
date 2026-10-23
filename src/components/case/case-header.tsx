"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Trash2, Zap } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { GetLawyerAction } from "@/components/case/get-lawyer-action";
import { RemoveCaseModal, type RemoveMode } from "@/components/case/remove-case-modal";
import { AREA_LABELS, type Case } from "@/lib/types";
import { usePayment } from "@/lib/payment-store";

export function CaseHeader({ c }: { c: Case }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<RemoveMode | null>(null);

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
          {AREA_LABELS[c.area]}
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
          className="flex h-11 flex-1 shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-subtle px-3.5 text-[12.5px] font-medium text-ink md:h-9 md:flex-none"
        >
          <Zap size={14} className="text-gold" />
          {c.credits} credits
          <span className="font-semibold text-gold">Top up</span>
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
