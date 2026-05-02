import { useMemo, useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useTasks, INBOX_ID, type Task, type TimeOfDay } from "@/hooks/use-tasks";
import { Link } from "react-router-dom";
import { FolderKanban, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Sunrise,
  CloudMoon,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Trash2,
} from "lucide-react";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";

type Bucket = "anytime" | "morning" | "afternoon" | "evening" | "done";

const BUCKET_META: Record<
  Bucket,
  { label: string; icon: React.ReactNode; placeholder: string; chip: string }
> = {
  anytime: {
    label: "ANYTIME",
    icon: <Clock className="h-3.5 w-3.5" />,
    placeholder: "Anytime today works",
    chip: "bg-muted text-muted-foreground",
  },
  morning: {
    label: "MORNING",
    icon: <Sunrise className="h-3.5 w-3.5" />,
    placeholder: "Add a morning task",
    chip: "bg-amber-500/15 text-amber-600",
  },
  afternoon: {
    label: "AFTERNOON",
    icon: <Sun className="h-3.5 w-3.5" />,
    placeholder: "Add an afternoon task",
    chip: "bg-violet-500/15 text-violet-500",
  },
  evening: {
    label: "EVENING",
    icon: <CloudMoon className="h-3.5 w-3.5" />,
    placeholder: "End the day your way",
    chip: "bg-indigo-500/15 text-indigo-400",
  },
  done: {
    label: "DONE",
    icon: <Check className="h-3.5 w-3.5" />,
    placeholder: "",
    chip: "bg-emerald-500/15 text-emerald-500",
  },
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  const dow = (r.getDay() + 6) % 7;
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - dow);
  return r;
}

