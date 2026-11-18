import { currentLang, currentLocale, tr } from "@/lib/i18n/translate";

// Dates follow the page's language and site (lib/i18n/translate.ts: en-GB on the UK site, en-PH on
// PH, ko-KR in Korean). Korean writes the month as a word with its day, "2026년 11월 12일", so it
// takes month "long" where English takes "short" ("12 Nov 2026").
const month = (): "long" | "short" => (currentLang() === "ko" ? "long" : "short");

/** "512 B", "2 KB", "1.2 MB", "25 MB", "1.5 GB": one decimal only where it still says something. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const shown = unit === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${shown} ${units[unit]}`;
}

/** "23 Oct 2026" ("2026년 10월 23일"). Read in UTC, as the Overview's dates are, so a day never shifts with the viewer's zone. */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(currentLocale(), { day: "numeric", month: month(), year: "numeric", timeZone: "UTC" });
}

/** "23 Oct 2026" ("2026년 10월 23일") in the viewer's own time zone: when something happened on this device's calendar. */
export function formatDayLocal(iso: string): string {
  return new Intl.DateTimeFormat(currentLocale(), { day: "numeric", month: month(), year: "numeric" }).format(new Date(iso));
}

/** "just now", "5 minutes ago", "2 hours ago", "3 days ago" — how long ago something happened. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return tr("just now");
  if (minutes < 60) return minutes === 1 ? tr("{n} minute ago", { n: 1 }) : tr("{n} minutes ago", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? tr("{n} hour ago", { n: 1 }) : tr("{n} hours ago", { n: hours });
  const days = Math.floor(hours / 24);
  return days === 1 ? tr("{n} day ago", { n: 1 }) : tr("{n} days ago", { n: days });
}

/** A timeline date only as precisely as it was given: "6 Mar 2026", "Mar 2026" or "2026". A month
 * the client mentioned stays a month, never a made-up day; a date of unknown precision is not shown
 * as a day at all. */
export function formatEventDate(iso: string, precision: "DAY" | "MONTH" | "YEAR" | "UNKNOWN"): string {
  if (precision === "UNKNOWN") return tr("Date unknown");
  const opts: Intl.DateTimeFormatOptions =
    precision === "YEAR" ? { year: "numeric" } : precision === "MONTH" ? { month: month(), year: "numeric" } : { day: "numeric", month: month(), year: "numeric" };
  return new Date(iso).toLocaleDateString(currentLocale(), { ...opts, timeZone: "UTC" });
}

/** "29 Oct, 10:42" ("10월 29일 오전 10:42") — a moment in the viewer's own time zone. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(currentLocale(), { day: "numeric", month: month(), hour: "numeric", minute: "2-digit" });
}

/** "Priya" from "Priya Natarajan", or null when there's no name to take it from. */
export function firstName(name: string | null | undefined): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}
