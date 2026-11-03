"use client";

import { ErrorBox } from "@/components/ui/banner";
import { CaseDetails } from "@/components/case/overview/case-details";
import { ReadinessBanner } from "@/components/case/overview/readiness-banner";
import { buildSections, GetLawyerCard, NothingYet } from "./overview-sections";
import type { OverviewProps } from "./overview";
import { useOverview } from "./use-overview";

export function OverviewDesktop({ c, onOpenDocument, onOpenChat }: OverviewProps) {
  const { intake, error, running, updatePending, updateError, onUpdate } = useOverview(c);

  if (!intake) {
    return error ? <div className="p-6 text-sm text-ink-2">Couldn&apos;t load your overview.</div> : null;
  }

  const { summary, timeline, facts, people, goals, questions, stillNeeded, doubleCheck, deadlines, empties } = buildSections(
    intake,
    !!running,
    { onOpenChat, onOpenDocument },
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 pb-14 pt-7 md:px-10">
        <h2 className="sr-only">Overview</h2>

        <ReadinessBanner c={c} intake={intake} updatePending={updatePending} onUpdate={onUpdate} onContinue={onOpenChat} />
        {updateError && <ErrorBox message={updateError} />}

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
            {summary}
            {timeline}
            {facts}
            {people}
            {goals}
            {questions}
            {empties.length > 0 && <NothingYet sections={empties} />}
            <p className="pt-1 text-xs text-ink-2">
              This is what we&apos;ve gathered from you so far, to help a lawyer get up to speed quickly. It isn&apos;t legal advice.
            </p>
          </div>

          <aside aria-label="Next steps" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            {stillNeeded}
            {doubleCheck}
            {deadlines}
            <CaseDetails c={c} defaultOpen={!intake.generatedAt && intake.status !== "RUNNING"} />
            <GetLawyerCard caseId={c.id} />
          </aside>
        </div>
      </div>
    </div>
  );
}
