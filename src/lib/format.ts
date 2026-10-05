// Date / seat formatting helpers. The API returns ISO date strings; these turn
// them into the human-friendly labels the UI uses.

const pad = (n: number) => String(n).padStart(2, "0");

export function parseDate(iso: string | Date): Date {
  return iso instanceof Date ? iso : new Date(iso);
}

export function formatDate(iso: string | Date): string {
  return parseDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLongDate(iso: string | Date): string {
  return parseDate(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekday(iso: string | Date): string {
  return parseDate(iso).toLocaleDateString("en-US", { weekday: "short" });
}

export function formatTime(iso: string | Date): string {
  return parseDate(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, " ");
}

/** "9:00 AM – 1:00 PM" (same day) or "Mar 15, 9:00 AM – Mar 17, 6:00 PM". */
export function formatTimeRange(
  startIso: string | Date,
  endIso: string | Date,
): string {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return `${formatTime(start)} – ${formatTime(end)}`;
  return `${formatDate(start)}, ${formatTime(start)} – ${formatDate(end)}, ${formatTime(end)}`;
}

/** "Mar 15, 2026" or "Mar 15 – 17, 2026" across multiple days. */
export function formatDateRange(
  startIso: string | Date,
  endIso: string | Date,
): string {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  if (start.toDateString() === end.toDateString()) return formatDate(start);
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const month = start.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function monthShort(iso: string | Date): string {
  return parseDate(iso)
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
}

export function dayOfMonth(iso: string | Date): number {
  return parseDate(iso).getDate();
}

export function monthYear(iso: string | Date): string {
  return parseDate(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

const DAY = 86_400_000;

/** "Today", "Tomorrow", "in 3 days", "3 days ago". */
export function relativeDay(iso: string | Date): string {
  const target = parseDate(iso);
  const now = new Date();
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((a.getTime() - b.getTime()) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function remainingDays(iso: string | Date): number {
  return Math.max(0, Math.ceil((parseDate(iso).getTime() - Date.now()) / DAY));
}

export function isPast(iso: string | Date): boolean {
  return parseDate(iso).getTime() < Date.now();
}

export function isUpcoming(iso: string | Date): boolean {
  return parseDate(iso).getTime() >= Date.now();
}

/** "12 left", "Sold out", "Last seat!". */
export function seatsLabel(remaining: number): string {
  if (remaining <= 0) return "Sold out";
  if (remaining === 1) return "1 seat left";
  return `${remaining} seats left`;
}

/** Value for a native <input type="datetime-local">. */
export function toDatetimeLocal(iso: string | Date): string {
  const d = parseDate(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** Turn a datetime-local value back into an ISO string for the API. */
export function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function pct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/** "Just now", "5 min ago", "3 hrs ago", "2 days ago", else an absolute date. */
export function relativeFromNow(iso: string | Date): string {
  const diff = Date.now() - parseDate(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr${hr > 1 ? "s" : ""} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return formatDate(iso);
}
