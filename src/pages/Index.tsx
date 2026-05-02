import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { Flame, Timer, ListTodo, Mountain, HeartPulse } from "lucide-react";
import { MountainVisualization } from "@/components/ui/MountainVisualization";
import { Link } from "react-router-dom";
import { useHabits } from "@/hooks/use-habits";

const Index = () => {
  useSEO({
    title: "Peak Focus — Home",
    description: "Your ADHD-friendly productivity dashboard with mountain progress and focus stats.",
    canonical: "/",
  });

  const { habits, weeklyCounts, todayEntry, currentStreak } = useHabits();

  const mountainScore = useMemo(() => {
    // Positive: weekly habit completion vs targets (0..100)
    const totalTarget = habits.reduce((n, h) => n + h.weeklyTarget, 0);
    const totalDone = habits.reduce(
      (n, h) => n + Math.min(weeklyCounts[h.key] ?? 0, h.weeklyTarget),
      0
    );
    const habitScore = totalTarget ? (totalDone / totalTarget) * 100 : 0;

    // Negative: today's negative-feeling marks (each 0..5, max sum 15)
    const negSum =
      todayEntry.weightUnhappy +
      todayEntry.inactivity +
      todayEntry.unhealthy;
    const penalty = (negSum / 15) * 50; // up to -50

    return Math.max(0, Math.min(100, Math.round(habitScore - penalty)));
  }, [habits, weeklyCounts, todayEntry]);

  return (
    <main className="mx-auto max-w-md min-h-screen bg-background px-6 pt-8 pb-20 flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Peak Focus</h1>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground select-none"
          aria-label={`Current streak: ${currentStreak} days`}
        >
          <Flame className="h-4 w-4" aria-hidden="true" />
          {currentStreak} day streak
        </span>
      </header>

      <section aria-label="Mountain progress">
        <MountainVisualization
          completionPercentage={mountainScore}
          theme="alpine"
          mode="grow"
          label="Mountain"
        />
      </section>

      <section aria-label="Focus statistics" className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
          <p className="text-4xl font-extrabold text-primary">3</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Tasks Done</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
          <p className="text-4xl font-extrabold text-primary">0</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Pomodoros</p>
        </div>
      </section>

      <section className="mt-auto flex flex-col gap-3">
        <Button asChild className="w-full">
          <Link to="/focus" aria-label="Start Focus Session" className="inline-flex items-center justify-center gap-2">
            <Timer className="h-5 w-5" aria-hidden="true" />
            Start Focus Session
          </Link>
        </Button>

        <Link
          to="/tasks"
          className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          aria-label="Manage Tasks"
        >
          <ListTodo className="h-4 w-4" aria-hidden="true" />
          Manage Tasks
        </Link>

        <Link
          to="/habits"
          className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          aria-label="Track Habits"
        >
          <HeartPulse className="h-4 w-4" aria-hidden="true" />
          Track Habits
        </Link>
      </section>

      <aside className="sr-only" aria-hidden>
        <Mountain />
      </aside>
    </main>
  );
};

export default Index;
