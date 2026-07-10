import { useCallback, useEffect, useMemo, useState } from "react";
import { createContext, createElement, useContext, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type TimeEntry = {
  id: string;
  taskId: string | null;
  projectId: string | null;
  description: string;
  startedAt: number;
  endedAt: number | null;
  createdAt: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToEntry(r: any): TimeEntry {
  return {
    id: r.id,
    taskId: r.task_id ?? null,
    projectId: r.project_id ?? null,
    description: r.description ?? "",
    startedAt: new Date(r.started_at).getTime(),
    endedAt: r.ended_at ? new Date(r.ended_at).getTime() : null,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - dow);
  return x;
}

function useTimeState() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("started_at", since.toISOString())
      .order("started_at", { ascending: false });
    if (error) console.warn("[time]", error.message);
    setEntries((data ?? []).map(rowToEntry));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const running = useMemo(() => entries.find((e) => e.endedAt === null) ?? null, [entries]);

  // tick every second while a timer runs — seed immediately so a `now` that
  // went stale while paused doesn't briefly overshoot the elapsed time on resume.
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const start = useCallback(
    async (opts: { description?: string; taskId?: string | null; projectId?: string | null }) => {
      if (!user) return;
      // stop any running timer first (DB unique index enforces one)
      if (running) {
        await supabase.from("time_entries").update({ ended_at: new Date().toISOString() }).eq("id", running.id);
      }
      const { data } = await supabase
        .from("time_entries")
        .insert({
          user_id: user.id,
          description: opts.description ?? "",
          task_id: opts.taskId ?? null,
          project_id: opts.projectId ?? null,
        })
        .select("*")
        .single();
      await reload();
      return data ? rowToEntry(data) : null;
    },
    [user, running, reload]
  );

  const stop = useCallback(async () => {
    if (!running) return;
    await supabase.from("time_entries").update({ ended_at: new Date().toISOString() }).eq("id", running.id);
    await reload();
  }, [running, reload]);

  const durationOf = useCallback(
    (e: TimeEntry) => (e.endedAt ?? now) - e.startedAt,
    [now]
  );

  const stats = useMemo(() => {
    const weekStart = startOfWeek(new Date()).getTime();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const prevWeekStart = weekStart - 7 * 86400000;

    const ms = (e: TimeEntry) => (e.endedAt ?? now) - e.startedAt;
    let week = 0,
      today = 0,
      prevWeek = 0;
    const perDay = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun

    for (const e of entries) {
      const d = ms(e);
      if (e.startedAt >= weekStart) {
        week += d;
        const idx = (new Date(e.startedAt).getDay() + 6) % 7;
        perDay[idx] += d;
      } else if (e.startedAt >= prevWeekStart) {
        prevWeek += d;
      }
      if (e.startedAt >= dayStart.getTime()) today += d;
    }
    return { week, today, prevWeek, perDay };
  }, [entries, now]);

  return { entries, running, loading, start, stop, durationOf, stats, now, reload };
}

type TimeValue = ReturnType<typeof useTimeState>;
const TimeContext = createContext<TimeValue | null>(null);

export function TimeProvider({ children }: { children: ReactNode }) {
  const value = useTimeState();
  return createElement(TimeContext.Provider, { value }, children);
}

export function useTime(): TimeValue {
  const ctx = useContext(TimeContext);
  if (!ctx) throw new Error("useTime must be used within TimeProvider");
  return ctx;
}

export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
