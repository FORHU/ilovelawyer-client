"use client";

import { ErrorBox } from "@/components/ui/banner";
import { CaseDetails } from "@/components/case/overview/case-details";
import { ReadinessBanner } from "@/components/case/overview/readiness-banner";
import { buildSections, ChosenLawyerCard, GetLawyerCard, NothingYet } from "./overview-sections";
import type { OverviewProps } from "./overview";
import { useOverview } from "./use-overview";
import { useT } from "@/components/site/language-provider";
import { useSite } from "@/components/site/site-provider";

export function OverviewDesktop({ c, onOpenDocument, onOpenChat, onOpenLawyer }: OverviewProps) {
  const { intake, error, running, updatePending, updateError, onUpdate } = useOverview(c);
  const t = useT();
  const aiOpen = useSite().intakeChat === "open";

  if (!intake) {
    return error ? <div className="p-6 text-sm text-ink-2">{t("Couldn't load your overview.")}</div> : null;
  }

  const { summary, timeline, facts, people, goals, questions, stillNeeded, doubleCheck, deadlines, empties } = buildSections(
    intake,
    !!running,
    { onOpenChat, onOpenDocument },
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 pb-14 pt-7 md:px-10">
        <h2 className="sr-only">{t("Overview")}</h2>

        <ReadinessBanner c={c} intake={intake} updatePending={updatePending} onUpdate={onUpdate} onContinue={onOpenChat} />
        {updateError && <ErrorBox message={updateError} />}

        {aiOpen ? (
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
              {/* The lawyer the client chose first is their next step, so it leads. */}
              <ChosenLawyerCard caseId={c.id} onOpenChat={onOpenChat} onOpenLawyer={onOpenLawyer} />
              {stillNeeded}
              {doubleCheck}
              {deadlines}
              <CaseDetails c={c} defaultOpen={!intake.generatedAt && intake.status !== "RUNNING"} />
              <GetLawyerCard caseId={c.id} />
            </aside>
          </div>
        ) : (
          <div className="flex max-w-[640px] flex-col gap-4">
            <ChosenLawyerCard caseId={c.id} onOpenLawyer={onOpenLawyer} />
            <CaseDetails c={c} defaultOpen />
            <p className="text-xs text-ink-2">{t("This is what you've told us about your case so far. It isn't legal advice.")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
