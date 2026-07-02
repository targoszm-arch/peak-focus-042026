// Real-time date helpers for task due-dates. Ported from the DS prototype's
// PFDate, but relative to the actual "today" (the prototype used a fixed date).
// Dates are stored as ISO strings ("2026-07-02") or full ISO timestamps.

export type Bucket = "overdue" | "today" | "tomorrow" | "week" | "later";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parse(iso: string | null): Date | null {
  if (!iso) return null;
  // Accept "YYYY-MM-DD" or full ISO.
  const d = iso.length <= 10 ? new Date(iso + "T00:00:00") : new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function daysFromToday(iso: string | null): number {
  const d = parse(iso);
  if (!d) return Infinity;
  const a = startOfDay(new Date());
  const b = startOfDay(d);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function bucket(iso: string | null): Bucket {
  if (!iso) return "later";
  const d = daysFromToday(iso);
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d <= 7) return "week";
  return "later";
}

export function label(iso: string | null): string {
  if (!iso) return "Someday";
  const d = daysFromToday(iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d < 0) return `${-d}d overdue`;
  const dt = parse(iso);
  return dt
    ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Someday";
}

export const PFDate = { daysFromToday, bucket, label };
