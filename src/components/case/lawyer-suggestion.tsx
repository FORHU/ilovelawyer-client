"use client";

import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lawyerKind, useLawyerReadinessQuery } from "@/lib/cases/readiness";
import { useStartLawyerRequest } from "@/lib/lawyer-requests/api";

const card = "ml-[38px] flex flex-wrap items-center gap-4 rounded-card border border-line bg-subtle px-[18px] py-4";

/**
 * Under the chat, after the AI's latest answer: suggests a lawyer once the case has what a lawyer
 * needs (checked by the API, see lib/cases/readiness.ts), and until then shows what's still
 * missing, so it's never a mystery why we haven't. With the check switched off on the API, offers a
 * lawyer as before.
 */
export function LawyerSuggestion({ caseId, latestAnswerId }: { caseId: string; latestAnswerId: string }) {
  const openForm = useStartLawyerRequest(caseId);
  const { data: r } = useLawyerReadinessQuery(caseId, latestAnswerId);

  if (!r || r.unavailable) return null;

  if (!r.enabled) {
    return (
      <div className={card}>
        <div className="min-w-[200px] flex-1">
          <div className="text-sm font-semibold">Want a lawyer to look at this case?</div>
          <div className="text-[13px] text-ink-2">A verified lawyer reviews this case and your chat. Included with your case.</div>
        </div>
        <Button size="sm" onClick={openForm}>
          Get a lawyer
        </Button>
      </div>
    );
  }

  if (r.blockedBy) {
    return (
      <div className="ml-[38px] text-[13px] text-ink-2">
        {r.blockedBy === "OUTSIDE_UK"
          ? "Lawyers are only available for cases in the UK for now. You can keep asking the AI about it."
          : "We can't connect personal injury cases with a lawyer yet. You can keep asking the AI about it."}
      </div>
    );
  }

  if (r.ready) {
    return (
      <div className={card}>
        <div className="min-w-[200px] flex-1">
          <div className="text-sm font-semibold">Your case has what a lawyer needs</div>
          <div className="text-[13px] text-ink-2">
            We&apos;d look for {lawyerKind(r)}. A verified lawyer reviews this case and your chat.
          </div>
        </div>
        <Button size="sm" onClick={openForm}>
          Get a lawyer
        </Button>
      </div>
    );
  }

  const missing = r.criteria.filter((c) => !c.met);
  return (
    <div className="ml-[38px] flex flex-col gap-2 rounded-card border border-dashed border-line px-[18px] py-3.5">
      <div className="text-[13px] font-semibold">
        To suggest the right lawyer, tell me a little more about {missing.length === 1 ? "this" : "these"}:
      </div>
      <ul className="flex flex-col gap-1">
        {r.criteria.map((c) => (
          <li key={c.key} className={`flex items-center gap-2 text-[13px] ${c.met ? "text-muted" : "text-ink"}`}>
            {c.met ? <Check size={13} className="text-success" /> : <Circle size={11} className="text-muted" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
