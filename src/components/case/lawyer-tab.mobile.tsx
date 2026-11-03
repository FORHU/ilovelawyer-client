"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { ClosedStage, EngagedStage, ExpiredStage, PaymentSuccess, QuoteStage, RequestSteps, StageCard, VisibilityCard, WithdrawControl } from "./lawyer-stages";
import type { LawyerTabProps } from "./lawyer-tab";
import { useLawyerTab } from "./use-lawyer-tab";

/** The phone's Lawyer tab: one column, the stage first. A quote or a conversation is what the client
 * came for, so it leads; the progress line and the activity follow, and the activity folds away. */
export function LawyerTabMobile({ c, request }: LawyerTabProps) {
  const { justPaid, dismissPaid, confirm, decline, withdraw, deciding, visible, phase, canWithdraw, showVisibility, engaged, activity } = useLawyerTab(c, request);
  const [showActivity, setShowActivity] = useState(false);

  if (!visible) return null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="flex w-full flex-col gap-4 px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-4">
        {(phase === "sent" || phase === "finding" || phase === "reviewing") && <StageCard c={c} request={request} phase={phase} />}
        {(phase === "quote" || phase === "finalising") && (
          <QuoteStage c={c} request={request} finalising={phase === "finalising"} confirm={confirm} decline={decline} locked={withdraw.isPending} />
        )}
        {phase === "engaged" && justPaid && <PaymentSuccess request={request} onDismiss={dismissPaid} />}
        {phase === "engaged" && <EngagedStage c={c} request={request} />}
        {phase === "closed" && <ClosedStage c={c} request={request} />}
        {phase === "expired" && <ExpiredStage caseId={c.id} />}

        <aside aria-label="Request progress" className="flex flex-col gap-4">
          <section data-tour="request-status" className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
            <div className="flex flex-col gap-0.5">
              <Eyebrow muted>Matched for you</Eyebrow>
              <h2 className="text-base font-semibold">Your lawyer request</h2>
            </div>
            <RequestSteps request={request} phase={phase} />
            {canWithdraw && <WithdrawControl request={request} withdraw={withdraw} disabled={deciding} />}
          </section>

          <section className="rounded-card border border-line bg-white">
            <button
              type="button"
              onClick={() => setShowActivity((v) => !v)}
              aria-expanded={showActivity}
              data-no-tap
              className="flex min-h-12 w-full items-center gap-2 px-5 text-left active:bg-chip"
            >
              <ChevronRight size={16} aria-hidden className={cn("shrink-0 text-ink-2 transition-transform", showActivity && "rotate-90")} />
              <span className="flex-1 text-[14px] font-medium">Recent activity</span>
              <span className="text-[13px] text-ink-2">{activity.length}</span>
            </button>
            {showActivity && (
              <ul className="flex flex-col gap-3 border-t border-line px-5 py-4">
                {activity.map((ev) => (
                  <li key={`${ev.at}-${ev.text}`} className="flex flex-col gap-0.5 text-[14px]">
                    <span className="text-[12px] text-ink-2">{formatDateTime(ev.at)}</span>
                    <span>{ev.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        {showVisibility && <VisibilityCard engaged={engaged} since={request.engagedAt} />}
      </div>
    </div>
  );
}
