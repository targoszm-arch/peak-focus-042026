import { useCallback, useEffect, useMemo, useState } from "react";

export type HabitKey =
  | "run"
  | "yoga"
  | "sleepEarly"
  | "wakeEarly"
  | "freeWeights";

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  weightUnhappy: number; // 1-5
  inactivity: number; // 1-5
  unhealthy: number; // 1-5
  habits: Partial<Record<HabitKey, boolean>>;
  note?: string;
};

export const HABIT_LABELS: Record<HabitKey, string> = {
  run: "Run",
  yoga: "Yoga",
  sleepEarly: "Sleep early",
  wakeEarly: "Wake up early",
  freeWeights: "Free weights",
};

export const HABIT_KEYS: HabitKey[] = [
  "run",
  "yoga",
  "sleepEarly",
  "wakeEarly",
  "freeWeights",
];

const STORAGE_KEY = "pf.habits.v1";

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function readEntries(): Record<string, DailyEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (data && typeof data === "object") return data as Record<string, DailyEntry>;
  } catch {
    // ignore
  }
  return {};
}

function writeEntries(entries: Record<string, DailyEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

const blankEntry = (date: string): DailyEntry => ({
  date,
  weightUnhappy: 0,
  inactivity: 0,
  unhealthy: 0,
  habits: {},
});

export function useHabits() {
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const today = todayKey();

  useEffect(() => {
    setEntries(readEntries());
  }, []);

  useEffect(() => {
    writeEntries(entries);
  }, [entries]);

  const todayEntry = entries[today] ?? blankEntry(today);

  const setFeeling = useCallback(
    (key: "weightUnhappy" | "inactivity" | "unhealthy", value: number) => {
      setEntries((prev) => {
        const current = prev[today] ?? blankEntry(today);
        return { ...prev, [today]: { ...current, [key]: value } };
      });
    },
    [today]
  );

  const toggleHabit = useCallback(
    (key: HabitKey) => {
      setEntries((prev) => {
        const current = prev[today] ?? blankEntry(today);
        const next = { ...current.habits, [key]: !current.habits[key] };
        return { ...prev, [today]: { ...current, habits: next } };
      });
    },
    [today]
  );

  const setNote = useCallback(
    (note: string) => {
      setEntries((prev) => {
        const current = prev[today] ?? blankEntry(today);
        return { ...prev, [today]: { ...current, note } };
      });
    },
    [today]
  );

  const weeklyCounts = useMemo(() => {
    const start = startOfWeek(new Date());
    const counts: Record<HabitKey, number> = {
      run: 0,
      yoga: 0,
      sleepEarly: 0,
      wakeEarly: 0,
      freeWeights: 0,
    };
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const e = entries[todayKey(d)];
      if (!e) continue;
      for (const k of HABIT_KEYS) {
        if (e.habits[k]) counts[k] += 1;
      }
    }
    return counts;
  }, [entries]);

  const last7Days = useMemo(() => {
    const days: DailyEntry[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      days.push(entries[k] ?? blankEntry(k));
    }
    return days;
  }, [entries]);

  return {
    todayEntry,
    setFeeling,
    toggleHabit,
    setNote,
    weeklyCounts,
    last7Days,
  };
}
