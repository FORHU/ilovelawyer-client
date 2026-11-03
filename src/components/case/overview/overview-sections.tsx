"use client";

import { useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AsideCard, SectionCard, SectionSkeleton } from "@/components/case/overview/overview-section";
import { SourceBadge } from "@/components/case/overview/source-badge";
import { cn } from "@/lib/cn";
import { deadlineStatus, urgentFirst } from "@/lib/cases/overview-urgency";
import { formatDay, formatEventDate } from "@/lib/format";
import { useEligibilityQuery, useLawyerRequestForm, useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import type { CaseIntake, IntakeItem } from "@/lib/types";

export type SourceProps = { onOpenChat: () => void; onOpenDocument: (id: string) => void };

/** A section with nothing to show yet: its title, and what will appear there. */
export interface EmptySection {
  title: string;
  empty: ReactNode;
}

/** On a phone, a long list shows this many items and a "Show more" for the rest. */
const COMPACT_LIST_LIMIT = 5;

/** The Overview's cards, built once for both layouts. One job writes the whole intake, so every
 * section is empty/running together until there's something to show, then has content for good (a
 * later STALE keeps showing the last good content, with the banner above saying it's out of date —
 * never blanked out just because it's stale). A section with content is drawn as a card; one
 * without is a skeleton while the job runs, and otherwise folded into "Nothing here yet" so the page
 * isn't a stack of empty cards. `compact` is the phone: dates that are coming up come first, and a
 * long timeline or fact list folds. */
export function buildSections(intake: CaseIntake, running: boolean, sourceProps: SourceProps, compact = false) {
  const { onOpenChat } = sourceProps;
  const empties: EmptySection[] = [];
  const section = (title: string, has: boolean, empty: ReactNode, card: () => ReactNode): ReactNode => {
    if (has) return card();
    if (running) return <SectionSkeleton key={title} title={title} />;
    empties.push({ title, empty });
    return null;
  };

  const summary = section(
    "Summary",
    !!intake.summary,
    <>Once you&apos;ve told us a bit about your case, you&apos;ll get a short AI summary of it here.</>,
    () => (
      <SectionCard
        title="Summary"
        aside={<span className="rounded-full bg-chip px-2 py-0.5 text-[11px] text-ink-2">AI-written · check it against what you said</span>}
      >
        <p className="font-display text-[19px] leading-[1.5] tracking-[-0.01em] text-balance">{intake.summary}</p>
      </SectionCard>
    ),
  );

  const timelineItems = intake.timeline.map((t, i) => (
    <li key={`${t.id}-${i}`} className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[96px_minmax(0,1fr)]">
      <span className="text-[12.5px] text-ink-2">{t.date ? formatEventDate(t.date, t.datePrecision) : ""}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span>{t.text}</span>
        <SourceBadge sources={t.sources} {...sourceProps} />
      </div>
    </li>
  ));
  const timeline = section(
    "Timeline",
    intake.timeline.length > 0,
    <>As you tell us what happened and when, we&apos;ll put together a timeline here.</>,
    () => (
      <SectionCard title="Timeline" className="gap-3.5">
        <ol className="flex flex-col gap-4 border-l border-line pl-[18px]">
          {compact ? <ShowMore items={timelineItems} what="events" /> : timelineItems}
        </ol>
        <span className="text-[11.5px] text-ink-2">Dates show only as precisely as they were given — a month you mentioned stays a month.</span>
      </SectionCard>
    ),
  );

  const factItems = intake.facts.map((f, i) => (
    <li key={`${f.id}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-[11px] last:border-b-0">
      <span className="min-w-0 flex-[1_1_320px]">{f.text}</span>
      <SourceBadge sources={f.sources} {...sourceProps} />
    </li>
  ));
  const facts = section(
    "Key facts",
    intake.facts.length > 0,
    <>Important facts you mention or that come up in your documents will be collected here.</>,
    () => (
      <SectionCard title="Key facts">
        <ul className="flex flex-col">{compact ? <ShowMore items={factItems} what="facts" /> : factItems}</ul>
      </SectionCard>
    ),
  );

  const people = section(
    "People involved",
    intake.people.length > 0,
    <>Anyone else involved — an employer, a landlord, a witness — will show up here as you mention them.</>,
    () => (
      <SectionCard title="People involved">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
          {intake.people.map((p, i) => (
            <li key={`${p.id}-${i}`} className="flex flex-col gap-0.5 rounded-input border border-line bg-subtle px-3.5 py-3">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-ink-2">{p.role}</span>
              <SourceBadge sources={p.sources} {...sourceProps} />
            </li>
          ))}
        </ul>
      </SectionCard>
    ),
  );

  const goals = section(
    "Your goals and concerns",
    intake.goals.length > 0 || intake.concerns.length > 0,
    <>Tell us what you&apos;re hoping for and what&apos;s worrying you, and we&apos;ll list it here for your lawyer.</>,
    () => (
      <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 rounded-card border border-line bg-white px-5 py-[22px] md:px-6">
        {intake.goals.length > 0 && <BulletColumn title="What you want" items={intake.goals} sourceProps={sourceProps} />}
        {intake.concerns.length > 0 && <BulletColumn title="What worries you" items={intake.concerns} sourceProps={sourceProps} />}
      </section>
    ),
  );

  const questions = section(
    "Questions for your lawyer",
    intake.questionsForLawyer.length > 0,
    <>Ask the AI anything you&apos;d like a lawyer&apos;s view on — it can&apos;t answer for them, but it will save the question here.</>,
    () => (
      <SectionCard title="Questions for your lawyer">
        <ul className="flex flex-col gap-2.5">
          {intake.questionsForLawyer.map((q, i) => (
            <li key={`${q.id}-${i}`} className="flex flex-col gap-0.5 rounded-input border border-dashed border-line-input px-3.5 py-3">
              <span>{q.text}</span>
              <SourceBadge sources={q.sources} {...sourceProps} />
            </li>
          ))}
        </ul>
      </SectionCard>
    ),
  );

  const stillNeeded = section(
    "Still needed",
    intake.missing.length > 0,
    <>Nothing obvious is missing yet.</>,
    () => (
      <AsideCard title="Still needed">
        <ol className="flex flex-col gap-3.5">
          {intake.missing.map((g, i) => (
            <li key={`${g.id}-${i}`} className="flex gap-2.5">
              <span aria-hidden className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-chip text-[11px] font-semibold">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-[3px]">
                <span>{g.question}</span>
                {g.why && <span className="text-[12.5px] text-ink-2">{g.why}</span>}
                <button type="button" onClick={onOpenChat} className="self-start text-left text-[12.5px] font-medium text-gold underline underline-offset-2 hover:text-gold-hover">
                  Answer in the interview →
                </button>
              </div>
            </li>
          ))}
        </ol>
      </AsideCard>
    ),
  );

  const doubleCheck = section(
    "Things to double-check",
    intake.conflicts.length > 0,
    <>If something you&apos;ve said doesn&apos;t match a document — or two documents disagree — we&apos;ll flag it here rather than guess which is right.</>,
    () => (
      <section className="flex flex-col gap-2.5 rounded-card border border-warn-line bg-warn-bg px-[18px] py-4 text-warn-ink">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold">
          <TriangleAlert size={14} aria-hidden />
          Double-check
        </h3>
        <ul className="flex flex-col gap-3">
          {intake.conflicts.map((cf, i) => (
            <li key={`${cf.id}-${i}`} className="flex flex-col gap-1.5">
              <span>{cf.description}</span>
              <SourceBadge sources={cf.sources} {...sourceProps} tone="warn" />
            </li>
          ))}
        </ul>
      </section>
    ),
  );

  const deadlineList = compact ? urgentFirst(intake.deadlines) : intake.deadlines;
  const deadlines = section(
    "Deadlines you've mentioned",
    intake.deadlines.length > 0,
    <>A deadline, hearing date or time limit you or a document mentions will show up here — exactly as stated, never worked out for you.</>,
    () => (
      <AsideCard title="Dates you've mentioned" className="gap-2.5">
        <ul className="flex flex-col gap-2.5">
          {deadlineList.map((d, i) => (
            <Deadline key={`${d.id}-${i}`} text={d.text} date={d.date} sources={d.sources} sourceProps={sourceProps} />
          ))}
        </ul>
        <span className="text-[11.5px] text-ink-2">Shown exactly as stated — never worked out for you.</span>
      </AsideCard>
    ),
  );

  return { summary, timeline, facts, people, goals, questions, stillNeeded, doubleCheck, deadlines, empties };
}

/** The first few items of a long list, and a 44px button for the rest. */
function ShowMore({ items, what }: { items: ReactNode[]; what: string }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, COMPACT_LIST_LIMIT);
  return (
    <>
      {shown}
      {items.length > COMPACT_LIST_LIMIT && (
        <li className="list-none">
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            aria-expanded={all}
            data-no-tap
            className="min-h-11 w-full rounded-full border border-line-input text-[13px] font-medium text-ink-2 active:bg-chip"
          >
            {all ? "Show fewer" : `Show ${items.length - COMPACT_LIST_LIMIT} more ${what}`}
          </button>
        </li>
      )}
    </>
  );
}

function BulletColumn({ title, items, sourceProps }: { title: string; items: IntakeItem[]; sourceProps: SourceProps }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-[1px] text-ink-2">{title}</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-[18px]">
        {items.map((it, i) => (
          <li key={`${it.id}-${i}`}>
            {it.text}
            <div>
              <SourceBadge sources={it.sources} {...sourceProps} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Deadline({ text, date, sources, sourceProps }: { text: string; date: string | null; sources: IntakeItem["sources"]; sourceProps: SourceProps }) {
  const { days, passed, urgent } = deadlineStatus(date);
  return (
    <li
      className={cn(
        "flex flex-col gap-[3px] rounded-input border px-3.5 py-3",
        urgent ? "border-error-line bg-error-bg text-error-ink" : "border-line bg-subtle",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-medium", passed && "text-ink-2 line-through")}>{text}</span>
        {date && <span className={cn("whitespace-nowrap text-xs", !urgent && "text-ink-2")}>{formatDay(date)}</span>}
      </div>
      {urgent && (
        <span className="text-xs font-medium">
          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`} — check this with a lawyer soon.
        </span>
      )}
      {passed && <span className="text-xs text-ink-2">This date has passed. Mention it to your lawyer.</span>}
      <SourceBadge sources={sources} {...sourceProps} />
    </li>
  );
}

