import { firstName, formatDateTime } from "@/lib/format";
import { money } from "@/lib/pricing";
import type { LawyerRequest, Quotation } from "./api";
import { currentLang, currentLocale, tr } from "@/lib/i18n/translate";

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

// Dates in the page's language (lib/i18n/translate.ts): "6 Nov" or "11월 6일".
const shortMonth = () => (currentLang() === "ko" ? "long" : "short");

export const day = (iso: string) => new Date(iso).toLocaleDateString(currentLocale(), { day: "numeric", month: shortMonth() });

/** "Friday 6 November", "11월 6일 금요일". */
export function pickByDay(iso: string) {
  return new Date(iso).toLocaleDateString(currentLocale(), { weekday: "long", day: "numeric", month: "long" });
}

/** "9:00 am on Friday 6 November" ("11월 6일 금요일 오전 9:00"): the request closes at that moment,
 * not at the end of the day. */
export function pickByTime(iso: string) {
  const at = new Date(iso);
  const time = at.toLocaleTimeString(currentLocale(), { hour: "numeric", minute: "2-digit", hour12: true });
  return tr("{time} on {date}", { time, date: at.toLocaleDateString(currentLocale(), { weekday: "long", day: "numeric", month: "long" }) });
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
    { label: tr("Request sent"), sub: tr("Anonymised summary of your overview"), time: formatDateTime(request.createdAt), expect: tr("Takes about a minute") },
    {
      label: phase === "expired" ? tr("No lawyer picked it up") : tr("Finding a lawyer"),
      sub: tr("Sent to matching lawyers"),
      expect: phase === "expired" ? tr("Ended after 48 hours, or 7 days without a choice") : tr("Most are picked up within a day"),
    },
    { label: on > 1 ? tr("{n} lawyers are reviewing", { n: on }) : tr("A lawyer is reviewing"), sub: tr("Conflict check, then a quote") },
    {
      label: quoted > 1 ? tr("Compare the quotes") : tr("Review the quote"),
      sub: request.paysLawyerDirectly ? tr("Accept one and pay the lawyer directly, or decline") : tr("Accept one and pay through ilovelawyer, or decline"),
    },
    {
      label:
        phase === "finalising"
          ? request.awaitingPayment
            ? first
              ? tr("Pay {name}'s quote", { name: first })
              : tr("Pay the quote")
            : first
              ? tr("Finalising with {name}", { name: first })
              : tr("Finalising")
          : tr("Working with your lawyer"),
      sub: tr("Messages, and read-only access to your case"),
      time: request.engagedAt ? (request.closedAt ? `${day(request.engagedAt)} – ${day(request.closedAt)}` : formatDateTime(request.engagedAt)) : undefined,
      expect:
        phase === "finalising"
          ? request.awaitingPayment && request.quotation
            ? tr("Pay by {date}", { date: pickByDay(request.quotation.expiresAt) })
            : tr("Usually takes a few minutes")
          : request.engagedAt
            ? tr("Started {date}", { date: day(request.engagedAt) })
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
 * free first consultation, nor a request from before quotation payments (its quotation is ACCEPTED),
 * nor one on a site where the client pays the lawyer directly (`paysLawyerDirectly`, KR): that
 * quotation reads PAID too, but nothing went through ilovelawyer. */
export function paidThroughUs(quotation: Quotation | null | undefined, paysLawyerDirectly = false): quotation is Quotation {
  return !paysLawyerDirectly && !!quotation && quotation.status === "PAID" && amountDue(quotation).amountMinor > 0;
}

/** Whether the lawyer's expiry for the quote has passed: it can't be accepted or paid any more. */
export function quoteExpired(quotation: Quotation): boolean {
  return new Date(quotation.expiresAt).getTime() <= Date.now();
}

/** What has happened, oldest first, from the times the API gives: each lawyer taking it up and
 * quoting (several lawyers), then the engagement. */
export function activityOf(request: LawyerRequest): { at: string; text: string }[] {
  const lawyer = request.lawyer?.name ?? tr("A lawyer");
  const events: { at: string; text: string }[] = [{ at: request.createdAt, text: tr("You sent your request") }];
  for (const offer of request.lawyers) {
    if (offer.joinedAt) events.push({ at: offer.joinedAt, text: tr("{name} took up your request", { name: offer.lawyer.name }) });
    if (offer.quote) events.push({ at: offer.quote.sentAt, text: tr("{name} sent a {amount} quote", { name: offer.lawyer.name, amount: money(offer.quotation?.total ?? offer.quote.amount) }) });
  }
  if (request.quotation?.acceptedAt) events.push({ at: request.quotation.acceptedAt, text: tr("You accepted {name}'s quote", { name: lawyer }) });
  if (request.engagedAt) {
    events.push({
      at: request.engagedAt,
      text: paidThroughUs(request.quotation, request.paysLawyerDirectly) ? tr("You paid {name}, who can now see your case", { name: lawyer }) : tr("You started working with {name}, who can now see your case", { name: lawyer }),
    });
  }
  if (request.closedAt) events.push({ at: request.closedAt, text: request.closedBy === "LAWYER" ? tr("Your lawyer ended the engagement") : tr("You ended the engagement") });
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/** What the lawyer can see, and from when. `paysLawyerDirectly`: hiring, not paying, opens the case. */
export const VISIBILITY = (engaged: boolean, since?: string | null, paysLawyerDirectly = false) => [
  { text: tr("Anonymised summary of your overview"), when: tr("From the start"), yes: true },
  { text: tr("Names, only for a conflict check"), when: tr("From the start"), yes: true },
  { text: tr("Your case, documents and interview (read-only)"), when: engaged ? (since ? tr("Since {date}", { date: day(since) }) : tr("Now")) : paysLawyerDirectly ? tr("Once you hire them") : tr("Once you pay"), yes: engaged },
];

/** Whether the client can still withdraw, and whether the "what the lawyer can see" card applies. */
export const canWithdrawIn = (phase: Phase) => ["sent", "finding", "reviewing", "quote"].includes(phase);
export const showsVisibilityIn = (phase: Phase) => !["closed", "expired"].includes(phase);
