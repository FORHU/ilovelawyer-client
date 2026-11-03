/** A deadline within this many days is flagged as urgent — a nudge to get it in front of a
 * lawyer, never a legal calculation of its own (ADR 0018: the API never computes a deadline;
 * this only decides how to *show* one the client or a document already stated). */
export const URGENT_WITHIN_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from today (UTC) to an ISO date; negative once it has passed. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const today = new Date(now.toISOString().slice(0, 10));
  const at = new Date(iso);
  return Math.round((at.getTime() - today.getTime()) / DAY_MS);
}

/** How a stated date should read: passed, urgent (coming up soon), or neither. */
export function deadlineStatus(date: string | null, now: Date = new Date()) {
  const days = date ? daysUntil(date, now) : null;
  return {
    days,
    passed: days !== null && days < 0,
    urgent: days !== null && days >= 0 && days <= URGENT_WITHIN_DAYS,
  };
}

/** The urgent dates first, soonest first; everything else after them in the order given. */
export function urgentFirst<T extends { date: string | null }>(items: T[], now: Date = new Date()): T[] {
  const urgent = items
    .map((item) => ({ item, ...deadlineStatus(item.date, now) }))
    .filter((x) => x.urgent)
    .sort((a, b) => a.days! - b.days!)
    .map((x) => x.item);
  return [...urgent, ...items.filter((item) => !urgent.includes(item))];
}
