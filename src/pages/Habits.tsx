import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { HeartPulse, Activity, Scale, Apple } from "lucide-react";
import {
  HABIT_KEYS,
  HABIT_LABELS,
  useHabits,
  type HabitKey,
} from "@/hooks/use-habits";

const WEEKLY_TARGETS: Partial<Record<HabitKey, number>> = {
  run: 3,
  yoga: 2,
  sleepEarly: 5,
  wakeEarly: 5,
  freeWeights: 2,
};

function ScaleRow({
  label,
  icon,
  value,
  onChange,
  hint,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
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

  const { todayEntry, setFeeling, toggleHabit, weeklyCounts, last7Days } =
    useHabits();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-5">
        <header className="flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        </header>

        <section className="space-y-3" aria-label="Daily check-in">
          <h2 className="text-sm font-semibold text-muted-foreground">
            How do you feel today? (1 = a little, 5 = a lot)
          </h2>
          <ScaleRow
            label="Unhappy with weight"
            icon={<Scale className="h-4 w-4 text-primary" />}
            hint="How unhappy are you with your weight today?"
            value={todayEntry.weightUnhappy}
            onChange={(v) => setFeeling("weightUnhappy", v)}
          />
          <ScaleRow
            label="Lack of activity"
            icon={<Activity className="h-4 w-4 text-primary" />}
            hint="How inactive did you feel today?"
            value={todayEntry.inactivity}
            onChange={(v) => setFeeling("inactivity", v)}
          />
          <ScaleRow
            label="Feeling unhealthy"
            icon={<Apple className="h-4 w-4 text-primary" />}
            hint="How unhealthy did you feel today?"
            value={todayEntry.unhealthy}
            onChange={(v) => setFeeling("unhealthy", v)}
          />
        </section>

        <section className="space-y-2" aria-label="Today's habits">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Today's habits
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {HABIT_KEYS.map((k) => {
              const done = !!todayEntry.habits[k];
              return (
                <Button
                  key={k}
                  type="button"
                  variant={done ? "default" : "secondary"}
                  onClick={() => toggleHabit(k)}
                  aria-pressed={done}
                  className="justify-start"
                >
                  <span className="mr-2">{done ? "✓" : "○"}</span>
                  {HABIT_LABELS[k]}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2" aria-label="Weekly progress">
          <h2 className="text-sm font-semibold text-muted-foreground">
            This week
          </h2>
          <ul className="space-y-2">
            {HABIT_KEYS.map((k) => {
              const count = weeklyCounts[k];
              const target = WEEKLY_TARGETS[k] ?? 1;
              const pct = Math.min(100, Math.round((count / target) * 100));
              const hit = count >= target;
              return (
                <li
                  key={k}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{HABIT_LABELS[k]}</span>
                    <span
                      className={
                        hit
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {count}/{target}
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

        <section className="space-y-2" aria-label="Last 7 days">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Last 7 days
          </h2>
          <div className="grid grid-cols-7 gap-1">
            {last7Days.map((e) => {
              const count = HABIT_KEYS.reduce(
                (n, k) => n + (e.habits[k] ? 1 : 0),
                0
              );
              const intensity = count / HABIT_KEYS.length;
              const day = new Date(e.date).toLocaleDateString(undefined, {
                weekday: "short",
              });
              return (
                <div
                  key={e.date}
                  className="flex flex-col items-center gap-1"
                  title={`${e.date}: ${count} habits`}
                >
                  <div
                    className="h-10 w-full rounded-md border"
                    style={{
                      backgroundColor:
                        intensity > 0
                          ? `hsl(var(--primary) / ${0.2 + intensity * 0.8})`
                          : undefined,
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {day[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="pt-2 text-center text-xs text-muted-foreground">
          You've got this. One day at a time. 💪
        </footer>
      </article>
    </main>
  );
}
