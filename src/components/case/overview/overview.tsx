"use client";

import { useState, type ReactNode } from "react";
import { Check, Circle, RotateCw, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { CaseDetails } from "@/components/case/overview/case-details";
import { OverviewSection, type LocalSectionStatus } from "@/components/case/overview/overview-section";
import { SourceBadge } from "@/components/case/overview/source-badge";
import { ApiError } from "@/lib/api/fetch";
import { intakeBanner } from "@/lib/cases/overview-copy";
import { useIntakeQuery, useRefreshIntakeMutation } from "@/lib/cases/queries";
import { useEligibilityQuery, useLawyerRequestForm, useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import type { Case, IntakeItem } from "@/lib/types";

/** A deadline within this many days is flagged as urgent — a nudge to get it in front of a
 * lawyer, never a legal calculation of its own (ADR 0018: the API never computes a deadline;
 * this only decides how to *show* one the client or a document already stated). */
const URGENT_WITHIN_DAYS = 14;

function fmtDate(iso: string, withYear = true) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: withYear ? "numeric" : undefined, timeZone: "UTC" });
}

function daysUntil(iso: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const at = new Date(iso);
  return Math.round((at.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function Overview({
  c,
  onOpenDocument,
  onOpenChat,
}: {
  c: Case;
  onOpenDocument: (documentId: string) => void;
  onOpenChat: () => void;
}) {
  const hasPendingDocuments = c.documents.some((d) => d.status === "PENDING");
  const { data: intake, error } = useIntakeQuery(c.id, hasPendingDocuments);
  const refresh = useRefreshIntakeMutation(c.id);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const onUpdate = () => {
    setUpdateError(null);
    refresh.mutate(undefined, {
      onError: (err) => setUpdateError(err instanceof ApiError ? err.message : "Couldn't update your overview. Try again."),
    });
  };

  if (!intake) {
    return error ? <div className="p-6 text-sm text-ink-2">Couldn&apos;t load your overview.</div> : null;
  }

  const banner = intakeBanner(intake);
  const running = intake.status === "RUNNING";
  // One job writes the whole intake, so every section is EMPTY/RUNNING together until there's
  // something to show, then READY for good (a later STALE keeps showing the last good content,
  // with the banner above saying it's out of date — never blanked out just because it's stale).
  const status = (hasContent: boolean): LocalSectionStatus => (hasContent ? "READY" : running ? "RUNNING" : "EMPTY");
  const sourceProps = { onOpenChat, onOpenDocument };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[680px] flex-col gap-7 px-4 py-7 md:px-10">
        <h2 className="sr-only">Overview</h2>

        <CaseDetails c={c} defaultOpen={!intake.generatedAt && intake.status !== "RUNNING"} />

        {banner === "RUNNING" && <RunningBanner />}
        {banner === "STALE" && (
          <StaleBanner allowed={intake.updates.allowed} leftToday={intake.updates.leftToday} pending={refresh.isPending} onUpdate={onUpdate} />
        )}
        {banner === "FAILED" && (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-error-line bg-error-bg px-4 py-3">
            <span className="min-w-0 flex-1 text-[13px] leading-[1.5] text-error-ink">
              We couldn&apos;t put your overview together. Nothing was lost — try again.
            </span>
            <Button variant="outline" onClick={onUpdate} disabled={refresh.isPending}>
              <RotateCw size={14} />
              Try again
            </Button>
          </div>
        )}
        {updateError && <ErrorBox message={updateError} />}

        <div className="flex flex-col">
          <OverviewSection
            title="Summary"
            status={status(!!intake.summary)}
            empty={<>Once you&apos;ve told us a bit about your case, you&apos;ll get a short AI summary of it here.</>}
          >
            <div className="flex flex-col gap-1.5">
              <p className="font-display text-[19px] leading-[1.45] tracking-[-0.01em] text-balance">{intake.summary}</p>
              <span className="text-[11px] text-muted">AI-written summary — check it against what you actually said.</span>
            </div>
          </OverviewSection>

          <OverviewSection title="People involved" status={status(intake.people.length > 0)} empty={<>Anyone else involved — an employer, a landlord, a witness — will show up here as you mention them.</>}>
            <ul className="flex flex-col gap-2.5">
              {intake.people.map((p, i) => (
                <li key={`${p.id}-${i}`} className="flex flex-col gap-0.5 rounded-card border border-line bg-subtle px-3.5 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-[12px] text-ink-2">{p.role}</span>
                  </div>
                  <SourceBadge sources={p.sources} {...sourceProps} />
                </li>
              ))}
            </ul>
          </OverviewSection>

          <OverviewSection title="Timeline" status={status(intake.timeline.length > 0)} empty={<>As you tell us what happened and when, we&apos;ll put together a timeline here.</>}>
            <ol className="flex flex-col gap-4 border-l border-line pl-4">
              {intake.timeline.map((t, i) => (
                <li key={`${t.id}-${i}`} className="relative flex min-w-0 flex-col gap-0.5">
                  <span className="absolute -left-[21px] top-[6px] h-2 w-2 rounded-full border-2 border-gold bg-white" />
                  {t.date && <span className="text-xs text-ink-2">{fmtDate(t.date)}</span>}
                  <span>{t.text}</span>
                  <SourceBadge sources={t.sources} {...sourceProps} />
                </li>
              ))}
            </ol>
          </OverviewSection>

          <ItemsSection title="Key facts" items={intake.facts} status={status(intake.facts.length > 0)} empty={<>Important facts you mention or that come up in your documents will be collected here.</>} sourceProps={sourceProps} />

          <OverviewSection title="Your goals and concerns" status={status(intake.goals.length > 0 || intake.concerns.length > 0)} empty={<>Tell us what you&apos;re hoping for and what&apos;s worrying you, and we&apos;ll list it here for your lawyer.</>}>
            <div className="flex flex-col gap-4">
              {intake.goals.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted">What you want</span>
                  <ItemList items={intake.goals} sourceProps={sourceProps} />
                </div>
              )}
              {intake.concerns.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted">What worries you</span>
                  <ItemList items={intake.concerns} sourceProps={sourceProps} />
                </div>
              )}
            </div>
          </OverviewSection>

          <OverviewSection title="Questions for your lawyer" status={status(intake.questionsForLawyer.length > 0)} empty={<>Ask the AI anything you&apos;d like a lawyer&apos;s view on — we can&apos;t answer it ourselves, but we&apos;ll save it here for them.</>}>
            <ul className="flex flex-col gap-2.5">
              {intake.questionsForLawyer.map((q, i) => (
                <li key={`${q.id}-${i}`} className="flex flex-col gap-0.5 rounded-card border border-dashed border-line px-3.5 py-3">
                  <span>{q.text}</span>
                  <SourceBadge sources={q.sources} {...sourceProps} />
                </li>
              ))}
            </ul>
          </OverviewSection>

          <OverviewSection title="Deadlines you've mentioned" status={status(intake.deadlines.length > 0)} empty={<>A deadline, hearing date or time limit you or a document mentions will show up here — exactly as stated, never worked out for you.</>}>
            <ul className="flex flex-col gap-2.5">
              {intake.deadlines.map((d, i) => {
                const days = d.date ? daysUntil(d.date) : null;
                const urgent = days !== null && days <= URGENT_WITHIN_DAYS;
                return (
                  <li
                    key={`${d.id}-${i}`}
                    className={`flex flex-col gap-0.5 rounded-card border px-3.5 py-3 ${urgent ? "border-error-line bg-error-bg" : "border-line bg-subtle"}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={urgent ? "font-medium text-error-ink" : "font-medium"}>{d.text}</span>
                      {d.date && <span className={`text-[12px] ${urgent ? "text-error-ink" : "text-ink-2"}`}>{fmtDate(d.date)}</span>}
                    </div>
                    {urgent && <span className="text-[12px] font-medium text-error-ink">Check this with a lawyer soon.</span>}
                    <SourceBadge sources={d.sources} {...sourceProps} />
                  </li>
                );
              })}
            </ul>
          </OverviewSection>

          <OverviewSection title="Still needed" status={status(intake.missing.length > 0)} empty={<>Nothing obvious is missing yet.</>}>
            <ul className="flex flex-col gap-2">
              {intake.missing.map((g, i) => (
                <li key={`${g.id}-${i}`} className="flex items-start gap-2.5 rounded-card bg-subtle px-3.5 py-3">
                  <span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded border border-line-input" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span>{g.question}</span>
                    {g.why && <span className="text-[12.5px] text-ink-2">{g.why}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </OverviewSection>

          <OverviewSection title="Things to double-check" status={status(intake.conflicts.length > 0)} empty={<>If something you&apos;ve said doesn&apos;t match a document — or two documents disagree — we&apos;ll flag it here rather than guess which is right.</>}>
            <ul className="flex flex-col gap-2.5">
              {intake.conflicts.map((cf, i) => (
                <li key={`${cf.id}-${i}`} className="flex flex-col gap-1 rounded-card border border-warn-line bg-warn-bg px-3.5 py-3">
                  <span className="text-warn-ink">{cf.description}</span>
                  <SourceBadge sources={cf.sources} {...sourceProps} />
                </li>
              ))}
            </ul>
          </OverviewSection>

          {intake.completeness && (
            <OverviewSection title="Intake completeness" status="READY" empty={null}>
              <ul className="flex flex-col gap-1.5">
                {intake.completeness.criteria.map((cr) => (
                  <li key={cr.key} className={`flex items-center gap-2 text-[13px] ${cr.met ? "text-muted" : "text-ink"}`}>
                    {cr.met ? <Check size={13} className="text-success" /> : <Circle size={11} className="text-muted" />}
                    {cr.label}
                  </li>
                ))}
              </ul>
            </OverviewSection>
          )}
        </div>

        <Footer caseId={c.id} />
      </div>
    </div>
  );
}

function ItemList({ items, sourceProps }: { items: IntakeItem[]; sourceProps: { onOpenChat: () => void; onOpenDocument: (id: string) => void } }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={`${it.id}-${i}`} className="flex flex-col gap-0.5 rounded-card bg-subtle px-3.5 py-3">
          <span>{it.text}</span>
          <SourceBadge sources={it.sources} {...sourceProps} />
        </li>
      ))}
    </ul>
  );
}

function ItemsSection({
  title,
  items,
  status,
  empty,
  sourceProps,
}: {
  title: string;
  items: IntakeItem[];
  status: LocalSectionStatus;
  empty: ReactNode;
  sourceProps: { onOpenChat: () => void; onOpenDocument: (id: string) => void };
}) {
  return (
    <OverviewSection title={title} status={status} empty={empty}>
      <ItemList items={items} sourceProps={sourceProps} />
    </OverviewSection>
  );
}

function RunningBanner() {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border border-line bg-subtle px-4 py-3.5 text-[13px] text-ink-2">
      <span className="font-medium text-ink">Putting your overview together</span>
      This usually takes a minute or two. You can leave this page.
    </div>
  );
}

function StaleBanner({
  allowed,
  leftToday,
  pending,
  onUpdate,
}: {
  allowed: boolean;
  leftToday: number;
  pending: boolean;
  onUpdate: () => void;
}) {
  const canUpdate = allowed && leftToday > 0;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-warn-line bg-warn-bg px-4 py-3">
      <div className="min-w-0 flex-1 text-[13px] leading-[1.5] text-warn-ink">
        This was written before your latest change. Update to include it.
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

function Footer({ caseId }: { caseId: string }) {
  const { data: openRequest } = useOpenLawyerRequestQuery(caseId);
  const { data } = useEligibilityQuery(caseId);
  const canAsk = !openRequest && data?.eligible;
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3.5 text-xs text-ink-2">
      <span>This is what we&apos;ve gathered from you so far, to help a lawyer get up to speed quickly. It isn&apos;t legal advice.</span>
      {canAsk && (
        <button
          type="button"
          onClick={() => useLawyerRequestForm.getState().openFor(caseId)}
          className="inline-flex items-center gap-1.5 self-start font-medium text-gold hover:text-gold-hover"
        >
          <Scale size={12} />
          Send this to a lawyer
        </button>
      )}
    </div>
  );
}
