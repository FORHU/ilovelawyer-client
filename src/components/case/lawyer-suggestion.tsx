"use client";

import { Button } from "@/components/ui/button";
import { useDevice } from "@/components/device/device-provider";
import { cn } from "@/lib/cn";
import { lawyerKind, useLawyerReadinessQuery } from "@/lib/cases/readiness";
import { useLawyerRequestForm } from "@/lib/lawyer-requests/api";

import { useT } from "@/components/site/language-provider";

/**
 * Under the chat, after the AI's latest answer: suggests a lawyer once the case has what a lawyer
 * needs (checked by the API, see lib/cases/readiness.ts). Shows nothing while criteria are still
 * unmet — intake itself asks for whatever's missing, one question at a time; this is not a second,
 * parallel way to answer it, and showing a checklist here duplicated and sometimes contradicted
 * the AI's own question (a criterion could read "met" from a field CW set outside the
 * conversation, while the AI was still asking about it). With the check switched off on the API,
 * offers a lawyer unconditionally, as before.
 *
 * On a phone the card is full width with a full-width button under its text; on desktop it lines
 * up with the AI's text, past the avatar, with the button beside it.
 */
export function LawyerSuggestion({ caseId, latestAnswerId }: { caseId: string; latestAnswerId: string }) {
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

  // Still incomplete: nothing to show here. Intake itself asks for what's missing.
  return null;
}
