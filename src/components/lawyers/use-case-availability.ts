import { NOT_AVAILABLE_TEXT } from "@/components/case/get-lawyer-action";
import { useEligibilityQuery } from "@/lib/lawyer-requests/api";

/** Whether a case can be sent to a lawyer (GET /api/client/lawyer-requests/eligibility, the same
 * check as the case header's "Get a lawyer"), and why not, in words the client can act on. */
export function useCaseAvailability(caseId: string | null) {
  const { data } = useEligibilityQuery(caseId ?? "");
  if (!caseId || !data) return { canRequest: false, reason: null };
  if (data.eligible) return { canRequest: true, reason: null };
  const reason =
    data.reason === "REQUEST_ALREADY_OPEN"
      ? "This case already has an open request. Withdraw it from the case’s Lawyer tab to send a new one."
      : data.reason
        ? NOT_AVAILABLE_TEXT[data.reason]
        : null;
  return { canRequest: false, reason };
}
