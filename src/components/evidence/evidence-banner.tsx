"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb, Paperclip } from "lucide-react";
import { useSite } from "@/components/site/site-provider";
import { useT } from "@/components/site/language-provider";
import { useEvidenceStatusQuery } from "@/lib/cases/evidence";
import { useQuestionsStatusQuery } from "@/lib/cases/questions";

/**
 * On the case page once the case's questions are done: the evidence step, still to start ("Add the
 * proof that backs up your story") or with suggestions still to add ("2 suggested documents to add").
 * Nothing for a case that never had questions (made from the form or the chat), while the questions
 * are under way (their own banner shows), or once every suggestion is added or set aside.
 */
export function EvidenceBanner({ caseId }: { caseId: string }) {
  const t = useT();
  const storyIntake = useSite().storyIntake === "open";
  const questions = useQuestionsStatusQuery(caseId, storyIntake);
  const questionsDone = questions.data?.status === "DONE";
  const evidence = useEvidenceStatusQuery(caseId, storyIntake && questionsDone);
  if (!questionsDone || evidence.isPending || evidence.isError) return null;

  const open = evidence.data ? evidence.data.open : null;
  if (open === 0) return null;
  const text =
    open === null
      ? t("Add the proof that backs up your story.")
      : open === 1
        ? t("1 suggested document to add.")
        : t("{count} suggested documents to add.", { count: open });

  return (
    <div className="keyboard-hide shrink-0 border-b border-warn-line bg-warn-bg px-4 py-2 md:px-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-warn-ink">
        <Paperclip size={16} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">{text}</p>
        <Link
          href={`/cases/${caseId}/evidence`}
          data-no-tap
          className="flex min-h-11 items-center gap-1.5 font-semibold text-warn-ink underline underline-offset-4 hover:no-underline"
        >
          {t("Add proof")}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** At most this many suggestions on the Documents tab; the evidence screen has them all. */
const DOCUMENTS_TAB_MAX = 3;

/** On the Documents tab: the evidence step's suggestions still open, with the way to them. A case
 * without any shows `fallback` (the single "Worth adding" pick from the case's evidence gaps). */
export function DocumentSuggestions({ caseId, fallback }: { caseId: string; fallback: ReactNode }) {
  const t = useT();
  const storyIntake = useSite().storyIntake === "open";
  const { data } = useEvidenceStatusQuery(caseId, storyIntake);
  const open = data?.suggestions.filter((s) => s.state === "OPEN") ?? [];
  if (!open.length) return <>{fallback}</>;

  return (
    <div className="flex flex-col gap-2 rounded-card border border-dashed border-line-input bg-subtle px-4 py-3 text-[13px] leading-normal">
      <p className="flex items-center gap-2 font-medium">
        <Lightbulb size={15} className="shrink-0 text-ink-2" aria-hidden="true" />
        {t("Suggested for your case")}
      </p>
      <ul className="flex flex-col gap-1 pl-6">
        {open.slice(0, DOCUMENTS_TAB_MAX).map((s) => (
          <li key={s.id}>
            <span className="font-medium">{s.title}</span>
            {s.why && <span className="text-ink-2"> · {s.why}</span>}
          </li>
        ))}
      </ul>
      <Link href={`/cases/${caseId}/evidence`} className="flex min-h-9 items-center gap-1.5 self-start pl-6 font-semibold underline underline-offset-4 hover:no-underline">
        {open.length > DOCUMENTS_TAB_MAX ? t("See all {count}", { count: open.length }) : t("Add proof")}
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}
