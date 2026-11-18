import { ApiError } from "@/lib/api/fetch";
import type { SupportThread, SupportTicketContext } from "./types";

// What a Support Ticket needs worked out before it is sent, kept apart from React so it can be tested.

/** The API's own limits (SUPPORT_CONTEXT_LIMITS, SUPPORT_MESSAGE_MAX_LENGTH): over them it answers 400. */
const FLOW_PATH_MAX = 12;
const FLOW_ID_MAX = 80;
const PAGE_MAX = 200;
export const TICKET_MESSAGE_MAX = 4000;

const FLOW_ID = /^[\w-]+$/;
const CASE_PATH = /^\/cases\/(?!new(?:\/|$))([^/]+)/;

/** The context sent with a ticket: the help topics walked (the last twelve), the page's path with no
 * query or hash, and the case when the page is one. The API confirms the client owns the case. */
export function ticketContext(flowPath: string[], pathname: string | null): SupportTicketContext {
  const page = (pathname ?? "").split(/[?#]/)[0].slice(0, PAGE_MAX);
  const caseId = CASE_PATH.exec(page)?.[1];
  const flows = flowPath.filter((id) => id.length <= FLOW_ID_MAX && FLOW_ID.test(id)).slice(-FLOW_PATH_MAX);
  return {
    ...(flows.length > 0 ? { flowPath: flows } : {}),
    ...(page ? { page } : {}),
    ...(caseId && caseId.length <= FLOW_ID_MAX ? { caseId } : {}),
  };
}

/** A conversation still going: a message sent now joins it. A closed one starts a new ticket. */
export const isActiveThread = (thread: SupportThread | null | undefined): thread is SupportThread => !!thread && thread.status !== "RESOLVED";

export const unreadCount = (thread: SupportThread | null | undefined) => thread?.unreadCount ?? 0;

/** What to tell a visitor whose ticket wasn't sent. A wrong captcha and too many tries are worth
 * telling apart from everything else, because the visitor can fix the first and should wait on the second. */
export function visitorErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "CAPTCHA_FAILED") return "We couldn't check that you're not a robot. Please try again.";
    if (err.status === 429) return "That's a lot of messages. Please wait a few minutes and try again.";
    if (err.status === 400) return err.message;
  }
  return "We couldn't send that. Check your connection and try again.";
}
