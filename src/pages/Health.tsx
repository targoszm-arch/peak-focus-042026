import { useEffect, useMemo, useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useHabits, MOOD_LABELS } from "@/hooks/use-habits";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Activity,
  Heart,
  Zap,
  Footprints,
  Smile,
  Flame,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { toast } from "sonner";

type OuraDaily = {
  metric_date: string;
  readiness_score: number | null;
  sleep_score: number | null;
  activity_score: number | null;
  total_sleep_seconds: number | null;
  resting_heart_rate: number | null;
  hrv_avg: number | null;
  raw: any;
};

function fmtHours(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function trend(values: Array<number | null | undefined>): "up" | "down" | "flat" {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length < 4) return "flat";
  const half = Math.floor(nums.length / 2);
  const a = nums.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const b = nums.slice(half).reduce((s, v) => s + v, 0) / (nums.length - half);
  if (b - a > 1) return "up";
  if (a - b > 1) return "down";
  return "flat";
}

function Tile({
  icon,
  label,
  value,
  unit,
  series,
  color = "hsl(var(--primary))",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  series?: Array<{ d: string; v: number | null }>;
  color?: string;
}) {
  const data = (series ?? []).map((p) => ({ d: p.d, v: p.v ?? null }));
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {data.length > 1 && (
        <div className="mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <YAxis hide domain={["auto", "auto"]} />
              <Line
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function Health() {
  useSEO({
    title: "Health | Peak Focus",
    description: "Your sleep, recovery, activity, mood, and habits at a glance.",
    canonical: "/health",
  });

  const { user } = useAuth();
  const { todayEntry, currentStreak, weekMoods } = useHabits();
  const [daily, setDaily] = useState<OuraDaily[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString().slice(0, 10);

    const [conn, rows] = await Promise.all([
      supabase
        .from("oura_connections")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("oura_daily")
        .select(
          "metric_date, readiness_score, sleep_score, activity_score, total_sleep_seconds, resting_heart_rate, hrv_avg, raw"
        )
        .eq("user_id", user.id)
        .gte("metric_date", sinceISO)
        .order("metric_date", { ascending: true }),
    ]);

    setConnected(!!conn.data);
    setDaily((rows.data ?? []) as OuraDaily[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const today = daily[daily.length - 1];
  const sleepSeries = useMemo(
    () => daily.map((d) => ({ d: d.metric_date, v: d.sleep_score })),
    [daily]
  );
  const readinessSeries = useMemo(
    () => daily.map((d) => ({ d: d.metric_date, v: d.readiness_score })),
    [daily]
  );
  const activitySeries = useMemo(
    () => daily.map((d) => ({ d: d.metric_date, v: d.activity_score })),
    [daily]
  );
  const hrvSeries = useMemo(
    () => daily.map((d) => ({ d: d.metric_date, v: d.hrv_avg })),
    [daily]
  );
  const rhrSeries = useMemo(
    () => daily.map((d) => ({ d: d.metric_date, v: d.resting_heart_rate })),
    [daily]
  );
  const stepsSeries = useMemo(
    () =>
      daily.map((d) => ({
        d: d.metric_date,
        v:
          (d.raw?.daily_activity?.steps as number | undefined) ??
          (d.raw?.daily_activity?.contributors?.steps as number | undefined) ??
          null,
      })),
    [daily]
  );

  const todaySteps =
    (today?.raw?.daily_activity?.steps as number | undefined) ?? null;

  const moodSeries = useMemo(
    () => weekMoods.map((m) => ({ d: m.date, v: m.mood })),
    [weekMoods]
  );

  const syncNow = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("oura-sync", {
        method: "POST",
      });
      if (error) throw error;
      toast.success(`Synced ${(data as any)?.rows ?? 0} days`);
      await loadAll();
    } catch (e) {
      toast.error(`Sync failed: ${(e as Error).message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] p-4">
        <p className="mx-auto max-w-md text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Health</h1>
          <Button
            size="sm"
            variant="outline"
            onClick={syncNow}
            disabled={syncing || !connected}
            aria-label="Sync now"
          >
            <RefreshCw
              className={"mr-1.5 h-3.5 w-3.5 " + (syncing ? "animate-spin" : "")}
            />
            Sync now
          </Button>
        </header>

        {connected === false && (
          <div className="rounded-xl border border-dashed p-4 text-sm">
            <p className="mb-2 font-medium">Oura not connected</p>
            <p className="mb-3 text-muted-foreground">
              Connect Oura in Settings to see sleep, readiness, HRV, RHR and activity.
            </p>
            <Button asChild size="sm">
              <Link to="/settings">
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                Connect Oura
              </Link>
            </Button>
          </div>
        )}

        {connected && daily.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No data yet. Tap <span className="font-medium">Sync now</span> to pull
            the last 30 days.
          </div>
        )}

        <section
          className="grid grid-cols-2 gap-3"
          aria-label="Health metrics"
        >
          <Tile
            icon={<Moon className="h-3.5 w-3.5" />}
            label="Sleep score"
            value={today?.sleep_score?.toString() ?? "—"}
            unit="/100"
            series={sleepSeries}
            color="hsl(217 91% 60%)"
          />
          <Tile
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Readiness"
            value={today?.readiness_score?.toString() ?? "—"}
            unit="/100"
            series={readinessSeries}
            color="hsl(142 71% 45%)"
          />
          <Tile
            icon={<Heart className="h-3.5 w-3.5" />}
            label="HRV"
            value={today?.hrv_avg?.toString() ?? "—"}
            unit="ms"
            series={hrvSeries}
            color="hsl(0 84% 60%)"
          />
          <Tile
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Resting HR"
            value={today?.resting_heart_rate?.toString() ?? "—"}
            unit="bpm"
            series={rhrSeries}
            color="hsl(24 95% 53%)"
          />
          <Tile
            icon={<Footprints className="h-3.5 w-3.5" />}
            label="Steps"
            value={todaySteps != null ? todaySteps.toLocaleString() : "—"}
            series={stepsSeries}
            color="hsl(280 65% 60%)"
          />
          <Tile
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Activity"
            value={today?.activity_score?.toString() ?? "—"}
            unit="/100"
            series={activitySeries}
            color="hsl(173 58% 39%)"
          />
        </section>

        <section
          className="grid grid-cols-2 gap-3"
          aria-label="Wellbeing"
        >
          <Tile
            icon={<Smile className="h-3.5 w-3.5" />}
            label="Mood today"
            value={
              todayEntry.mood == null
                ? "—"
                : MOOD_LABELS[todayEntry.mood] ?? String(todayEntry.mood)
            }
            series={moodSeries}
            color="hsl(45 93% 47%)"
          />
          <Tile
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Habits streak"
            value={`${currentStreak}`}
            unit="days"
          />
        </section>

        <section className="rounded-xl border bg-card p-3 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Total sleep</span>
            <span className="font-medium text-foreground">
              {fmtHours(today?.total_sleep_seconds)}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-muted-foreground">
            <span>Sleep trend (30d)</span>
            <span className="font-medium text-foreground">
              {trend(sleepSeries.map((s) => s.v))}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-muted-foreground">
            <span>HRV trend (30d)</span>
            <span className="font-medium text-foreground">
              {trend(hrvSeries.map((s) => s.v))}
            </span>
          </div>
        </section>
      </article>
    </main>
  );
}
