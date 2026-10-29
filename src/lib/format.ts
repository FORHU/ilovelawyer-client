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

/** "23 Oct 2026". Read in UTC, as the Overview's dates are, so a day never shifts with the viewer's zone. */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** "just now", "5 minutes ago", "2 hours ago", "3 days ago" — how long ago something happened. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (minutes < 60) return plural(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");
  return plural(Math.floor(hours / 24), "day");
}

/** A timeline date only as precisely as it was given: "6 Mar 2026", "Mar 2026" or "2026". A month
 * the client mentioned stays a month, never a made-up day. */
export function formatEventDate(iso: string, precision: "DAY" | "MONTH" | "YEAR" | "UNKNOWN"): string {
  const opts: Intl.DateTimeFormatOptions =
    precision === "YEAR" ? { year: "numeric" } : precision === "MONTH" ? { month: "short", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" };
  return new Date(iso).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}
