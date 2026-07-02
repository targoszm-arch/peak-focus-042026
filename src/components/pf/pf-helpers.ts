import type { Priority } from "@/hooks/use-tasks";

export const PRIORITY_TOKEN: Record<Exclude<Priority, "none">, string> = {
  high: "--red-500",
  medium: "--primary-500",
  low: "--neutral-400",
};

export const PRIORITY_LABEL: Record<Exclude<Priority, "none">, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Map the design's due presets onto real dates.
export function dueFromPreset(k: "today" | "tomorrow" | "week" | "none"): string | null {
  if (k === "today") return isoOffset(0);
  if (k === "tomorrow") return isoOffset(1);
  if (k === "week") return isoOffset(7);
  return null;
}

export const DUE_PRESETS: [key: "today" | "tomorrow" | "week" | "none", label: string][] = [
  ["today", "Today"],
  ["tomorrow", "Tomorrow"],
  ["week", "This week"],
  ["none", "Someday"],
];
