import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTasks, INBOX_ID, type NewTaskInput, type Priority, type Repeat, type TimeOfDay } from "@/hooks/use-tasks";
import { Check, X, Sparkles, RefreshCw, Plus, Lock } from "lucide-react";

const PRIORITY_DOTS: Record<Exclude<Priority, "none">, string> = {
  high: "#fb7185",
  medium: "#f59e0b",
  low: "#38bdf8",
};

const TIME_LABEL: Record<TimeOfDay, string> = {
  anytime: "Anytime",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  at_time: "At time",
};

const REPEAT_LABEL: Record<Repeat, string> = {
  none: "Never",
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
};

function isoLocalToParts(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

function partsToIso(date: string, time: string): string | null {
  if (!date) return null;
  const t = time || "00:00";
  return new Date(`${date}T${t}`).toISOString();
}

export default function AddTaskDialog({
  open,
  onClose,
  defaultProjectId = INBOX_ID,
  defaultPriority = "none",
  defaultTimeOfDay,
  defaultStartDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultPriority?: Priority;
  defaultTimeOfDay?: TimeOfDay;
  defaultStartDate?: Date;
}) {
  const { addTask, projects } = useTasks();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [projectId, setProjectId] = useState<string>(defaultProjectId);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("at_time");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [repeat, setRepeat] = useState<Repeat>("daily");
  const [notes, setNotes] = useState<string>("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subDraft, setSubDraft] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setPriority(defaultPriority);
    setProjectId(defaultProjectId);
    setTimeOfDay(defaultTimeOfDay ?? "at_time");
    const baseDay = defaultStartDate ? new Date(defaultStartDate) : new Date();
    const defaultHour =
      defaultTimeOfDay === "morning"
        ? 9
        : defaultTimeOfDay === "afternoon"
          ? 14
          : defaultTimeOfDay === "evening"
            ? 19
            : new Date().getHours();
    const start = new Date(baseDay);
    start.setHours(defaultHour, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60_000);
    const sp = isoLocalToParts(start.toISOString());
    const ep = isoLocalToParts(end.toISOString());
    setStartDate(sp.date);
    setStartTime(sp.time);
    setEndDate(ep.date);
    setEndTime(ep.time);
    setRepeat("none");
    setNotes("");
    setSubtasks([]);
    setSubDraft("");
  }, [open, defaultPriority, defaultProjectId, defaultTimeOfDay, defaultStartDate]);

  if (!open) return null;

  const cyclePriority = () => {
    const order: Priority[] = ["none", "high", "medium", "low"];
    setPriority(order[(order.indexOf(priority) + 1) % order.length]);
  };
  const cycleTimeOfDay = () => {
    const order: TimeOfDay[] = ["anytime", "morning", "afternoon", "evening", "at_time"];
    setTimeOfDay(order[(order.indexOf(timeOfDay) + 1) % order.length]);
  };
  const cycleRepeat = () => {
    const order: Repeat[] = ["none", "daily", "weekdays", "weekly", "monthly"];
    setRepeat(order[(order.indexOf(repeat) + 1) % order.length]);
  };

  const submit = async () => {
    if (!title.trim()) return;
    const startsAt = timeOfDay === "at_time" ? partsToIso(startDate, startTime) : null;
    const endsAt = timeOfDay === "at_time" ? partsToIso(endDate, endTime) : null;
    const input: NewTaskInput = {
      title,
      projectId,
      priority,
      startsAt,
      endsAt,
      timeOfDay,
      repeat,
      notes,
    };
    const parentId = await addTask(input);
    if (parentId && subtasks.length) {
      for (const s of subtasks) {
        if (s.trim()) {
          await addTask({
            title: s,
            projectId,
            priority: "none",
            timeOfDay: "anytime",
            repeat: "none",
            parentId,
          });
        }
      }
    }
    onClose();
  };

  const priorityDot =
    priority === "none" ? "bg-muted-foreground/40" : "";
  const priorityColor = priority === "none" ? undefined : PRIORITY_DOTS[priority];

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add task"
        className="flex h-full w-full max-w-md flex-col bg-background shadow-xl"
      >
      <header className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="rounded-full bg-muted p-2 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-base font-semibold">Add task</h2>
        <button
          type="button"
          onClick={submit}
          aria-label="Save task"
          className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-50"
          disabled={!title.trim()}
        >
          <Check className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-8">
        <div className="rounded-2xl border bg-card p-3">
          <div className="flex items-center gap-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="border-0 bg-transparent text-base focus-visible:ring-0"
            />
            <button
              type="button"
              onClick={cyclePriority}
              aria-label="Cycle priority"
              className={"h-6 w-6 rounded-full border " + priorityDot}
              style={priorityColor ? { backgroundColor: priorityColor, borderColor: priorityColor } : undefined}
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-card">
          <RowButton label="Time of day" value={TIME_LABEL[timeOfDay]} onClick={cycleTimeOfDay} />
          {timeOfDay === "at_time" && (
            <>
              <Row label="Starts">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                />
              </Row>
              <Row label="Ends">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                />
              </Row>
            </>
          )}
          <RowButton
            label="Repeat"
            value={REPEAT_LABEL[repeat]}
            onClick={cycleRepeat}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          />
          <Row label="Project">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value={INBOX_ID}>Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Row>
        </div>

        <div className="rounded-2xl border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Sub-tasks</p>
            <button
              type="button"
              disabled
              title="Coming with the AI agent"
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground"
            >
              <Sparkles className="h-3 w-3" />
              Suggest breakdown
              <Lock className="h-3 w-3" />
            </button>
          </div>
          <ul className="space-y-1">
            {subtasks.map((s, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                <span className="h-3 w-3 rounded-full border" />
                <span className="flex-1">{s}</span>
                <button
                  type="button"
                  onClick={() => setSubtasks((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove ${s}`}
                  className="text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!subDraft.trim()) return;
              setSubtasks((prev) => [...prev, subDraft.trim()]);
              setSubDraft("");
            }}
            className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
              placeholder="Add new"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </form>
        </div>

        <div className="rounded-2xl border bg-card p-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes / what does this task need?"
            rows={3}
            className="resize-none border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
      </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b px-3 py-2.5 last:border-b-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function RowButton({
  label,
  value,
  onClick,
  icon,
}: {
  label: string;
  value: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b px-3 py-3 text-left last:border-b-0 hover:bg-accent"
    >
      <span className="text-sm">{label}</span>
      <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs">
        {icon}
        {value}
      </span>
    </button>
  );
}
