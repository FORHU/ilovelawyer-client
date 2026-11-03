import { describe, it, expect } from "vitest";
import { daysUntil, deadlineStatus, urgentFirst, URGENT_WITHIN_DAYS } from "../overview-urgency";

const NOW = new Date("2026-11-03T15:30:00Z");

describe("daysUntil", () => {
  it("counts whole days from today, whatever the time of day", () => {
    expect(daysUntil("2026-11-03", NOW)).toBe(0);
    expect(daysUntil("2026-11-04", NOW)).toBe(1);
    expect(daysUntil("2026-11-17", NOW)).toBe(14);
  });

  it("goes negative once the date has passed", () => {
    expect(daysUntil("2026-11-02", NOW)).toBe(-1);
  });
});

describe("deadlineStatus", () => {
  it("flags a date within the window as urgent, including today and the last day", () => {
    expect(deadlineStatus("2026-11-03", NOW).urgent).toBe(true);
    expect(deadlineStatus(`2026-11-${3 + URGENT_WITHIN_DAYS}`, NOW).urgent).toBe(true);
    expect(deadlineStatus("2026-11-18", NOW).urgent).toBe(false);
  });

  it("marks a past date as passed, never urgent", () => {
    expect(deadlineStatus("2026-10-30", NOW)).toMatchObject({ passed: true, urgent: false });
  });

  it("says nothing about a deadline with no date", () => {
    expect(deadlineStatus(null, NOW)).toEqual({ days: null, passed: false, urgent: false });
  });
});

describe("urgentFirst", () => {
  it("puts urgent dates first, soonest first, and keeps the rest in the order given", () => {
    const items = [
      { id: "far", date: "2027-02-01" },
      { id: "none", date: null },
      { id: "later", date: "2026-11-15" },
      { id: "passed", date: "2026-10-01" },
      { id: "soon", date: "2026-11-05" },
    ];
    expect(urgentFirst(items, NOW).map((i) => i.id)).toEqual(["soon", "later", "far", "none", "passed"]);
  });
});
