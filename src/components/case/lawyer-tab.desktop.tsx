"use client";

import { Eyebrow } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";
import { ClosedStage, EngagedStage, ExpiredStage, PaymentSuccess, QuoteStage, RequestSteps, StageCard, VisibilityCard, WithdrawControl } from "./lawyer-stages";
import type { LawyerTabProps } from "./lawyer-tab";
import { useLawyerTab } from "./use-lawyer-tab";

export function LawyerTabDesktop({ c, request }: LawyerTabProps) {
  const { justPaid, dismissPaid, confirm, decline, withdraw, deciding, visible, phase, canWithdraw, showVisibility, engaged, activity } = useLawyerTab(c, request);

  if (!visible) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-start gap-6 px-4 pb-14 pt-7 md:px-10">
        <aside aria-label="Request progress" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <section data-tour="request-status" className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
            <div className="flex flex-col gap-0.5">
              <Eyebrow muted>Matched for you</Eyebrow>
              <h2 className="text-base font-semibold">Your lawyer request</h2>
            </div>
            <RequestSteps request={request} phase={phase} />
            {canWithdraw && <WithdrawControl request={request} withdraw={withdraw} disabled={deciding} />}
          </section>

          <section className="flex flex-col gap-2.5 rounded-card border border-line bg-white px-5 py-[18px]">
            <h3>
              <Eyebrow muted>Activity</Eyebrow>
            </h3>
            <ul className="flex flex-col gap-2.5">
              {activity.map((ev) => (
                <li key={`${ev.at}-${ev.text}`} className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 text-[12.5px]">
                  <span className="text-ink-2">{formatDateTime(ev.at).replace(",", "")}</span>
                  <span>{ev.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          {(phase === "sent" || phase === "finding" || phase === "reviewing") && <StageCard c={c} request={request} phase={phase} />}
          {(phase === "quote" || phase === "finalising") && (
            <QuoteStage c={c} request={request} finalising={phase === "finalising"} confirm={confirm} decline={decline} locked={withdraw.isPending} />
          )}
          {phase === "engaged" && justPaid && <PaymentSuccess request={request} onDismiss={dismissPaid} />}
          {phase === "engaged" && <EngagedStage c={c} request={request} />}
          {phase === "closed" && <ClosedStage c={c} request={request} />}
          {phase === "expired" && <ExpiredStage caseId={c.id} />}

          {showVisibility && <VisibilityCard engaged={engaged} since={request.engagedAt} />}
        </div>
      </div>
    </div>
  );
}
