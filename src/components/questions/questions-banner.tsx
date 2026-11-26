"use client";

import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import { useSite } from "@/components/site/site-provider";
import { useT } from "@/components/site/language-provider";
import { remainingOf, useQuestionsStatusQuery } from "@/lib/cases/questions";

/** On the case page while the case's questions are under way: how many are left, and a way back to
 * them. Nothing once they're done, or when the case never had any (a case made from the form or the
 * chat). Reads the questions without starting them. */
export function QuestionsBanner({ caseId }: { caseId: string }) {
  const t = useT();
  const storyIntake = useSite().storyIntake === "open";
  const { data } = useQuestionsStatusQuery(caseId, storyIntake);
  const left = remainingOf(data);
  if (!left) return null;

  return (
    <div className="keyboard-hide shrink-0 border-b border-warn-line bg-warn-bg px-4 py-2 md:px-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-warn-ink">
        <ListChecks size={16} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          {left === 1 ? t("1 question left to finish your case.") : t("{count} questions left to finish your case.", { count: left })}
        </p>
        <Link
          href={`/cases/${caseId}/questions`}
          data-no-tap
          className="flex min-h-11 items-center gap-1.5 font-semibold text-warn-ink underline underline-offset-4 hover:no-underline"
        >
          {t("Continue")}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
