"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Scale, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Case } from "@/lib/types";
import { usePayment } from "@/lib/payment-store";
import { useApp } from "@/lib/store";

export function CaseHeader({ c }: { c: Case }) {
  const router = useRouter();
  const status = useApp((s) => s.lawyer.status);
  const requestLawyer = useApp((s) => s.requestLawyer);
  const canRequest = status === "none";

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
          {c.area}
          {c.where ? ` · ${c.where}` : ""}
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
        {canRequest && (
          <Button
            variant="outline"
            size="md"
            data-no-tap
            className="h-11 flex-1 !px-4 md:h-9 md:flex-none"
            onClick={() => requestLawyer(c.id)}
          >
            <Scale size={14} />
            Request lawyer
          </Button>
        )}
      </div>
    </div>
  );
}
