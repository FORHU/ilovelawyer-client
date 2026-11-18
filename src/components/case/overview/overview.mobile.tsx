"use client";

import { ErrorBox } from "@/components/ui/banner";
import { PullToRefresh } from "@/components/shell/pull-to-refresh";
import { CaseDetails } from "@/components/case/overview/case-details";
import { ReadinessBanner } from "@/components/case/overview/readiness-banner";
import { buildSections, GetLawyerCard, NothingYet } from "./overview-sections";
import type { OverviewProps } from "./overview";
import { useOverview } from "./use-overview";
import { useT } from "@/components/site/language-provider";
import { useSite } from "@/components/site/site-provider";

/** The phone's Overview: one column, in the order a client acts on it. Where the case stands, then
 * what is still needed and the dates coming up, then what to double-check; the longer record
 * (summary, timeline, facts, people, goals, questions) follows, then the case details and the
 * way to get a lawyer. */
export function OverviewMobile({ c, onOpenDocument, onOpenChat }: OverviewProps) {
  const { intake, error, running, updatePending, updateError, onUpdate } = useOverview(c);
  const t = useT();
  const aiOpen = useSite().intakeChat === "open";

  if (!intake) {
    return error ? <div className="p-5 text-[15px] text-ink-2">{t("Couldn't load your overview.")}</div> : null;
  }

  const { summary, timeline, facts, people, goals, questions, stillNeeded, doubleCheck, deadlines, empties } = buildSections(
    intake,
    !!running,
    { onOpenChat, onOpenDocument },
    true,
  );

  return (
    <PullToRefresh>
      <div className="flex w-full flex-col gap-4 px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-4">
        <h2 className="sr-only">{t("Overview")}</h2>

        <ReadinessBanner c={c} intake={intake} updatePending={updatePending} onUpdate={onUpdate} onContinue={onOpenChat} />
        {updateError && <ErrorBox message={updateError} />}

        {aiOpen ? (
          <>
            {stillNeeded}
            {deadlines}
            {doubleCheck}
            {summary}
            {timeline}
            {facts}
            {people}
            {goals}
            {questions}
            {empties.length > 0 && <NothingYet sections={empties} />}
            <CaseDetails c={c} defaultOpen={!intake.generatedAt && intake.status !== "RUNNING"} />
            <GetLawyerCard caseId={c.id} fullWidth />
            <p className="text-[12.5px] leading-[1.5] text-ink-2">
              This is what we&apos;ve gathered from you so far, to help a lawyer get up to speed quickly. It isn&apos;t legal advice.
            </p>
          </>
        ) : (
          <>
            <CaseDetails c={c} defaultOpen />
            <p className="text-[12.5px] leading-[1.5] text-ink-2">{t("This is what you've told us about your case so far. It isn't legal advice.")}</p>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}
