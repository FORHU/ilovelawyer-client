"use client";

import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLawyerReadinessQuery } from "@/lib/cases/readiness";
import { useCaseQuery, useMessagesQuery } from "@/lib/cases/queries";
import { firstName } from "@/lib/format";
import { useEligibilityQuery, useLawyerRequestForm, useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { chosenLawyerFit, useChosenLawyer } from "@/lib/lawyers/chosen-lawyer";
import { useApp } from "@/lib/store";

import { useT } from "@/components/site/language-provider";
import { msg } from "@/lib/i18n/msg";
/** Why there's no lawyer for this case, in words the client can act on. */
export const NOT_AVAILABLE_TEXT = {
  NOT_UK_CASE: msg("Lawyers are only available for cases in England and Wales, Scotland or Northern Ireland for now."),
  REGION_UNKNOWN: msg("Choose which part of the UK your case is in, and we can look for a lawyer."),
  PERSONAL_INJURY_EXCLUDED: msg("We can't connect personal injury cases with a lawyer yet."),
} as const;

/**
 * The case header's lawyer button, decided by the API (GET /api/client/lawyer-requests/eligibility):
 * "Get a lawyer" on a UK case, "Not available yet" outside the UK, "Part of the UK?" while nobody has
 * said which part (the chat asks, see RegionPrompt), and a short explanation for personal injury. Nothing while there's already a request, or while the case is missing what a
 * lawyer needs (lib/cases/readiness.ts).
 */
export function GetLawyerAction({ caseId }: { caseId: string }) {
  const t = useT();
  const { data: openRequest } = useOpenLawyerRequestQuery(caseId);
  const { data } = useEligibilityQuery(caseId);
  const { data: messages } = useMessagesQuery(caseId);
  const latestAnswerId = messages?.messages.findLast((m) => m.role === "ai")?.id;
  const { data: readiness } = useLawyerReadinessQuery(caseId, latestAnswerId);
  const { data: theCase } = useCaseQuery(caseId);
  // A lawyer chosen first (Find a lawyer) who takes the case is asked by name; otherwise it's a
  // match, and the Interview's suggestion says why.
  const chosen = useChosenLawyer((s) => s.byCase[caseId] ?? null);
  const named = chosen && (!theCase || chosenLawyerFit(chosen, theCase) !== "mismatch") ? chosen : null;

  if (!data || openRequest) return null;

  if (data.eligible) {
    // Same check as the Interview's suggestion: only offer a lawyer once the case has what one
    // needs. Until that's known (or if the check couldn't run) there's nothing to offer; with the
    // check switched off on the API, offer it as before.
    if (!readiness || readiness.unavailable || (readiness.enabled && !readiness.ready)) return null;
    return (
      <Button variant="soft" size="md" data-no-tap data-tour="get-lawyer" className="h-11 flex-1 !px-4 md:h-9 md:flex-none" onClick={() => useLawyerRequestForm.getState().openFor(caseId, named ? { id: named.id, name: named.name } : undefined)}>
        <Scale size={14} />
        {named ? t("Request {name}", { name: firstName(named.name) ?? named.name }) : t("Get a lawyer")}
      </Button>
    );
  }

  if (data.reason === "NOT_UK_CASE" || data.reason === "REGION_UNKNOWN" || data.reason === "PERSONAL_INJURY_EXCLUDED") {
    const why = t(NOT_AVAILABLE_TEXT[data.reason]);
    // A button, not a tooltip, so the reason can be read on a phone too.
    return (
      <button
        type="button"
        title={why}
        aria-label={t("Lawyer not available yet. {why}", { why })}
        onClick={() => useApp.getState().setBanner(why)}
        data-no-tap
        className="flex h-11 flex-1 shrink-0 items-center justify-center gap-2 rounded-full border border-dashed border-line px-4 text-[12.5px] text-muted md:h-9 md:flex-none"
      >
        <Scale size={14} />
        {data.reason === "NOT_UK_CASE" ? t("Not available yet") : data.reason === "REGION_UNKNOWN" ? t("Part of the UK?") : t("Can't refer yet")}
      </button>
    );
  }

  return null;
}
