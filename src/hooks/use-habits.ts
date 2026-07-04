import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type HabitKey = string;

export type Habit = {
  id: string;
  key: HabitKey;
  label: string;
  emoji: string;
  weeklyTarget: number;
  builtin?: boolean;
};

export type DailyEntry = {
  date: string;
  weightUnhappy: number;
  inactivity: number;
  unhealthy: number;
  habits: Record<HabitKey, boolean>;
  note?: string;
  mood?: number | null;
};

export const MOOD_LABELS = [
  "Very unpleasant",
  "Unpleasant",
  "Slightly unpleasant",
  "Neutral",
  "Slightly pleasant",
  "Pleasant",
  "Very pleasant",
];

export const DEFAULT_HABITS: Omit<Habit, "id">[] = [
  { key: "run", label: "Run", emoji: "🏃‍♀️", weeklyTarget: 3, builtin: true },
  { key: "yoga", label: "Yoga", emoji: "🧘‍♀️", weeklyTarget: 2, builtin: true },
  { key: "sleepEarly", label: "Sleep early", emoji: "🌙", weeklyTarget: 7, builtin: true },
  { key: "wakeEarly", label: "Wake up early", emoji: "🌅", weeklyTarget: 7, builtin: true },
  { key: "freeWeights", label: "Free weights", emoji: "🏋️‍♀️", weeklyTarget: 2, builtin: true },
];

const HABITS_MIGRATED_FLAG = "pf.habits.migrated.v1";
const ENTRIES_LEGACY_KEY = "pf.habits.entries.v2";
const HABITS_LEGACY_KEY = "pf.habits.list.v2";

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - dow);
  return date;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const blankEntry = (date: string): DailyEntry => ({
  date,
  weightUnhappy: 0,
  inactivity: 0,
  unhealthy: 0,
  habits: {},
  note: "",
  mood: null,
});

async function ensureSeedHabits(userId: string) {
  const { data } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (data && data.length > 0) return;
  await supabase.from("habits").insert(
    DEFAULT_HABITS.map((h) => ({
      user_id: userId,
      key: h.key,
      label: h.label,
      emoji: h.emoji,
      weekly_target: h.weeklyTarget,
      builtin: true,
    }))
  );
}

async function migrateHabitsLocalOnce(userId: string) {
  if (localStorage.getItem(HABITS_MIGRATED_FLAG)) return;
  try {
    const localHabits = JSON.parse(localStorage.getItem(HABITS_LEGACY_KEY) || "[]");
    const localEntries = JSON.parse(localStorage.getItem(ENTRIES_LEGACY_KEY) || "{}");

    // Map old habit keys → new habit ids (after seeding)
    if (Array.isArray(localHabits) && localHabits.length) {
      const customs = localHabits.filter((h: any) => !h.builtin);
      if (customs.length) {
        await supabase.from("habits").insert(
          customs.map((h: any) => ({
            user_id: userId,
            key: h.key,
            label: h.label,
            emoji: h.emoji ?? "✨",
            weekly_target: h.weeklyTarget ?? 3,
            builtin: false,
          }))
        );
      }
    }

    const { data: dbHabits } = await supabase
      .from("habits")
      .select("id, key")
      .eq("user_id", userId);
    const keyToId: Record<string, string> = {};
    for (const h of dbHabits ?? []) keyToId[h.key] = h.id;

    const entryRows: any[] = [];
    const logRows: any[] = [];
    for (const k of Object.keys(localEntries)) {
      const e = localEntries[k];
      entryRows.push({
        user_id: userId,
        entry_date: e.date,
        weight_unhappy: e.weightUnhappy ?? 0,
        inactivity: e.inactivity ?? 0,
        unhealthy: e.unhealthy ?? 0,
        mood: e.mood ?? null,
        note: e.note ?? "",
      });
      for (const habitKey of Object.keys(e.habits || {})) {
        if (!e.habits[habitKey]) continue;
        const habitId = keyToId[habitKey];
        if (!habitId) continue;
        logRows.push({
          user_id: userId,
          habit_id: habitId,
          log_date: e.date,
          done: true,
        });
      }
    }
    if (entryRows.length)
      await supabase.from("daily_entries").upsert(entryRows, {
        onConflict: "user_id,entry_date",
      });
    if (logRows.length)
      await supabase.from("habit_logs").upsert(logRows, {
        onConflict: "user_id,habit_id,log_date",
      });
  } catch (e) {
    console.warn("[habits] migration failed", e);
  }
  localStorage.setItem(HABITS_MIGRATED_FLAG, "1");
}