function bucketForTask(task: Task, selectedDay: Date): Bucket | null {
  const isToday = isSameDay(selectedDay, new Date());

  if (task.completed) {
    if (task.completedAt) {
      const c = new Date(task.completedAt);
      if (isSameDay(c, selectedDay)) return "done";
    }
    return null;
  }

  if (task.startsAt) {
    const s = new Date(task.startsAt);
    if (!isSameDay(s, selectedDay)) return null;
    const h = s.getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  if (!isToday) return null;
  const tod: TimeOfDay = task.timeOfDay;
  if (tod === "morning") return "morning";
  if (tod === "afternoon") return "afternoon";
  if (tod === "evening") return "evening";
  return "anytime";
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Progress() {
  useSEO({
    title: "Plan | Peak Focus",
    description: "Your day at a glance, grouped by time of day.",
    canonical: "/progress",
  });

  const { tasks, projects, toggleTask, removeTask } = useTasks();
  const [projectsOpen, setProjectsOpen] = useState(false);

  const projectGroups = useMemo(() => {
    const inbox = tasks.filter((t) => !t.completed && t.projectId === INBOX_ID);
    const groups = projects.map((p) => ({
      project: p,
      items: tasks.filter((t) => !t.completed && t.projectId === p.id),
    }));
    return { inbox, groups };
  }, [tasks, projects]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [openSections, setOpenSections] = useState<Record<Bucket, boolean>>({
    anytime: true,
    morning: true,
    afternoon: true,
    evening: true,
    done: true,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [addBucket, setAddBucket] = useState<TimeOfDay>("anytime");

  const weekDates = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const grouped = useMemo(() => {
    const out: Record<Bucket, Task[]> = {
      anytime: [],
      morning: [],
      afternoon: [],
      evening: [],
      done: [],
    };
    for (const t of tasks) {
      const b = bucketForTask(t, selectedDate);
      if (b) out[b].push(t);
    }
    for (const k of Object.keys(out) as Bucket[]) {
      out[k].sort((a, b) => {
        const aTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const bTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return aTime - bTime;
      });
    }
    return out;
  }, [tasks, selectedDate]);

  const headerLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
  });
  const monthLabel = selectedDate
    .toLocaleDateString(undefined, { month: "long", year: "numeric" })
    .toUpperCase();

  const today = new Date();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header className="flex items-end justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">{headerLabel}</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 7);
                setSelectedDate(d);
              }}
              aria-label="Previous week"
              className="rounded-full p-1 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {monthLabel}
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 7);
                setSelectedDate(d);
              }}
              aria-label="Next week"
              className="rounded-full p-1 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="rounded-xl border bg-card">
          <button
            type="button"
            onClick={() => setProjectsOpen((o) => !o)}
            aria-expanded={projectsOpen}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Projects
              <span className="text-xs text-muted-foreground">
                ({projects.length} · {projectGroups.inbox.length + projectGroups.groups.reduce((n, g) => n + g.items.length, 0)} open)
              </span>
            </span>
            <ChevronDown
              className={
                "h-4 w-4 text-muted-foreground transition-transform " +
                (projectsOpen ? "" : "-rotate-90")
              }
            />
          </button>
          {projectsOpen && (
            <div className="space-y-3 border-t px-3 py-3">
              <Link
                to="/tasks"
                className="flex items-center justify-between rounded-md bg-muted/40 p-2 text-xs hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">Inbox</span>
                </span>
                <span className="text-muted-foreground">
                  {projectGroups.inbox.length} open
                </span>
              </Link>
              {projectGroups.groups.map(({ project, items }) => (
                <Link
                  key={project.id}
                  to="/tasks"
                  className="flex items-center justify-between rounded-md bg-muted/40 p-2 text-xs hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="font-medium">{project.name}</span>
                  </span>
                  <span className="text-muted-foreground">{items.length} open</span>
                </Link>
              ))}
              <Link
                to="/tasks"
                className="block text-center text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Manage projects →
              </Link>
            </div>
          )}
        </section>

        <section
          className="grid grid-cols-7 gap-1 text-center"
          aria-label="Date strip"
        >
          {weekDates.map((d, i) => {
            const letter = ["M", "T", "W", "T", "F", "S", "S"][i];
            const isSel = isSameDay(d, selectedDate);
            const isTd = isSameDay(d, today);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelectedDate(d)}
                aria-pressed={isSel}
                className={
                  "flex flex-col items-center rounded-md py-1 text-xs " +
                  (isSel
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent")
                }
              >
                <span className="text-[10px]">{letter}</span>
                <span className="text-base font-medium">{d.getDate()}</span>
                {isTd && <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </section>

        <div className="space-y-3">
          {(["anytime", "morning", "afternoon", "evening", "done"] as Bucket[]).map(
            (bucket) => {
              const meta = BUCKET_META[bucket];
              const items = grouped[bucket];
              const open = openSections[bucket];
              if (bucket === "done" && items.length === 0) return null;
              return (
                <section key={bucket} className="space-y-2">
                  <header className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSections((s) => ({ ...s, [bucket]: !s[bucket] }))
                      }
                      aria-expanded={open}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold " +
                          meta.chip
                        }
                      >
                        {meta.icon}
                        {meta.label} ({items.length})
                      </span>
                      <ChevronDown
                        className={
                          "h-4 w-4 text-muted-foreground transition-transform " +
                          (open ? "" : "-rotate-90")
                        }
                      />
                    </button>
                    {bucket !== "done" && (
                      <button
                        type="button"
                        aria-label={`Add ${bucket} task`}
                        onClick={() => {
                          setAddBucket(bucket as TimeOfDay);
                          setAddOpen(true);
                        }}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </header>
                  {open && (
                    <div className="space-y-2">
                      {items.length === 0 && bucket !== "done" && (
                        <p className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">
                          {meta.placeholder}
                        </p>
                      )}
                      {items.map((t) => (
                        <article
                          key={t.id}
                          className="flex items-center gap-3 rounded-xl border bg-card p-3"
                        >
                          <span
                            className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-orange-300 to-pink-400"
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={
                                "truncate text-sm font-medium " +
                                (t.completed
                                  ? "line-through text-muted-foreground"
                                  : "")
                              }
                            >
                              {t.title}
                            </p>
                            {(t.startsAt || t.endsAt) && (
                              <p className="text-[11px] text-muted-foreground">
                                {fmtTime(t.startsAt)}
                                {t.endsAt ? ` → ${fmtTime(t.endsAt)}` : ""}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleTask(t.id)}
                            aria-label={
                              t.completed ? `Reopen ${t.title}` : `Complete ${t.title}`
                            }
                            className={
                              "flex h-6 w-6 items-center justify-center rounded-full border " +
                              (t.completed
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-muted-foreground/40 text-transparent hover:border-primary")
                            }
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          {bucket === "done" && (
                            <button
                              type="button"
                              onClick={() => removeTask(t.id)}
                              aria-label={`Delete ${t.title}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            }
          )}
        </div>
      </article>

      <Button
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg"
        aria-label="Add task"
        onClick={() => {
          setAddBucket("anytime");
          setAddOpen(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddTaskDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultTimeOfDay={addBucket}
        defaultStartDate={selectedDate}
      />
    </main>
  );
}
