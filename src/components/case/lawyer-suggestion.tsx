"use client";

import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/components/device/device-provider";
import { cn } from "@/lib/cn";
import { lawyerKind, useLawyerReadinessQuery } from "@/lib/cases/readiness";
import { useLawyerRequestForm } from "@/lib/lawyer-requests/api";

import { useT } from "@/components/site/language-provider";

/** A short lead-in for each unmet criterion, by its key (lawyer-readiness-jev.ts's
 * READINESS_CRITERIA) — filled into the composer, never sent on the client's behalf, same as
 * use-consultation.ts's askAbout for #157's missing-gap chips. Worded as a fragment the client
 * finishes themselves, not a full question, since these are topics a solicitor still needs
 * covered rather than single-answer questions. */
const CRITERION_PROMPTS: Record<string, string> = {
  problem: "The kind of problem this is: ",
  place: "This happened in: ",
  otherSide: "The other side is: ",
  events: "What happened, and roughly when: ",
  goal: "What I want to get out of this: ",
  status: "What's happened since, and where things stand now: ",
};

/**
 * Under the chat, after the AI's latest answer: suggests a lawyer once the case has what a lawyer
 * needs (checked by the API, see lib/cases/readiness.ts), and until then shows what's still
 * missing, so it's never a mystery why we haven't. With the check switched off on the API, offers a
 * lawyer as before. Each unmet item is tappable — it starts that answer in the composer rather
 * than sitting as a read-only status list.
 *
 * On a phone the card is full width with a full-width button under its text; on desktop it lines
 * up with the AI's text, past the avatar, with the button beside it.
 */
export function LawyerSuggestion({ caseId, latestAnswerId, onAsk }: { caseId: string; latestAnswerId: string; onAsk: (text: string) => void }) {
  const t = useT();
  const mobile = useDevice() === "mobile";
  const openForm = () => useLawyerRequestForm.getState().openFor(caseId);
  const { data: r } = useLawyerReadinessQuery(caseId, latestAnswerId);

  // Desktop lines up with the AI's text; on a phone everything is full width.
  const indent = mobile ? "" : "ml-[38px]";
  const card = cn(
    "rounded-card border border-line bg-subtle",
    mobile ? "flex flex-col gap-3 p-4" : `${indent} flex flex-wrap items-center gap-4 px-[18px] py-4`,
  );
  const action = (
    <Button size={mobile ? "lg" : "sm"} className={mobile ? "w-full" : undefined} onClick={openForm}>
      {t("Get a lawyer")}
    </Button>
  );

  if (!r || r.unavailable) return null;

  if (!r.enabled) {
    return (
      <div className={card}>
        <div className={mobile ? undefined : "min-w-[200px] flex-1"}>
          <div className="text-sm font-semibold">{t("Want a lawyer to look at this case?")}</div>
          <div className="text-[13px] leading-[1.45] text-ink-2">{t("A verified lawyer reviews this case and your chat. Included with your case.")}</div>
        </div>
        {action}
      </div>
    );
  }

  if (r.blockedBy) {
    return (
      <div className={cn(indent, "text-[13px] leading-[1.45] text-ink-2")}>
        {r.blockedBy === "OUTSIDE_UK"
          ? t("Lawyers are only available for cases in the UK for now. You can keep asking the AI about it.")
          : t("We can't connect personal injury cases with a lawyer yet. You can keep asking the AI about it.")}
      </div>
    );
  }

  if (r.ready) {
    return (
      <div className={card}>
        <div className={mobile ? undefined : "min-w-[200px] flex-1"}>
          <div className="text-sm font-semibold">{t("Your case has what a lawyer needs")}</div>
          <div className="text-[13px] leading-[1.45] text-ink-2">
            {t("We'd look for {who}. A verified lawyer reviews this case and your chat.", { who: lawyerKind(r) })}
          </div>
        </div>
        {action}
      </div>
    );
  }

  const missing = r.criteria.filter((c) => !c.met);
  return (
    <div className={cn(indent, "flex flex-col gap-2 rounded-card border border-dashed border-line py-3.5", mobile ? "px-4" : "px-[18px]")}>
      <div className="text-[13px] font-semibold">
        {missing.length === 1 ? t("To suggest the right lawyer, tell me a little more about this:") : t("To suggest the right lawyer, tell me a little more about these:")}
      </div>
      <ul className="flex flex-col gap-1">
        {r.criteria.map((c) =>
          c.met ? (
            <li key={c.key} className="flex items-center gap-2 text-[13px] text-muted">
              <Check size={13} className="text-success" />
              {c.label}
            </li>
          ) : (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onAsk(CRITERION_PROMPTS[c.key] ?? `${c.label}: `)}
                data-no-tap
                className="flex min-h-8 items-center gap-2 text-[13px] text-ink underline decoration-dotted underline-offset-2 hover:text-gold"
              >
                <Circle size={11} className="shrink-0 text-muted" />
                {c.label}
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
