import { firstName, formatDateTime } from "@/lib/format";
import { money } from "@/lib/pricing";
import type { LawyerRequest, Quotation } from "./api";

/** Where a request sits on the five-step line. "sent" is its own step (the brief is being written
 * before any lawyer sees it), and "finalising" is CONFIRMED: the client has accepted a quote and pays
 * it here (or, for a request accepted before quotation payments, the lawyer's side isn't open yet). */
export type Phase = "sent" | "finding" | "reviewing" | "quote" | "finalising" | "engaged" | "closed" | "expired";

export function phaseOf(request: LawyerRequest): Phase {
  switch (request.status) {
    case "REQUESTED":
      return "sent";
    case "ROUTED":
      return "finding";
    case "CLAIMED":
      return "reviewing";
    case "QUOTED":
      return "quote";
    case "CONFIRMED":
      return "finalising";
    case "ENGAGED":
      return "engaged";
    case "CLOSED":
      return "closed";
    case "EXPIRED":
    case "WITHDRAWN":
      return "expired";
  }
}

/** How many steps are behind the request. */
export const POSITION: Record<Phase, number> = { sent: 0, finding: 1, reviewing: 2, quote: 3, finalising: 4, engaged: 4, closed: 5, expired: 1 };

export const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** "Friday 6 November" */
export function pickByDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** "9:00 am on Friday 6 November": the request closes at that moment, not at the end of the day. */
export function pickByTime(iso: string) {
  const at = new Date(iso);
  const time = at.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${time} on ${at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`;
}

export interface Step {
  label: string;
  sub: string;
  time?: string;
  expect?: string;
}

export function stepsFor(request: LawyerRequest, phase: Phase): Step[] {
  const first = firstName(request.lawyer?.name);
  // Several lawyers (ilovelawyer-api phase 5): the steps count them rather than assume one.
  const on = request.lawyers.length;
  const quoted = request.lawyers.filter((l) => l.quote).length;
  return [
    { label: "Request sent", sub: "Anonymised summary of your overview", time: formatDateTime(request.createdAt), expect: "Takes about a minute" },
    {
      label: phase === "expired" ? "No lawyer picked it up" : "Finding a lawyer",
      sub: "Sent to matching lawyers",
      expect: phase === "expired" ? "Ended after 48 hours, or 7 days without a choice" : "Most are picked up within a day",
    },
    { label: on > 1 ? `${on} lawyers are reviewing` : "A lawyer is reviewing", sub: "Conflict check, then a quote" },
    { label: quoted > 1 ? "Compare the quotes" : "Review the quote", sub: "Accept one and pay through ilovelawyer, or decline" },
    {
      label:
        phase === "finalising"
          ? request.awaitingPayment
            ? `Pay${first ? ` ${first}'s` : " the"} quote`
            : `Finalising${first ? ` with ${first}` : ""}`
          : "Working with your lawyer",
      sub: "Messages, and read-only access to your case",
      time: request.engagedAt ? (request.closedAt ? `${day(request.engagedAt)} – ${day(request.closedAt)}` : formatDateTime(request.engagedAt)) : undefined,
      expect:
        phase === "finalising"
          ? request.awaitingPayment && request.quotation
            ? `Pay by ${pickByDay(request.quotation.expiresAt)}`
            : "Usually takes a few minutes"
          : request.engagedAt
            ? `Started ${day(request.engagedAt)}`
            : undefined,
    },
  ];
}

/** What the client pays for a quotation: the total fixed when they accepted it, else the quote's
 * total. The one place this is worked out. */
export function amountDue(quotation: Quotation) {
  return quotation.acceptedAmount ?? quotation.total;
}

/** Whether the client paid this quotation through ilovelawyer: PAID, for more than nothing. Not a
 * free first consultation, nor a request from before quotation payments (its quotation is ACCEPTED). */
export function paidThroughUs(quotation: Quotation | null | undefined): quotation is Quotation {
  return !!quotation && quotation.status === "PAID" && amountDue(quotation).amountMinor > 0;
}

/** Whether the lawyer's expiry for the quote has passed: it can't be accepted or paid any more. */
export function quoteExpired(quotation: Quotation): boolean {
  return new Date(quotation.expiresAt).getTime() <= Date.now();
}

/** What has happened, oldest first, from the times the API gives: each lawyer taking it up and
 * quoting (several lawyers), then the engagement. */
export function activityOf(request: LawyerRequest): { at: string; text: string }[] {
  const lawyer = request.lawyer?.name ?? "A lawyer";
  const events: { at: string; text: string }[] = [{ at: request.createdAt, text: "You sent your request" }];
  for (const offer of request.lawyers) {
    if (offer.joinedAt) events.push({ at: offer.joinedAt, text: `${offer.lawyer.name} took up your request` });
    if (offer.quote) events.push({ at: offer.quote.sentAt, text: `${offer.lawyer.name} sent a ${money(offer.quotation?.total ?? offer.quote.amount)} quote` });
  }
  if (request.quotation?.acceptedAt) events.push({ at: request.quotation.acceptedAt, text: `You accepted ${lawyer}'s quote` });
  if (request.engagedAt) {
    events.push({ at: request.engagedAt, text: paidThroughUs(request.quotation) ? `You paid ${lawyer}, who can now see your case` : `You started working with ${lawyer}, who can now see your case` });
  }
  if (request.closedAt) events.push({ at: request.closedAt, text: request.closedBy === "LAWYER" ? "Your lawyer ended the engagement" : "You ended the engagement" });
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/** What the lawyer can see, and from when. */
export const VISIBILITY = (engaged: boolean, since?: string | null) => [
  { text: "Anonymised summary of your overview", when: "From the start", yes: true },
  { text: "Names, only for a conflict check", when: "From the start", yes: true },
  { text: "Your case, documents and interview (read-only)", when: engaged ? (since ? `Since ${day(since)}` : "Now") : "Once you pay", yes: engaged },
];

/** Whether the client can still withdraw, and whether the "what the lawyer can see" card applies. */
export const canWithdrawIn = (phase: Phase) => ["sent", "finding", "reviewing", "quote"].includes(phase);
export const showsVisibilityIn = (phase: Phase) => !["closed", "expired"].includes(phase);
