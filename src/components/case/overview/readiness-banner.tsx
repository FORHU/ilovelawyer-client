"use client";

import { ArrowRight, Check, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import { caseBasics } from "@/lib/cases/basics";
import type { Case, CaseIntake } from "@/lib/types";

/** Where the case stands at the top of the Overview: how many of the things a lawyer needs are in,
 * whether the overview is current, and the one next step. The "things a lawyer needs" are the API's
 * own completeness criteria when it has them; otherwise the five basics worked out from what the
 * client has given so far (lib/cases/basics.ts), which say what is covered, not that a case is ready. */
export function ReadinessBanner({
  c,
  intake,
  updatePending,
  onUpdate,
  onContinue,
}: {
  c: Case;
  intake: CaseIntake;
  updatePending: boolean;
  onUpdate: () => void;
  onContinue: () => void;
}) {
  const fromApi = !!intake.completeness;
  const criteria = intake.completeness?.criteria ?? caseBasics(c, intake);
  const met = criteria.filter((cr) => cr.met).length;
  const left = criteria.length - met;
  const canUpdate = intake.updates.allowed && intake.updates.leftToday > 0;

  return (
    <section
      aria-label="Where your case stands"
      className="flex flex-wrap items-center gap-x-6 gap-y-5 rounded-modal border border-line bg-subtle px-5 py-[22px] md:px-6"
    >
      <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[1px] text-ink-2">
            {fromApi ? "Ready for a lawyer" : "Your case so far"}
          </span>
          <span className="font-display text-[22px] tracking-[-0.02em]">
            {met} of {criteria.length} {fromApi ? "things a lawyer needs" : "basics covered"}
          </span>
        </div>
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${criteria.length}, minmax(0, 1fr))`,
          }}
          aria-hidden
        >
          {criteria.map((cr) => (
            <span
              key={cr.key}
              className={cn(
                "h-1.5 rounded-full",
                cr.met ? "bg-gold" : "bg-line",
              )}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-1">
          {criteria.map((cr) => (
            <li
              key={cr.key}
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs",
                cr.met
                  ? "bg-success-bg text-success-ink"
                  : "border border-dashed border-line-input text-ink",
              )}
            >
              {cr.met && <Check size={12} strokeWidth={2.5} aria-hidden />}
              {cr.label}
              <span className="sr-only">
                {cr.met ? " — done" : " — still needed"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-w-[240px] flex-[1_1_240px] flex-col items-start gap-2.5">
        <Freshness
          intake={intake}
          canUpdate={canUpdate}
          updatePending={updatePending}
          onUpdate={onUpdate}
        />
        <Button variant="dark" size="md" onClick={onContinue}>
          Continue the interview
          <ArrowRight size={14} aria-hidden />
        </Button>
        <span className="text-xs text-ink-2">
          {left === 0
            ? fromApi
              ? "You have what a lawyer needs to get started."
              : "The basics are covered. Keep going in the interview to add the detail."
            : fromApi
              ? `${left} ${left === 1 ? "thing" : "things"} left before we can suggest the right lawyer.`
              : `${left} of the basics still to cover — the interview will ask about ${left === 1 ? "it" : "them"}.`}
        </span>
      </div>
    </section>
  );
}

function Freshness({
  intake,
  canUpdate,
  updatePending,
  onUpdate,
}: {
  intake: CaseIntake;
  canUpdate: boolean;
  updatePending: boolean;
  onUpdate: () => void;
}) {
  if (intake.status === "RUNNING") {
    return (
      <span
        role="status"
        className="flex items-center gap-1.5 text-[12.5px] text-ink-2"
      >
        <span
          className="size-[7px] animate-pulse rounded-full bg-gold"
          aria-hidden
        />
        Updating your overview — usually a minute or two
      </span>
    );
  }
  if (intake.status === "STALE") {
    return (
      <span className="flex flex-wrap items-center gap-2 text-[12.5px] text-warn-ink">
        <span className="size-[7px] rounded-full bg-[#b7860b]" aria-hidden />
        Your latest message isn&apos;t included yet
        <button
          type="button"
          onClick={onUpdate}
          disabled={updatePending || !canUpdate}
          data-no-tap
          className="h-7 rounded-full border border-warn-line bg-warn-bg px-3 text-xs font-semibold disabled:opacity-40"
        >
          {updatePending
            ? "Updating…"
            : canUpdate
              ? `Update · ${intake.updates.leftToday} left today`
              : "No updates left today"}
        </button>
      </span>
    );
  }
  if (intake.status === "FAILED") {
    return (
      <span className="flex flex-wrap items-center gap-2 text-[12.5px] text-error-ink">
        We couldn&apos;t put your overview together. Nothing was lost.
        <Button
          variant="soft"
          size="sm"
          onClick={onUpdate}
          disabled={updatePending}
          className="!h-7 !px-3"
        >
          <RotateCw size={12} aria-hidden />
          Try again
        </Button>
      </span>
    );
  }
  if (intake.status === "READY" && intake.generatedAt) {
    return (
      <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
        <span className="size-[7px] rounded-full bg-success" aria-hidden />
        Up to date · updated {timeAgo(intake.generatedAt)}
      </span>
    );
  }
  return null;
}
