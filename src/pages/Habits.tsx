import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HeartPulse,
  Activity,
  Scale,
  Apple,
  Flame,
  Plus,
  Trash2,
  Minus,
} from "lucide-react";
import { useHabits } from "@/hooks/use-habits";

const FEELING_HINTS: Record<string, string> = {
  weightUnhappy: "How unhappy are you with your weight today?",
  inactivity: "How inactive did you feel today?",
  unhealthy: "How unhealthy did you feel today?",
};

function ScaleRow({
  label,
  icon,
  value,
  onChange,
  hintKey,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  hintKey: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {FEELING_HINTS[hintKey]}
      </p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            aria-label={`${label} level ${n}`}
            aria-pressed={value === n}
            className={
              "h-9 flex-1 rounded-md border text-sm font-medium transition-colors " +
              (value >= n
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:bg-accent")
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Habits() {
  useSEO({
    title: "Habits | Peak Focus",
    description: "Track daily wellbeing and weekly healthy habits.",
    canonical: "/habits",
  });

  const {
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
  } = useHabits();

  const [newHabitLabel, setNewHabitLabel] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("✨");

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitLabel.trim()) return;
    addHabit(newHabitLabel, newHabitEmoji || "✨", 3);
    setNewHabitLabel("");
    setNewHabitEmoji("✨");
  };

  const totalToday = habits.reduce(
    (n, h) => n + (todayEntry.habits[h.key] ? 1 : 0),
    0
  );

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
            aria-label={`Current streak: ${currentStreak} days`}
          >
            <Flame className="h-4 w-4" aria-hidden="true" />
            {currentStreak} day streak
          </span>
        </header>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <section className="space-y-2" aria-label="Daily check-in">
              <h2 className="text-sm font-semibold text-muted-foreground">
                How do you feel today? (1 = a little, 5 = a lot)
              </h2>
              <ScaleRow
                label="Unhappy with weight"
                icon={<Scale className="h-4 w-4 text-primary" />}
                hintKey="weightUnhappy"
                value={todayEntry.weightUnhappy}
                onChange={(v) => setFeeling("weightUnhappy", v)}
              />
              <ScaleRow
                label="Lack of activity"
                icon={<Activity className="h-4 w-4 text-primary" />}
                hintKey="inactivity"
                value={todayEntry.inactivity}
                onChange={(v) => setFeeling("inactivity", v)}
              />
              <ScaleRow
                label="Feeling unhealthy"
                icon={<Apple className="h-4 w-4 text-primary" />}
                hintKey="unhealthy"
                value={todayEntry.unhealthy}
                onChange={(v) => setFeeling("unhealthy", v)}
              />
            </section>

            <section className="space-y-2" aria-label="Today's habits">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Today's habits
                </h2>
                <span className="text-xs text-muted-foreground">
                  {totalToday}/{habits.length} done
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {habits.map((h) => {
                  const done = !!todayEntry.habits[h.key];
                  return (
                    <button
                      key={h.key}
                      type="button"
                      onClick={() => toggleHabit(h.key)}
                      aria-pressed={done}
                      className={
                        "flex items-center justify-between rounded-lg border p-3 text-left transition-colors " +
                        (done
                          ? "bg-primary/10 border-primary"
                          : "bg-card hover:bg-accent")
                      }
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl" aria-hidden="true">
                          {h.emoji}
                        </span>
                        <span className="font-medium">{h.label}</span>
                      </span>
                      <span
                        className={
                          "flex h-6 w-6 items-center justify-center rounded-full border text-xs " +
                          (done
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-muted-foreground/40 text-muted-foreground")
                        }
                        aria-hidden="true"
                      >
                        {done ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2" aria-label="Daily note">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Note (optional)
              </h2>
              <Textarea
                placeholder="What helped today? What got in the way?"
                value={todayEntry.note ?? ""}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </section>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <section className="space-y-2" aria-label="Weekly progress">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Weekly targets (Mon–Sun)
              </h2>
              <ul className="space-y-2">
                {habits.map((h) => {
                  const count = weeklyCounts[h.key] ?? 0;
                  const target = h.weeklyTarget;
                  const pct = Math.min(100, Math.round((count / target) * 100));
                  const hit = count >= target;
                  return (
                    <li key={h.key} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span aria-hidden="true">{h.emoji}</span>
                          {h.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateHabitTarget(h.key, target - 1)}
                            aria-label={`Decrease ${h.label} target`}
                            className="rounded border p-1 text-muted-foreground hover:bg-accent"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span
                            className={
                              "w-10 text-center font-semibold " +
                              (hit ? "text-primary" : "text-muted-foreground")
                            }
                          >
                            {count}/{target}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateHabitTarget(h.key, target + 1)}
                            aria-label={`Increase ${h.label} target`}
                            className="rounded border p-1 text-muted-foreground hover:bg-accent"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="space-y-2" aria-label="Last 7 days heatmap">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Last 7 days
              </h2>
              <div className="grid grid-cols-7 gap-1">
                {last7Days.map((e) => {
                  const count = habits.reduce(
                    (n, h) => n + (e.habits[h.key] ? 1 : 0),
                    0
                  );
                  const intensity = habits.length
                    ? count / habits.length
                    : 0;
                  const day = new Date(e.date).toLocaleDateString(undefined, {
                    weekday: "short",
                  });
                  const dayNum = new Date(e.date).getDate();
                  return (
                    <div
                      key={e.date}
                      className="flex flex-col items-center gap-1"
                      title={`${e.date}: ${count}/${habits.length} habits`}
                    >
                      <div
                        className="flex h-12 w-full items-center justify-center rounded-md border text-xs font-medium"
                        style={{
                          backgroundColor:
                            intensity > 0
                              ? `hsl(var(--primary) / ${0.15 + intensity * 0.85})`
                              : undefined,
                          color: intensity > 0.5 ? "white" : undefined,
                        }}
                      >
                        {dayNum}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {day[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2" aria-label="Manage habits">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Custom habits
              </h2>
              <form
                onSubmit={handleAddHabit}
                className="flex gap-2"
                aria-label="Add custom habit"
              >
                <Input
                  type="text"
                  inputMode="text"
                  maxLength={2}
                  className="w-14 text-center"
                  value={newHabitEmoji}
                  onChange={(e) => setNewHabitEmoji(e.target.value)}
                  aria-label="Emoji"
                />
                <Input
                  type="text"
                  placeholder="Add a habit (e.g. drink water)"
                  value={newHabitLabel}
                  onChange={(e) => setNewHabitLabel(e.target.value)}
                />
                <Button type="submit" size="icon" aria-label="Add habit">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
              <ul className="space-y-1">
                {habits
                  .filter((h) => !h.builtin)
                  .map((h) => (
                    <li
                      key={h.key}
                      className="flex items-center justify-between rounded border bg-card px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">{h.emoji}</span>
                        {h.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeHabit(h.key)}
                        aria-label={`Remove ${h.label}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                {habits.filter((h) => !h.builtin).length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    No custom habits yet.
                  </li>
                )}
              </ul>
            </section>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <section
              className="rounded-lg border bg-card p-4"
              aria-label="Month dashboard"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  {monthlyStats.monthLabel}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {monthlyStats.activeDays}/{monthlyStats.daysInMonth} active
                  days
                </span>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {monthMatrix.map((cell, i) => {
                  if (!cell.date) {
                    return <div key={i} className="h-9 rounded-md" />;
                  }
                  const e = cell.entry;
                  const count = e
                    ? habits.reduce(
                        (n, h) => n + (e.habits[h.key] ? 1 : 0),
                        0
                      )
                    : 0;
                  const intensity = habits.length
                    ? count / habits.length
                    : 0;
                  const dayNum = new Date(cell.date).getDate();
                  return (
                    <div
                      key={i}
                      title={`${cell.date}: ${count}/${habits.length}`}
                      className={
                        "flex h-9 items-center justify-center rounded-md border text-xs font-medium " +
                        (cell.isToday ? "ring-2 ring-primary" : "")
                      }
                      style={{
                        backgroundColor:
                          intensity > 0
                            ? `hsl(var(--primary) / ${0.15 + intensity * 0.85})`
                            : undefined,
                        color: intensity > 0.5 ? "white" : undefined,
                      }}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </section>

            <section
              className="grid grid-cols-3 gap-2"
              aria-label="Monthly feeling averages"
            >
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {monthlyStats.avgWeight.toFixed(1)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Avg weight ✕
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {monthlyStats.avgInactivity.toFixed(1)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Avg inactivity
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {monthlyStats.avgUnhealthy.toFixed(1)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Avg unhealthy
                </p>
              </div>
            </section>

            <section className="space-y-2" aria-label="Monthly habit totals">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Habit totals this month
              </h2>
              <ul className="space-y-2">
                {habits.map((h) => {
                  const total = monthlyStats.habitTotals[h.key] ?? 0;
                  const target = Math.round(
                    (h.weeklyTarget * monthlyStats.daysInMonth) / 7
                  );
                  const pct = target
                    ? Math.min(100, Math.round((total / target) * 100))
                    : 0;
                  return (
                    <li key={h.key} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span aria-hidden="true">{h.emoji}</span>
                          {h.label}
                        </span>
                        <span className="text-muted-foreground">
                          {total}/{target}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </TabsContent>
        </Tabs>

        <footer className="pt-2 text-center text-xs text-muted-foreground">
          One day at a time. Small wins compound. 💪
        </footer>
      </article>
    </main>
  );
}
