import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Button, Icon, Checkbox, Badge, IconButton } from "@/ds";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useTime } from "@/hooks/use-time";
import { bucket, label as dueLabel } from "@/lib/pfdate";

const FOCUS_SECS = 25 * 60;

function fmtMMSS(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const PRIORITY_TONE: Record<string, "danger" | "primary" | "neutral"> = {
  high: "danger",
  medium: "primary",
  low: "neutral",
  none: "neutral",
};

export default function Focus() {
  const { tasks, toggleTask } = useTasks();
  const time = useTime();

  // Candidate tasks: any open task, most urgent (soonest due) first.
  const candidates = useMemo(() => {
    const order: Record<string, number> = { overdue: 0, today: 1, tomorrow: 2, week: 3, later: 4 };
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => (order[bucket(a.endsAt)] ?? 9) - (order[bucket(b.endsAt)] ?? 9));
  }, [tasks]);

  // Focus queue — task ids. Seed from the first 3 candidates once.
  const [queue, setQueue] = useState<string[]>([]);
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    if (candidates.length === 0) return;
    seeded.current = true;
    setQueue(candidates.slice(0, 3).map((t) => t.id));
  }, [candidates]);

  // Drop any queued ids that no longer resolve to an open task.
  useEffect(() => {
    setQueue((prev) => {
      const next = prev.filter((id) => tasks.some((t) => t.id === id && !t.completed));
      return next.length === prev.length ? prev : next;
    });
  }, [tasks]);

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t] as const)), [tasks]);
  const queuedTasks = queue.map((id) => byId.get(id)).filter(Boolean) as Task[];
  const current = queuedTasks[0] ?? null;

  const remainingCandidates = candidates.filter((t) => !queue.includes(t.id));

  // Pomodoro timer.
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECS);
  const [running, setRunning] = useState(false);
  const [mode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggleRun = () => {
    if (!current) return;
    const next = !running;
    setRunning(next);
    if (next) {
      void time.start({ taskId: current.id, description: current.title });
    } else {
      void time.stop();
    }
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(FOCUS_SECS);
    void time.stop();
  };

  const bump = (deltaMin: number) => {
    setSecondsLeft((s) => Math.max(60, s + deltaMin * 60));
  };

  const completeCurrent = () => {
    if (!current) return;
    void toggleTask(current.id);
    setQueue((q) => q.filter((id) => id !== current.id));
    setRunning(false);
    setSecondsLeft(FOCUS_SECS);
    void time.stop();
  };

  const removeFromQueue = (id: string) => {
    setQueue((q) => q.filter((x) => x !== id));
    if (current && current.id === id) {
      setRunning(false);
      setSecondsLeft(FOCUS_SECS);
    }
  };

  const addToQueue = (id: string) => setQueue((q) => (q.includes(id) ? q : [...q, id]));

  return (
    <div className="pf-page" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Focus</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            {candidates.length === 0
              ? "Nothing to focus on — add tasks due today."
              : queuedTasks.length === 0
              ? "Pick a few tasks to line up your next focus block."
              : `One block at a time — ${queuedTasks.length} ${queuedTasks.length === 1 ? "task" : "tasks"} queued.`}
          </p>
        </div>
        {running && (
          <Badge tone="primary" dot>
            {mode === "focus" ? "Focusing" : "On a break"}
          </Badge>
        )}
      </div>

      {candidates.length === 0 ? (
        <Card padding={40} style={{ marginTop: 22, textAlign: "center", color: "var(--text-tertiary)" }}>
          <div style={{ display: "inline-flex", marginBottom: 10, color: "var(--border-strong)" }}>
            <Icon name="TimerProperty1Linear" size={34} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)" }}>
            Nothing to focus on — add tasks due today.
          </div>
        </Card>
      ) : (
        <div
          className="pf-2col"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
            gap: 16,
            marginTop: 22,
            alignItems: "start",
          }}
        >
          {/* LEFT — the timer */}
          <Card padding={28} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <div style={{ textAlign: "center", minHeight: 24 }}>
              {current ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>
                    Now focusing
                  </div>
                  <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                    {current.title}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
                  Add a task from the queue to start your first block.
                </div>
              )}
            </div>

            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {fmtMMSS(secondsLeft)}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <Button
                variant={running ? "secondary" : "primary"}
                size="lg"
                disabled={!current}
                onClick={toggleRun}
                leadingIcon={<Icon name={running ? "ClockProperty1Bold" : "TimerProperty1Bold"} size={18} />}
              >
                {running ? "Pause" : secondsLeft === FOCUS_SECS ? "Start" : "Resume"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={reset}
                leadingIcon={<Icon name="ArrowLeftProperty1Linear" size={17} />}
              >
                Reset
              </Button>
              <Button variant="ghost" size="lg" onClick={() => bump(5)}>
                +5 min
              </Button>
              <Button variant="ghost" size="lg" onClick={() => bump(-5)}>
                -5 min
              </Button>
            </div>

            <div style={{ width: "100%", borderTop: "1px solid var(--border-soft)", paddingTop: 18, display: "flex", justifyContent: "center" }}>
              <Button
                variant="accent"
                size="md"
                disabled={!current}
                onClick={completeCurrent}
                leadingIcon={<Icon name="TickCircleProperty1Bold" size={17} />}
              >
                Complete task
              </Button>
            </div>
          </Card>

          {/* RIGHT — queue + add list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card padding={20}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Up next</h3>
                <Badge tone="neutral">{queuedTasks.length} queued</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {queuedTasks.length === 0 && (
                  <div style={{ padding: "22px 12px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
                    Your queue is empty — add a task below to get going.
                  </div>
                )}
                {queuedTasks.map((t, i) => {
                  const overdue = bucket(t.endsAt) === "overdue";
                  const isCurrent = i === 0;
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 14px",
                        background: isCurrent ? "var(--primary-50)" : "var(--surface-card)",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${isCurrent ? "var(--primary-400)" : "var(--border-soft)"}`,
                      }}
                    >
                      <Checkbox checked={t.completed} onChange={() => toggleTask(t.id)} />
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontFamily: "var(--font-sans)",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.title}
                      </span>
                      {t.priority !== "none" && (
                        <span className="pf-hide-narrow">
                          <Badge tone={PRIORITY_TONE[t.priority]} dot>
                            {t.priority}
                          </Badge>
                        </span>
                      )}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 600,
                          color: overdue ? "var(--red-500)" : "var(--text-tertiary)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel(t.endsAt)}
                      </span>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        title="Remove from focus"
                        onClick={() => removeFromQueue(t.id)}
                        icon={<Icon name="CloseCircleProperty1Linear" size={16} />}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            {remainingCandidates.length > 0 && (
              <Card padding={20}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Add to focus</h3>
                  <Badge tone="neutral">{remainingCandidates.length}</Badge>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {remainingCandidates.map((t) => {
                    const overdue = bucket(t.endsAt) === "overdue";
                    return (
                      <button
                        key={t.id}
                        onClick={() => addToQueue(t.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          background: "var(--surface-card)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-soft)",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <span style={{ display: "inline-flex", color: "var(--primary-500)", flexShrink: 0 }}>
                          <Icon name="AddProperty1Bold" size={16} />
                        </span>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontFamily: "var(--font-sans)",
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.title}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            color: overdue ? "var(--red-500)" : "var(--text-tertiary)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel(t.endsAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