function useHabitsState() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});

  const today = todayKey();

  const reload = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setEntries({});
      return;
    }
    const [{ data: hs }, { data: ents }, { data: logs }] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("daily_entries").select("*").eq("user_id", user.id),
      supabase.from("habit_logs").select("*").eq("user_id", user.id).eq("done", true),
    ]);
    const habitList: Habit[] = (hs ?? []).map((h: any) => ({
      id: h.id,
      key: h.key,
      label: h.label,
      emoji: h.emoji,
      weeklyTarget: h.weekly_target,
      builtin: h.builtin,
    }));
    setHabits(habitList);

    const habitIdToKey: Record<string, string> = {};
    for (const h of habitList) habitIdToKey[h.id] = h.key;

    const entryMap: Record<string, DailyEntry> = {};
    for (const e of ents ?? []) {
      entryMap[e.entry_date] = {
        date: e.entry_date,
        weightUnhappy: e.weight_unhappy,
        inactivity: e.inactivity,
        unhealthy: e.unhealthy,
        mood: e.mood,
        note: e.note ?? "",
        habits: {},
      };
    }
    for (const log of logs ?? []) {
      const k = log.log_date;
      if (!entryMap[k]) entryMap[k] = blankEntry(k);
      const hkey = habitIdToKey[log.habit_id];
      if (hkey) entryMap[k].habits[hkey] = true;
    }
    setEntries(entryMap);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await ensureSeedHabits(user.id);
      await migrateHabitsLocalOnce(user.id);
      await reload();
    })();
  }, [user, reload]);

  const todayEntry = useMemo(
    () => entries[today] ?? blankEntry(today),
    [entries, today]
  );

  const upsertEntry = useCallback(
    async (patch: Partial<DailyEntry>) => {
      if (!user) return;
      const current = entries[today] ?? blankEntry(today);
      const next = { ...current, ...patch };
      setEntries((prev) => ({ ...prev, [today]: next }));
      await supabase.from("daily_entries").upsert(
        {
          user_id: user.id,
          entry_date: today,
          weight_unhappy: next.weightUnhappy,
          inactivity: next.inactivity,
          unhealthy: next.unhealthy,
          mood: next.mood ?? null,
          note: next.note ?? "",
        },
        { onConflict: "user_id,entry_date" }
      );
    },
    [user, entries, today]
  );

  const setFeeling = useCallback(
    (key: "weightUnhappy" | "inactivity" | "unhealthy", value: number) => {
      void upsertEntry({ [key]: value } as Partial<DailyEntry>);
    },
    [upsertEntry]
  );

  const setNote = useCallback(
    (note: string) => {
      void upsertEntry({ note });
    },
    [upsertEntry]
  );

  const setMood = useCallback(
    (mood: number | null) => {
      void upsertEntry({ mood });
    },
    [upsertEntry]
  );

  const toggleHabit = useCallback(
    async (key: HabitKey, date: string = today) => {
      if (!user) return;
      const habit = habits.find((h) => h.key === key);
      if (!habit) return;
      const current = entries[date] ?? blankEntry(date);
      const next = !current.habits[key];
      setEntries((prev) => {
        const e = prev[date] ?? blankEntry(date);
        return { ...prev, [date]: { ...e, habits: { ...e.habits, [key]: next } } };
      });
      if (next) {
        await supabase.from("habit_logs").upsert(
          {
            user_id: user.id,
            habit_id: habit.id,
            log_date: date,
            done: true,
          },
          { onConflict: "user_id,habit_id,log_date" }
        );
      } else {
        await supabase
          .from("habit_logs")
          .delete()
          .eq("user_id", user.id)
          .eq("habit_id", habit.id)
          .eq("log_date", date);
      }
    },
    [user, habits, entries, today]
  );

  const addHabit = useCallback(
    async (label: string, emoji = "✨", weeklyTarget = 3) => {
      if (!user) return;
      const trimmed = label.trim();
      if (!trimmed) return;
      const key = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const { data } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          key,
          label: trimmed,
          emoji,
          weekly_target: weeklyTarget,
          builtin: false,
        })
        .select("*")
        .single();
      if (data) {
        setHabits((prev) => [
          ...prev,
          {
            id: data.id,
            key: data.key,
            label: data.label,
            emoji: data.emoji,
            weeklyTarget: data.weekly_target,
            builtin: data.builtin,
          },
        ]);
      }
    },
    [user]
  );

  const removeHabit = useCallback(async (key: HabitKey) => {
    const habit = habits.find((h) => h.key === key);
    if (!habit) return;
    setHabits((prev) => prev.filter((h) => h.key !== key));
    await supabase.from("habits").delete().eq("id", habit.id);
  }, [habits]);

  const updateHabitTarget = useCallback(
    async (key: HabitKey, weeklyTarget: number) => {
      const wt = Math.max(1, Math.min(7, weeklyTarget));
      const habit = habits.find((h) => h.key === key);
      if (!habit) return;
      setHabits((prev) =>
        prev.map((h) => (h.key === key ? { ...h, weeklyTarget: wt } : h))
      );
      await supabase.from("habits").update({ weekly_target: wt }).eq("id", habit.id);
    },
    [habits]
  );

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
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const leadOffset = (first.getDay() + 6) % 7;
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

  const weekMoods = useMemo(() => {
    const start = startOfWeek(new Date());
    const out: Array<{ date: string; mood: number | null }> = [];
    for (let i = 0; i < 7; i++) {
      const k = todayKey(addDays(start, i));
      const e = entries[k];
      out.push({ date: k, mood: e?.mood ?? null });
    }
    return out;
  }, [entries]);

  return {
    hydrated: !!user,
    habits,
    todayEntry,
    setFeeling,
    toggleHabit,
    setNote,
    setMood,
    weekMoods,
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

type HabitsValue = ReturnType<typeof useHabitsState>;
const HabitsContext = createContext<HabitsValue | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const value = useHabitsState();
  return createElement(HabitsContext.Provider, { value }, children);
}

export function useHabits(): HabitsValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used within HabitsProvider");
  return ctx;
}
