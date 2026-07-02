import { useCallback, useEffect, useMemo, useState } from "react";
import { createContext, createElement, useContext, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type OuraDay = {
  date: string;
  readiness: number | null;
  sleepScore: number | null;
  activity: number | null;
  totalSleepSeconds: number | null;
  restingHr: number | null;
  hrvAvg: number | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToDay(r: any): OuraDay {
  return {
    date: r.metric_date,
    readiness: r.readiness_score ?? null,
    sleepScore: r.sleep_score ?? null,
    activity: r.activity_score ?? null,
    totalSleepSeconds: r.total_sleep_seconds ?? null,
    restingHr: r.resting_heart_rate ?? null,
    hrvAvg: r.hrv_avg ?? null,
  };
}

function useHealthState() {
  const { user } = useAuth();
  const [days, setDays] = useState<OuraDay[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setDays([]);
      setLoading(false);
      return;
    }
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [{ data: metrics }, { data: conn }] = await Promise.all([
      supabase
        .from("oura_daily")
        .select("*")
        .eq("user_id", user.id)
        .gte("metric_date", since.toISOString().slice(0, 10))
        .order("metric_date", { ascending: true }),
      supabase.from("oura_connections").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]);
    setDays((metrics ?? []).map(rowToDay));
    setConnected(!!conn);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const latest = days.length ? days[days.length - 1] : null;

  const spark = useCallback(
    (key: keyof OuraDay) =>
      days
        .map((d) => d[key])
        .filter((v): v is number => typeof v === "number"),
    [days]
  );

  const summary = useMemo(() => {
    const nums = (key: keyof OuraDay) =>
      days.map((d) => d[key]).filter((v): v is number => typeof v === "number");
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    return {
      avgSleep: avg(nums("sleepScore")),
      avgReadiness: avg(nums("readiness")),
      avgRestingHr: avg(nums("restingHr")),
    };
  }, [days]);

  return { days, latest, connected, loading, spark, summary, reload };
}

type HealthValue = ReturnType<typeof useHealthState>;
const HealthContext = createContext<HealthValue | null>(null);

export function HealthProvider({ children }: { children: ReactNode }) {
  const value = useHealthState();
  return createElement(HealthContext.Provider, { value }, children);
}

export function useHealth(): HealthValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used within HealthProvider");
  return ctx;
}
