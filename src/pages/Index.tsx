import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { Flame, Timer, ListTodo, Mountain } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  useSEO({
    title: "Peak Focus — Home",
    description: "Your ADHD-friendly productivity dashboard with mountain progress and focus stats.",
    canonical: "/",
  });

  return (
    <main className="mx-auto max-w-md min-h-screen bg-background px-6 pt-8 pb-20 flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Peak Focus</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground select-none" aria-label="Current streak: 5 days">
          <Flame className="h-4 w-4" aria-hidden="true" />
          5 day streak
        </span>
      </header>

      <section aria-label="Mountain progress" className="relative rounded-xl border bg-card p-6 text-card-foreground shadow-sm overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] opacity-70" />
        <div className="relative flex items-center justify-between text-white">
          <svg width="64" height="64" viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 2L12 52H52L32 2Z" stroke="white" strokeWidth="2" fill="url(#mountain-gradient)" />
            <defs>
              <linearGradient id="mountain-gradient" x1="32" y1="2" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--primary))" />
                <stop offset="1" stopColor="hsl(var(--primary)/0.6)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-2xl font-bold" aria-live="polite" aria-atomic="true">65% to summit</span>
        </div>
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
          to="/mountains"
          className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          aria-label="Manage Tasks"
        >
          <ListTodo className="h-4 w-4" aria-hidden="true" />
          Manage Tasks
        </Link>
      </section>

      <aside className="sr-only" aria-hidden>
        <Mountain />
      </aside>
    </main>
  );
};

export default Index;
