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
  Footprints,
  Smile,
  Flame,
  RefreshCw,
  Link as LinkIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

function pctChange(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length < 4) return null;
  const half = Math.floor(nums.length / 2);
  const a = nums.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const b = nums.slice(half).reduce((s, v) => s + v, 0) / (nums.length - half);
  if (a === 0) return null;
  return ((b - a) / a) * 100;
}

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

function HeroTile({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span style={{ color }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-center">
        <span className="text-4xl font-semibold tracking-tight">{value}</span>
      </div>
      {unit && (
        <p className="mt-1 text-center text-xs text-muted-foreground">{unit}</p>
      )}
    </div>
  );
}

function SmallTile({
  label,
  value,
  unit,
  status,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  status?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneBg = {
    neutral: "bg-card",
    good: "bg-emerald-500/10",
    warn: "bg-amber-500/10",
    bad: "bg-rose-500/10",
  }[tone];
  const toneText = {
    neutral: "text-muted-foreground",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-rose-600",
  }[tone];
  return (
    <div className={"rounded-xl border p-3 " + toneBg}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {unit && <p className="text-[11px] text-muted-foreground">{unit}</p>}
      {status && <p className={"mt-1 text-xs font-medium " + toneText}>{status}</p>}
    </div>
  );
}

export default function Health() {
  useSEO({
    title: "Health | Peak Focus",
    description: "Sleep, recovery, vitals, and movement at a glance.",
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

  const stepsByDay = useMemo(
    () =>
      daily.map((d) => ({
        date: d.metric_date,
        label: new Date(d.metric_date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        steps:
          (d.raw?.daily_activity?.steps as number | undefined) ??
          (d.raw?.daily_activity?.contributors?.steps as number | undefined) ??
          null,
      })),
    [daily]
  );

  const last7Steps = stepsByDay.slice(-7);
  const stepsValues = stepsByDay.map((p) => p.steps);
  const stepsAvg = avg(stepsValues);
  const stepsMin = Math.min(
    ...stepsValues.filter((v): v is number => typeof v === "number")
  );
  const stepsMax = Math.max(
    ...stepsValues.filter((v): v is number => typeof v === "number")
  );
  const stepsChange = pctChange(stepsValues);

  const todaySteps = stepsByDay[stepsByDay.length - 1]?.steps ?? null;

  const breathingRate =
    (today?.raw?.sleep?.average_breath as number | undefined) ??
    (today?.raw?.daily_readiness?.contributors?.respiratory_rate as
      | number
      | undefined) ??
    null;

  const sleepScores = daily.map((d) => d.sleep_score);
  const sleepChange = pctChange(sleepScores);
  const hrvValues = daily.map((d) => d.hrv_avg);
  const hrvChange = pctChange(hrvValues);
  const rhrValues = daily.map((d) => d.resting_heart_rate);
  const rhrChange = pctChange(rhrValues);

  const sleepHoursToday = today?.total_sleep_seconds
    ? today.total_sleep_seconds / 3600
    : null;

  // Mood as 0-6 -> map to display
  const moodToday = todayEntry.mood;

  // Goal: 10,000 steps
  const stepsGoal = 10000;
  const stepsPct =
    todaySteps != null ? Math.min(100, Math.round((todaySteps / stepsGoal) * 100)) : 0;

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

  // Pie data: sleep stages from today's raw
  const sleep = today?.raw?.sleep ?? {};
  const sleepPie = [
    { name: "Deep", value: sleep.deep_sleep_duration ?? 0, color: "#1e40af" },
    { name: "REM", value: sleep.rem_sleep_duration ?? 0, color: "#9333ea" },
    { name: "Light", value: sleep.light_sleep_duration ?? 0, color: "#60a5fa" },
    { name: "Awake", value: sleep.awake_time ?? 0, color: "#e5e7eb" },
  ].filter((d) => d.value > 0);
  const sleepPieTotal = sleepPie.reduce((s, d) => s + d.value, 0);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Health</h1>
            <p className="text-xs text-muted-foreground">
              {today
                ? new Date(today.metric_date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : "No data yet"}
            </p>
          </div>
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
            Sync
          </Button>
        </header>

        {connected === false && (
          <div className="rounded-xl border border-dashed p-4 text-sm">
            <p className="mb-2 font-medium">Oura not connected</p>
            <p className="mb-3 text-muted-foreground">
              Connect Oura in Settings to see sleep, readiness, HRV, RHR and
              activity.
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
            No data yet. Tap <span className="font-medium">Sync</span> to pull
            the last 30 days.
          </div>
        )}

        {/* Top summary row — 4 quick stats */}
        <section className="grid grid-cols-2 gap-3" aria-label="Today summary">
          <SmallTile
            label="Sleep"
            value={
              sleepHoursToday != null ? sleepHoursToday.toFixed(1) : "—"
            }
            unit="hours"
          />
          <SmallTile
            label="Steps"
            value={todaySteps != null ? todaySteps.toLocaleString() : "—"}
            unit={`${stepsPct}% of ${stepsGoal.toLocaleString()}`}
          />
          <SmallTile
            label="Resting HR"
            value={today?.resting_heart_rate?.toString() ?? "—"}
            unit="bpm"
            tone={
              today?.resting_heart_rate != null && today.resting_heart_rate < 65
                ? "good"
                : "neutral"
            }
          />
          <SmallTile
            label="Mood"
            value={
              moodToday == null ? "—" : MOOD_LABELS[moodToday] ?? String(moodToday)
            }
          />
        </section>

        {/* Hero tiles — Steps, Sleep Score, HRV, RHR */}
        <section
          className="grid grid-cols-2 gap-3"
          aria-label="Headline metrics"
        >
          <HeroTile
            icon={<Footprints className="h-4 w-4" />}
            label="Steps"
            value={todaySteps != null ? todaySteps.toLocaleString() : "—"}
            unit={`Goal ${stepsGoal.toLocaleString()}`}
            color="#ef4444"
          />
          <HeroTile
            icon={<Moon className="h-4 w-4" />}
            label="Sleep Score"
            value={today?.sleep_score?.toString() ?? "—"}
            unit="/ 100"
            color="#7c3aed"
          />
          <HeroTile
            icon={<Heart className="h-4 w-4" />}
            label="HRV"
            value={today?.hrv_avg != null ? today.hrv_avg.toFixed(1) : "—"}
            unit="ms"
            color="#ec4899"
          />
          <HeroTile
            icon={<Activity className="h-4 w-4" />}
            label="Resting HR"
            value={today?.resting_heart_rate?.toString() ?? "—"}
            unit="bpm"
            color="#f43f5e"
          />
        </section>

        {/* Steps trend area chart */}
        {stepsByDay.some((p) => p.steps != null) && (
          <section className="rounded-2xl border bg-card p-4" aria-label="Steps trend">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Steps</h2>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              {stepsChange != null && (
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                    (stepsChange >= 0
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-rose-500/10 text-rose-600")
                  }
                >
                  {stepsChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stepsChange.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stepsByDay}>
                  <defs>
                    <linearGradient id="stepsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(v: any) => [Number(v).toLocaleString(), "Steps"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="steps"
                    stroke="#fb7185"
                    strokeWidth={2}
                    fill="url(#stepsFill)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 border-t pt-3 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Avg</p>
                <p className="font-semibold">
                  {stepsAvg ? Math.round(stepsAvg).toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Min</p>
                <p className="font-semibold">
                  {Number.isFinite(stepsMin) ? stepsMin.toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Max</p>
                <p className="font-semibold">
                  {Number.isFinite(stepsMax) ? stepsMax.toLocaleString() : "—"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Last 7 days steps bars */}
        {last7Steps.some((p) => p.steps != null) && (
          <section className="rounded-2xl border bg-card p-4" aria-label="This week">
            <h2 className="text-base font-semibold">This week</h2>
            <div className="mt-3 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Steps}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: any) => [Number(v).toLocaleString(), "Steps"]}
                  />
                  <Bar dataKey="steps" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Vitals card */}
        <section className="rounded-2xl border bg-card p-4" aria-label="Vitals">
          <h2 className="text-base font-semibold">Vitals</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-rose-500/10 p-3">
              <p className="text-[11px] text-muted-foreground">Heart Rate</p>
              <p className="mt-1 text-2xl font-semibold">
                {today?.resting_heart_rate ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">bpm</p>
              {rhrChange != null && (
                <p
                  className={
                    "mt-1 text-[11px] font-medium " +
                    (rhrChange <= 0 ? "text-emerald-600" : "text-rose-600")
                  }
                >
                  {rhrChange.toFixed(1)}%
                </p>
              )}
            </div>
            <div className="rounded-xl bg-violet-500/10 p-3">
              <p className="text-[11px] text-muted-foreground">HRV</p>
              <p className="mt-1 text-2xl font-semibold">
                {today?.hrv_avg != null ? today.hrv_avg.toFixed(0) : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">ms</p>
              {hrvChange != null && (
                <p
                  className={
                    "mt-1 text-[11px] font-medium " +
                    (hrvChange >= 0 ? "text-emerald-600" : "text-rose-600")
                  }
                >
                  {hrvChange >= 0 ? "+" : ""}
                  {hrvChange.toFixed(1)}%
                </p>
              )}
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <p className="text-[11px] text-muted-foreground">Breathing</p>
              <p className="mt-1 text-2xl font-semibold">
                {breathingRate != null ? breathingRate.toFixed(0) : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">breaths/min</p>
            </div>
          </div>
        </section>

        {/* Sleep stages donut */}
        {sleepPieTotal > 0 && (
          <section className="rounded-2xl border bg-card p-4" aria-label="Sleep stages">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Sleep stages</h2>
              <span className="text-xs text-muted-foreground">
                {fmtHours(today?.total_sleep_seconds)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sleepPie}
                      dataKey="value"
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={2}
                    >
                      {sleepPie.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5 text-xs">
                {sleepPie.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: d.color }}
                      />
                      {d.name}
                    </span>
                    <span className="font-medium">
                      {fmtHours(d.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Wellbeing footer */}
        <section className="grid grid-cols-2 gap-3" aria-label="Wellbeing">
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smile className="h-3.5 w-3.5" />
              Mood today
            </div>
            <p className="mt-1 text-base font-semibold">
              {moodToday == null
                ? "Not logged"
                : MOOD_LABELS[moodToday] ?? String(moodToday)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {weekMoods.filter((m) => m.mood != null).length}/7 logged this week
            </p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5" />
              Habits streak
            </div>
            <p className="mt-1 text-base font-semibold">
              {currentStreak} {currentStreak === 1 ? "day" : "days"}
            </p>
            <p className="text-[11px] text-muted-foreground">Keep it going</p>
          </div>
        </section>

        {/* Trend deltas */}
        <section className="rounded-2xl border bg-card p-3 text-xs" aria-label="30-day trends">
          <p className="mb-2 font-medium">30-day trends</p>
          <TrendRow label="Sleep score" change={sleepChange} betterDirection="up" />
          <TrendRow label="HRV" change={hrvChange} betterDirection="up" />
          <TrendRow label="Resting HR" change={rhrChange} betterDirection="down" />
        </section>
      </article>
    </main>
  );
}

function TrendRow({
  label,
  change,
  betterDirection,
}: {
  label: string;
  change: number | null;
  betterDirection: "up" | "down";
}) {
  if (change == null) {
    return (
      <div className="flex justify-between py-1 text-muted-foreground">
        <span>{label}</span>
        <span>—</span>
      </div>
    );
  }
  const good =
    (betterDirection === "up" && change >= 0) ||
    (betterDirection === "down" && change <= 0);
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          "inline-flex items-center gap-1 font-medium " +
          (good ? "text-emerald-600" : "text-rose-600")
        }
      >
        {change >= 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {change >= 0 ? "+" : ""}
        {change.toFixed(1)}%
      </span>
    </div>
  );
}
