import type { LawyerRequestStatus } from "@/lib/lawyer-requests/api";

// How a request's API status reads to the client, in plain words (ilovelawyer-client#19).

export type StatusStep = "looking" | "reviewing" | "quoted" | "confirmed";

/** The timeline, in order. */
export const STEPS: { id: StatusStep; label: string; /** What happens at this step, shown while it's still ahead. */ next: string }[] = [
  { id: "looking", label: "Looking for a lawyer", next: "We match your case with verified lawyers." },
  { id: "reviewing", label: "A lawyer is reviewing your case", next: "A lawyer checks for conflicts, then prepares a quote." },
  { id: "quoted", label: "Quote received", next: "You see their fee and decide whether to go ahead." },
  { id: "confirmed", label: "Lawyer confirmed", next: "Your lawyer gets access to your case and you can chat." },
];

export interface StatusView {
  /** Where the request is on the timeline; null once it has ended. */
  step: StatusStep | null;
  title: string;
  detail: string;
  /** The client can still withdraw (not after confirming). */
  canWithdraw: boolean;
}

const VIEWS: Record<LawyerRequestStatus, StatusView> = {
  REQUESTED: { step: "looking", title: "Looking for a lawyer", detail: "We're matching your case with verified lawyers.", canWithdraw: true },
  ROUTED: { step: "looking", title: "Looking for a lawyer", detail: "Matching lawyers can see your case summary now.", canWithdraw: true },
  CLAIMED: { step: "reviewing", title: "A lawyer is reviewing your case", detail: "They'll check for conflicts, then send you a quote.", canWithdraw: true },
  QUOTED: { step: "quoted", title: "Quote received", detail: "Review the quote, then confirm or decline.", canWithdraw: true },
  CONFIRMED: { step: "confirmed", title: "Lawyer confirmed", detail: "You're set. Your lawyer is getting access to your case.", canWithdraw: false },
  ENGAGED: { step: "confirmed", title: "Lawyer confirmed", detail: "Your lawyer has access to your case.", canWithdraw: false },
  EXPIRED: { step: null, title: "No lawyer found", detail: "No lawyer took your case in time. You can request again.", canWithdraw: false },
  WITHDRAWN: { step: null, title: "Request withdrawn", detail: "Lawyers can no longer see your case. You can request again.", canWithdraw: false },
  CLOSED: { step: null, title: "Engagement closed", detail: "Your lawyer no longer has access to this case.", canWithdraw: false },
};

export function describeStatus(status: LawyerRequestStatus): StatusView {
  return VIEWS[status];
}
