"use client";

import { useState } from "react";
import { RotateCw, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { CaseDetails } from "@/components/case/overview/case-details";
import { OverviewSection } from "@/components/case/overview/overview-section";
import { DocLink } from "@/components/case/overview/doc-link";
import { ApiError } from "@/lib/api/fetch";
import { overviewBanner, staleChangeText } from "@/lib/cases/overview-copy";
import { useGenerateOverviewMutation, useOverviewQuery } from "@/lib/cases/queries";
import { useEligibilityQuery, useLawyerRequestForm } from "@/lib/lawyer-requests/api";
import { useApp } from "@/lib/store";
import type { Case, OverviewPane, OverviewPoint, SectionStatus } from "@/lib/types";

const PANE_LABEL: Record<OverviewPane, string> = {
  strategy: "Summary and timeline",
  findings: "Points that help or may hurt",
  missingEvidence: "What to gather",
};
const PANE_ORDER: OverviewPane[] = ["strategy", "findings", "missingEvidence"];

function fmtDate(iso: string, withYear = true) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: withYear ? "numeric" : undefined, timeZone: "UTC" });
}

export function Overview({ c, onOpenDocument }: { c: Case; onOpenDocument: (documentId: string) => void }) {
  const hasPendingDocuments = c.documents.some((d) => d.status === "PENDING");
  const { data: overview, error } = useOverviewQuery(c.id, hasPendingDocuments);
  const generate = useGenerateOverviewMutation(c.id);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const onUpdate = () => {
    setUpdateError(null);
    generate.mutate(undefined, {
      onError: (err) => setUpdateError(err instanceof ApiError ? err.message : "Couldn't update your overview. Try again."),
    });
  };

  if (!overview) {
    return error ? <div className="p-6 text-sm text-ink-2">Couldn&apos;t load your overview.</div> : null;
  }

  const banner = overviewBanner(overview);
  const ranBefore = !!overview.generatedAt;
  const open = (documentId: string | null) => documentId && onOpenDocument(documentId);
  // A first run that failed before saving anything has the FAILED banner above; each section then
  // says what it will show, rather than repeating the failure under every heading.
  const shown = (status: SectionStatus): SectionStatus => (banner === "FAILED" ? "EMPTY" : status);
  const retry = { onRetry: onUpdate, retrying: generate.isPending };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[680px] flex-col gap-7 px-4 py-7 md:px-10">
        {/* Not shown — the Overview tab button already names this panel visually; a sibling
         * heading here keeps the page's outline sequential (Documents' own h2 is its sibling
         * tab's title) for anyone switching tabs by screen reader. */}
        <h2 className="sr-only">Overview</h2>

        <CaseDetails c={c} defaultOpen={!overview.generatedAt && !overview.job} />

        {banner === "RUNNING" && <RunningBanner panesDone={overview.job?.panesDone ?? []} />}
        {banner === "STALE" && (
          <StaleBanner
            changedSince={overview.changedSince}
            generatedAt={overview.generatedAt}
            allowed={overview.updates.allowed}
            leftToday={overview.updates.leftToday}
            pending={generate.isPending}
            onUpdate={onUpdate}
          />
        )}
        {banner === "FAILED" && (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-error-line bg-error-bg px-4 py-3">
            <span className="min-w-0 flex-1 text-[13px] leading-[1.5] text-error-ink">
              We couldn&apos;t put your overview together. Nothing was lost — try again.
            </span>
            <Button variant="outline" onClick={onUpdate} disabled={generate.isPending}>
              <RotateCw size={14} />
              Try again
            </Button>
          </div>
        )}
        {updateError && <ErrorBox message={updateError} />}

        {/* Read top to bottom as one brief, not a grid of widgets: each section below opens with
         * a quiet label and closes with a hairline (OverviewSection), so the page is a single
         * continuous read with the AI's own summary leading it, the way a case memo would. */}
        <div className="flex flex-col">
          <OverviewSection
            title="Summary"
            status={shown(overview.sections.summary)}
            {...retry}
            empty={<>Once your documents are read, you&apos;ll get a short summary of your case in plain English.</>}
          >
            <p className="font-display text-[19px] leading-[1.45] tracking-[-0.01em] text-balance">{overview.summary}</p>
          </OverviewSection>

          {overview.keyDates && overview.sections.keyDates && (
            <OverviewSection
              title="Key dates"
              status={overview.sections.keyDates}
              empty={<>Deadlines that apply to your case, like the last day to make a claim, will appear here.</>}
            >
              <div className="flex flex-col divide-y divide-line">
                {overview.keyDates.map((d) => (
                  <div key={d.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-[46px] shrink-0 text-center leading-[1.1]">
                      <div className="font-display text-[17px]">{fmtDate(d.date, false).split(" ")[0]}</div>
                      <div className="text-[10px] uppercase tracking-[0.06em] text-muted">{fmtDate(d.date, false).split(" ")[1]}</div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                      <span>{d.label}</span>
                      <span className="text-xs text-ink-2">
                        {fmtDate(d.date)} · {d.status === "CONFIRMED" ? "Confirmed" : "Estimated"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </OverviewSection>
          )}

          <OverviewSection
            title="Timeline"
            status={shown(overview.sections.timeline)}
            {...retry}
            empty={<>Once your documents are read, we&apos;ll put together a timeline of what happened, in order.</>}
          >
            <ol className="flex flex-col gap-4 border-l border-line pl-4">
              {overview.timeline.map((t) => (
                <li key={t.id} className="relative flex min-w-0 flex-col gap-0.5">
                  <span className="absolute -left-[21px] top-[6px] h-2 w-2 rounded-full border-2 border-gold bg-white" />
                  {t.date && <span className="text-xs text-ink-2">{fmtDate(t.date)}</span>}
                  <span>{t.label}</span>
                  <DocLink c={c} documentId={t.sourceDocumentId} onOpen={open} />
                </li>
              ))}
            </ol>
          </OverviewSection>

          <OverviewSection
            title="What to gather"
            status={shown(overview.sections.toGather)}
            {...retry}
            empty={ranBefore ? <>Nothing obvious is missing from your documents.</> : <>Add documents such as contracts, messages or notices — we&apos;ll say what&apos;s worth gathering next.</>}
          >
            <ul className="flex flex-col gap-2">
              {overview.toGather.map((g) => (
                <li key={g.id} className="flex items-start gap-2.5 rounded-card bg-subtle px-3.5 py-3">
                  <span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded border border-line-input" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span>{g.title}</span>
                    {g.why && <span className="text-[12.5px] text-ink-2">{g.why}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </OverviewSection>

          <PointsSection
            title="Points that help"
            status={shown(overview.sections.helps)}
            emptyRan="Nothing stood out yet that clearly helps your case."
            emptyNotRun="Once your documents are read, we'll point out what helps your case."
            ranBefore={ranBefore}
            points={overview.helps}
            {...retry}
          />
          <PointsSection
            title="Points that may hurt"
            status={shown(overview.sections.mayHurt)}
            emptyRan="Nothing stood out yet that may work against you."
            emptyNotRun="Once your documents are read, we'll point out what may work against your case."
            ranBefore={ranBefore}
            points={overview.mayHurt}
            {...retry}
          />
        </div>

        <Footer caseId={c.id} />
      </div>
    </div>
  );
}

function RunningBanner({ panesDone }: { panesDone: OverviewPane[] }) {
  // The three panes run side by side, not in sequence — so each line is just "done" or "still
  // working", never a numbered current step (nothing here is implied to run before anything else).
  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-line bg-subtle px-4 py-3.5 text-[13px] text-ink-2">
      <div>
        <span className="font-medium text-ink">Reading your documents</span>
        <br />
        This usually takes a minute or two. You can leave this page.
      </div>
      <ul className="flex flex-col gap-1.5 text-[13px]">
        {PANE_ORDER.map((pane) => {
          const done = panesDone.includes(pane);
          return (
            <li key={pane} className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${done ? "bg-success" : "motion-safe:animate-pulse bg-line"}`} />
              {PANE_LABEL[pane]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StaleBanner({
  changedSince,
  generatedAt,
  allowed,
  leftToday,
  pending,
  onUpdate,
}: {
  changedSince: { added: number; removed: number } | null;
  generatedAt: string | null;
  allowed: boolean;
  leftToday: number;
  pending: boolean;
  onUpdate: () => void;
}) {
  const change = staleChangeText(changedSince);
  const canUpdate = allowed && leftToday > 0;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-warn-line bg-warn-bg px-4 py-3">
      <div className="min-w-0 flex-1 text-[13px] leading-[1.5] text-warn-ink">
        {change}
        {generatedAt ? ` on ${fmtDate(generatedAt)}.` : "."} Update to include it.
        {canUpdate && leftToday <= 2 && <span className="block text-xs">{leftToday} update{leftToday === 1 ? "" : "s"} left today</span>}
        {!canUpdate && <span className="block text-xs">You&apos;ve used today&apos;s updates for this case — try again tomorrow.</span>}
      </div>
      <Button variant="primary" size="sm" onClick={onUpdate} disabled={pending || !canUpdate}>
        <RotateCw size={14} />
        Update
      </Button>
    </div>
  );
}

function PointsSection({
  title,
  status,
  emptyRan,
  emptyNotRun,
  ranBefore,
  points,
  onRetry,
  retrying,
}: {
  title: string;
  status: SectionStatus;
  emptyRan: string;
  emptyNotRun: string;
  ranBefore: boolean;
  points: OverviewPoint[];
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <OverviewSection title={title} status={status} empty={ranBefore ? emptyRan : emptyNotRun} onRetry={onRetry} retrying={retrying}>
      <ul className="flex flex-col gap-2.5">
        {points.map((p) => (
          <li key={p.id} className="flex flex-col gap-0.5 rounded-card border border-line bg-subtle px-3.5 py-3">
            <span className="font-medium">{p.title}</span>
            {p.detail && <span className="text-[13px] text-ink-2">{p.detail}</span>}
          </li>
        ))}
      </ul>
    </OverviewSection>
  );
}

function Footer({ caseId }: { caseId: string }) {
  const status = useApp((s) => s.lawyer.status);
  const { data } = useEligibilityQuery(caseId);
  const canAsk = status === "none" && data?.eligible;
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3.5 text-xs text-ink-2">
      <span>This is general information to help you understand your case. It isn&apos;t legal advice.</span>
      {canAsk && (
        <button
          type="button"
          onClick={() => useLawyerRequestForm.getState().openFor(caseId)}
          className="inline-flex items-center gap-1.5 self-start font-medium text-gold hover:text-gold-hover"
        >
          <Scale size={12} />
          Get a lawyer for this case
        </button>
      )}
    </div>
  );
}
