import { describe, it, expect } from "vitest";
import { formatBytes, formatDay, formatEventDate, timeAgo } from "../format";

describe("formatBytes", () => {
  it("shows a small file in bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("shows kilobytes without decimals", () => {
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1536 + 300)).toBe("2 KB");
  });

  it("shows megabytes to one decimal below 10 MB, whole above", () => {
    expect(formatBytes(1.24 * 1024 ** 2)).toBe("1.2 MB");
    expect(formatBytes(24.6 * 1024 ** 2)).toBe("25 MB");
  });

  it("shows gigabytes", () => {
    expect(formatBytes(1.5 * 1024 ** 3)).toBe("1.5 GB");
  });
});

describe("formatDay", () => {
  it("shows the day, short month and year", () => {
    expect(formatDay("2026-10-23T09:30:00Z")).toBe("23 Oct 2026");
  });

  it("reads the date in UTC, so a late-evening upload keeps its day everywhere", () => {
    expect(formatDay("2026-10-23T23:59:00Z")).toBe("23 Oct 2026");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-29T12:00:00Z");

  it("says just now inside the first minute", () => {
    expect(timeAgo("2026-10-29T11:59:30Z", now)).toBe("just now");
  });

  it("counts minutes, hours and days, singular and plural", () => {
    expect(timeAgo("2026-10-29T11:59:00Z", now)).toBe("1 minute ago");
    expect(timeAgo("2026-10-29T11:15:00Z", now)).toBe("45 minutes ago");
    expect(timeAgo("2026-10-29T10:00:00Z", now)).toBe("2 hours ago");
    expect(timeAgo("2026-10-27T12:00:00Z", now)).toBe("2 days ago");
  });

  it("never reads as the future", () => {
    expect(timeAgo("2026-10-29T12:05:00Z", now)).toBe("just now");
  });
});

describe("formatEventDate", () => {
  it("keeps the precision it was given", () => {
    expect(formatEventDate("2026-03-06T00:00:00Z", "DAY")).toBe("6 Mar 2026");
    expect(formatEventDate("2026-03-01T00:00:00Z", "MONTH")).toBe("Mar 2026");
    expect(formatEventDate("2026-01-01T00:00:00Z", "YEAR")).toBe("2026");
  });
});
