import { useCallback, useEffect, useMemo, useState } from "react";

export type HabitKey = string;

export type Habit = {
  key: HabitKey;
  label: string;
  emoji: string;
  weeklyTarget: number; // 1..7
  builtin?: boolean;
};

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  weightUnhappy: number; // 0-5
  inactivity: number; // 0-5
  unhealthy: number; // 0-5
  habits: Record<HabitKey, boolean>;
  note?: string;
};

const ENTRIES_KEY = "pf.habits.entries.v2";
const HABITS_KEY = "pf.habits.list.v2";

export const DEFAULT_HABITS: Habit[] = [
  { key: "run", label: "Run", emoji: "🏃‍♀️", weeklyTarget: 3, builtin: true },
  { key: "yoga", label: "Yoga", emoji: "🧘‍♀️", weeklyTarget: 2, builtin: true },
  { key: "sleepEarly", label: "Sleep early", emoji: "🌙", weeklyTarget: 7, builtin: true },
  { key: "wakeEarly", label: "Wake up early", emoji: "🌅", weeklyTarget: 7, builtin: true },
  { key: "freeWeights", label: "Free weights", emoji: "🏋️‍♀️", weeklyTarget: 2, builtin: true },
];

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7; // Monday-first
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - dow);
  return date;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
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
  note: "",
});

export function useHabits() {
  const [hydrated, setHydrated] = useState(false);
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);

  // hydrate once
  useEffect(() => {
    setEntries(readJSON<Record<string, DailyEntry>>(ENTRIES_KEY, {}));
    const stored = readJSON<Habit[]>(HABITS_KEY, DEFAULT_HABITS);
    setHabits(Array.isArray(stored) && stored.length ? stored : DEFAULT_HABITS);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJSON(ENTRIES_KEY, entries);
  }, [entries, hydrated]);

  useEffect(() => {
    if (hydrated) writeJSON(HABITS_KEY, habits);
  }, [habits, hydrated]);

  const today = todayKey();
  const todayEntry = useMemo(
    () => entries[today] ?? blankEntry(today),
    [entries, today]
  );

  const setFeeling = useCallback(
    (key: "weightUnhappy" | "inactivity" | "unhealthy", value: number) => {
      setEntries((prev) => {
        const current = prev[today] ?? blankEntry(today);
        if (current[key] === value) return prev;
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
        if (current.note === note) return prev;
        return { ...prev, [today]: { ...current, note } };
      });
    },
    [today]
  );

  const addHabit = useCallback((label: string, emoji = "✨", weeklyTarget = 3) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setHabits((prev) => [...prev, { key, label: trimmed, emoji, weeklyTarget }]);
  }, []);

  const removeHabit = useCallback((key: HabitKey) => {
    setHabits((prev) => prev.filter((h) => h.key !== key));
  }, []);

  const updateHabitTarget = useCallback((key: HabitKey, weeklyTarget: number) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.key === key
          ? { ...h, weeklyTarget: Math.max(1, Math.min(7, weeklyTarget)) }
          : h
      )
    );
  }, []);

  const weeklyCounts = useMemo(() => {
    const start = startOfWeek(new Date());
    const counts: Record<HabitKey, number> = {};
    for (const h of habits) counts[h.key] = 0;
    for (let i = 0; i < 7; i++) {
      const e = entries[todayKey(addDays(start, i))];
      if (!e) continue;
      for (const h of habits) if (e.habits[h.key]) counts[h.key] += 1;
    }
    return counts;
  }, [entries, habits]);

  const last7Days = useMemo(() => {
    const days: DailyEntry[] = [];
    for (let i = 6; i >= 0; i--) {
      const k = todayKey(addDays(new Date(), -i));
      days.push(entries[k] ?? blankEntry(k));
    }
    return days;
  }, [entries]);

  const monthMatrix = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const leadOffset = (first.getDay() + 6) % 7; // Mon-first
    const cells: Array<{ date: string | null; entry?: DailyEntry; isToday?: boolean }> = [];
    for (let i = 0; i < leadOffset; i++) cells.push({ date: null });
    const todayStr = todayKey();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(now.getFullYear(), now.getMonth(), d);
      const k = todayKey(dt);
      cells.push({ date: k, entry: entries[k], isToday: k === todayStr });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [entries]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthEntries = Object.values(entries).filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const habitTotals: Record<HabitKey, number> = {};
    for (const h of habits) habitTotals[h.key] = 0;
    let weightSum = 0,
      inactivitySum = 0,
      unhealthySum = 0,
      feelingDays = 0,
      checkedDays = 0;
    for (const e of monthEntries) {
      let any = false;
      for (const h of habits) {
        if (e.habits[h.key]) {
          habitTotals[h.key] += 1;
          any = true;
        }
      }
      if (any) checkedDays += 1;
      if (e.weightUnhappy || e.inactivity || e.unhealthy) {
        feelingDays += 1;
        weightSum += e.weightUnhappy;
        inactivitySum += e.inactivity;
        unhealthySum += e.unhealthy;
      }
    }
    return {
      habitTotals,
      activeDays: checkedDays,
      avgWeight: feelingDays ? weightSum / feelingDays : 0,
      avgInactivity: feelingDays ? inactivitySum / feelingDays : 0,
      avgUnhealthy: feelingDays ? unhealthySum / feelingDays : 0,
      monthLabel: now.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
    };
  }, [entries, habits]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const k = todayKey(addDays(new Date(), -i));
      const e = entries[k];
      if (!e) break;
      const any = habits.some((h) => e.habits[h.key]);
      if (!any) break;
      streak += 1;
    }
    return streak;
  }, [entries, habits]);

  return {
    hydrated,
    habits,
    todayEntry,
    setFeeling,
    toggleHabit,
    setNote,
    addHabit,
    removeHabit,
    updateHabitTarget,
    weeklyCounts,
    last7Days,
    monthMatrix,
    monthlyStats,
    currentStreak,
  };
}