export function NothingYet({ sections }: { sections: EmptySection[] }) {
  return (
    <details className="rounded-card border border-dashed border-line-input px-5 py-3.5">
      <summary className="cursor-pointer text-[13px] font-medium">
        Nothing here yet · {sections.length} {sections.length === 1 ? "section" : "sections"}
      </summary>
      <ul className="flex flex-col gap-3 pt-3">
        {sections.map((s) => (
          <li key={s.title} className="flex flex-col gap-1">
            <span className="font-medium">{s.title}</span>
            <span className="text-[13px] text-ink-2">{s.empty}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Asking for a lawyer, from the page that has just shown what a lawyer would see. Only offered when
 * the case can have one and doesn't already. */
export function GetLawyerCard({ caseId, fullWidth }: { caseId: string; fullWidth?: boolean }) {
  const { data: openRequest } = useOpenLawyerRequestQuery(caseId);
  const { data } = useEligibilityQuery(caseId);
  if (openRequest || !data?.eligible) return null;
  return (
    <section className="flex flex-col gap-2.5 rounded-card bg-primary px-5 py-[18px] text-white">
      <h3 className="font-display text-[19px]">Get a lawyer for this case</h3>
      <p className="text-[13px] text-[#d4d4d4]">
        Let us send an anonymised summary to every matching lawyer. The first to pick it up checks for conflicts and sends you a quote.
      </p>
      <Button
        variant="soft"
        size={fullWidth ? "lg" : "md"}
        className={cn("mt-1 !border-0", fullWidth ? "w-full" : "self-start")}
        onClick={() => useLawyerRequestForm.getState().openFor(caseId)}
      >
        Match me
      </Button>
    </section>
  );
}
