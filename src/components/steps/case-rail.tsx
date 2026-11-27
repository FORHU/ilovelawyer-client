"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { useT } from "@/components/site/language-provider";
import { caseFileOf, type CaseFileRow } from "@/lib/cases/case-file";
import { useCaseQuery } from "@/lib/cases/queries";
import { progressOf, useQuestionsStatusQuery } from "@/lib/cases/questions";
import { useStoryIntakeQuery } from "@/lib/cases/story";

/** What "Your case" lists: the problem, each detail the client has given (caseFileOf), and the
 * documents. Answers show the moment they're saved: the questions' own state is the source. */
function useCaseFile(caseId: string) {
  const questions = useQuestionsStatusQuery(caseId).data;
  const fields = useStoryIntakeQuery(caseId).data?.formFields;
  const theCase = useCaseQuery(caseId).data;
  return {
    title: theCase?.title ?? "",
    rows: caseFileOf(questions, fields),
    documents: theCase?.documents.length ?? 0,
    progress: questions && questions.total > 0 ? progressOf(questions) : null,
  };
}

/** The case so far as a list of labelled details. `addProofHref`: where "Add" goes for documents
 * (the evidence step), absent on the evidence step itself. */
function CaseFile({ caseId, addProofHref }: { caseId: string; addProofHref?: string }) {
  const t = useT();
  const file = useCaseFile(caseId);
  return (
    <dl className="flex flex-col gap-3.5">
      {file.title && <Row label={t("Your problem")}>{file.title}</Row>}
      {file.rows.map((row) => (
        <DetailRow key={`${row.detail}-${row.state}`} row={row} />
      ))}
      <Row label={t("Documents")}>
        {file.documents > 0 ? (
          t("{count} added", { count: file.documents })
        ) : (
          <span className="text-ink-2">
            {t("Optional, you can add these later")}
            {addProofHref && (
              <>
                {" · "}
                <Link href={addProofHref} className="font-medium text-ink underline underline-offset-4 hover:text-gold">
                  {t("Add")}
                </Link>
              </>
            )}
          </span>
        )}
      </Row>
    </dl>
  );
}

function Row({ label, children, fresh }: { label: string; children: React.ReactNode; fresh?: boolean }) {
  return (
    <div className={fresh ? "motion-fact-in flex flex-col gap-0.5" : "flex flex-col gap-0.5"}>
      <dt className="text-[12.5px] font-medium text-ink-2">{label}</dt>
      <dd className="m-0 text-[14.5px] leading-snug text-ink wrap-break-word">{children}</dd>
    </div>
  );
}

/** A detail as it stands. Keyed by its state, so a detail that fills in pops in (motion-fact-in). */
function DetailRow({ row }: { row: CaseFileRow }) {
  const t = useT();
  if (row.state === "filled") {
    return (
      <Row label={t(row.label)} fresh>
        {row.value}
      </Row>
    );
  }
  return (
    <Row label={t(row.label)}>
      {row.state === "asking" ? (
        <span className="flex items-center gap-2 text-ink-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-gold motion-safe:animate-pulse" />
          {t("Asking now")}
        </span>
      ) : (
        <span className="text-ink-2">{t("Skipped, your lawyer will ask")}</span>
      )}
    </Row>
  );
}

/**
 * "Your case" beside a step on a wide screen: a card in the page's grid (StepPage), kept in view as
 * the step scrolls. Shown once the step's column has room beside it (StepPage's container query),
 * so it shows on a laptop without the sidebar too. A phone has CaseSheetButton instead.
 */
export function CaseRail({ caseId, addProofHref }: { caseId: string; addProofHref?: string }) {
  const t = useT();
  return (
    <div className="sticky top-6 flex flex-col gap-4 rounded-2xl border border-line bg-subtle p-5">
      <h2 className="text-[13px] font-semibold text-ink-2">{t("Your case")}</h2>
      <CaseFile caseId={caseId} addProofHref={addProofHref} />
    </div>
  );
}

/** A phone's way to the case so far: the step's progress line, which opens it in a sheet. */
export function CaseSheetButton({ caseId, addProofHref }: { caseId: string; addProofHref?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { progress } = useCaseFile(caseId);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex min-h-11 items-center gap-1.5 rounded-full px-1 text-[13.5px] font-medium text-ink-2 hover:text-ink"
      >
        {t("Your case")}
        {progress && <span className="tabular-nums">· {t("{done} of {total} details", { done: progress.done, total: progress.total })}</span>}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={t("Your case")}>
        <div className="px-5 pb-4">
          <CaseFile caseId={caseId} addProofHref={addProofHref} />
        </div>
      </BottomSheet>
    </>
  );
}
