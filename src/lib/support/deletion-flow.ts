import { ApiError } from "@/lib/api/fetch";
import type { SupportBlockingRequest, SupportDeletionCheck } from "./types";

// The steps of "Delete my account" that don't need a screen: what to do with the API's answers.

/** The flow's id in the seeded content. Settings opens the chat at it; if an admin has removed or
 * renamed it, the chat says it can't carry on and offers a person. */
export const DELETE_ACCOUNT_FLOW_ID = "delete-account";

/** Shown when the content has no safety copy of its own for the action. */
export const FALLBACK_SAFETY_COPY = [
  "Your account will be deleted in 30 days. Signing in again before then cancels the deletion.",
  "Any unused Chat Credits are lost and are not refunded.",
  "If you have an open lawyer request, you need to withdraw it or end it first.",
];

/** What the client sees next once the check is back: the open requests, or (for a password account)
 * the password, or (for a Google account) just the final confirmation. */
export type DeletionStep = "BLOCKED" | "PASSWORD" | "CONFIRM";

export function stepAfterCheck(check: SupportDeletionCheck): DeletionStep {
  if (check.blocking.length > 0) return "BLOCKED";
  return check.hasPassword ? "PASSWORD" : "CONFIRM";
}

/** The open lawyer requests a refused deletion carries (409 OPEN_LAWYER_REQUESTS), or null for any
 * other error. The check normally catches them first; this covers a request made in between. */
export function blockingFromError(err: unknown): SupportBlockingRequest[] | null {
  if (!(err instanceof ApiError) || err.status !== 409 || err.code !== "OPEN_LAWYER_REQUESTS") return null;
  const requests = err.body?.requests;
  return Array.isArray(requests) ? (requests as SupportBlockingRequest[]) : [];
}

/** The page in the app where the request is dealt with: its case's Lawyer tab. */
export const requestHref = (request: Pick<SupportBlockingRequest, "caseId">) => `/cases/${request.caseId}?tab=lawyer`;

export const BLOCKING_ACTION_LABEL: Record<SupportBlockingRequest["action"], string> = {
  WITHDRAW: "Withdraw",
  END: "End",
  REVIEW: "Review",
};

export const BLOCKED_TEXT =
  "I can't delete your account yet. These lawyer requests are still open. Once they're withdrawn or ended, come back and I'll take you through it.";

/** A wrong password is the one error worth telling apart: the field can be tried again. */
export const isWrongPassword = (err: unknown) => err instanceof ApiError && err.status === 400 && /password/i.test(err.message);
