"use client";

import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEligibilityQuery, useLawyerRequestForm, useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { useApp } from "@/lib/store";

/** Why there's no lawyer for this case, in words the client can act on. */
export const NOT_AVAILABLE_TEXT = {
  NOT_UK_CASE: "Lawyers are only available for cases in England and Wales, Scotland or Northern Ireland for now.",
  PERSONAL_INJURY_EXCLUDED: "We can't connect personal injury cases with a lawyer yet.",
} as const;

/**
 * The case header's lawyer button, decided by the API (GET /api/client/lawyer-requests/eligibility):
 * "Get a lawyer" on a UK case, "Not available yet" outside the UK, and a short explanation for
 * personal injury. Nothing while there's already a request.
 */
export function GetLawyerAction({ caseId }: { caseId: string }) {
  const { data: openRequest } = useOpenLawyerRequestQuery(caseId);
  const { data } = useEligibilityQuery(caseId);

  if (!data || openRequest) return null;

  if (data.eligible) {
    return (
      <Button variant="soft" size="md" data-no-tap className="h-11 flex-1 !px-4 md:h-9 md:flex-none" onClick={() => useLawyerRequestForm.getState().openFor(caseId)}>
        <Scale size={14} />
        Get a lawyer
      </Button>
    );
  }

  if (data.reason === "NOT_UK_CASE" || data.reason === "PERSONAL_INJURY_EXCLUDED") {
    const why = NOT_AVAILABLE_TEXT[data.reason];
    // A button, not a tooltip, so the reason can be read on a phone too.
    return (
      <button
        type="button"
        title={why}
        aria-label={`Lawyer not available yet. ${why}`}
        onClick={() => useApp.getState().setBanner(why)}
        data-no-tap
        className="flex h-11 flex-1 shrink-0 items-center justify-center gap-2 rounded-full border border-dashed border-line px-4 text-[12.5px] text-muted md:h-9 md:flex-none"
      >
        <Scale size={14} />
        {data.reason === "NOT_UK_CASE" ? "Not available yet" : "Can't refer yet"}
      </button>
    );
  }

  return null;
}
