import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square } from "lucide-react";
import { Card, Button, Icon, Checkbox, Badge, IconButton } from "@/ds";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useTime } from "@/hooks/use-time";
import { useFocusQueue } from "@/hooks/use-focus-queue";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { bucket, label as dueLabel } from "@/lib/pfdate";

const NEXT_COMMAND = /\b(next|done)\b/i;

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
  const navigate = useNavigate();
  const { tasks, toggleTask } = useTasks();
  const time = useTime();
  const { queue, setQueue } = useFocusQueue();

  // Drop any queued ids that no longer resolve to an open task.
  useEffect(() => {
    setQueue((prev) => {
      const next = prev.filter((id) => tasks.some((t) => t.id === id && !t.completed));
      return next.length === prev.length ? prev : next;
    });
  }, [tasks, setQueue]);

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t] as const)), [tasks]);
  const queuedTasks = queue.map((id) => byId.get(id)).filter(Boolean) as Task[];
  const current = queuedTasks[0] ?? null;

  // Pomodoro timer — countdown is local; whether it's *running* comes from the
  // single shared time-tracking session (useTime), same source Dashboard reads.
  const [manualSecs, setManualSecs] = useState(FOCUS_SECS);
  // Seconds already spent on the *current* block across prior run segments —
  // pausing ends the underlying time entry, so without this the countdown
  // would forget everything elapsed before the last pause.
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);
  const [mode] = useState<"focus" | "break">("focus");
  const running = !!time.running;
  const runningTask = time.running?.taskId ? byId.get(time.running.taskId) : null;
  const runningLabel = runningTask?.title ?? time.running?.description ?? "Untitled focus";
  const currentSegmentSecs = running ? Math.floor(time.durationOf(time.running!) / 1000) : 0;
  const secondsLeft = Math.max(0, manualSecs - elapsedBeforePause - currentSegmentSecs);

  // A different task becoming current (queue reorder, completion, removal)
  // starts a fresh block — don't carry over the old task's progress.
  useEffect(() => {
    setElapsedBeforePause(0);
  }, [current?.id]);

  const toggleRun = () => {
    if (running) {
      setElapsedBeforePause((s) => s + currentSegmentSecs);
      void time.stop();
    } else if (current) {
      void time.start({ taskId: current.id, description: current.title });
    }
  };
  const reset = () => {
    if (running) void time.stop();
    setElapsedBeforePause(0);
    setManualSecs(FOCUS_SECS);
  };
  const bump = (deltaMin: number) => {
    if (running) return;
    setManualSecs((s) => Math.max(60, s + deltaMin * 60));
  };
  const completeCurrent = () => {
    if (!current) return;
    void toggleTask(current.id);
    setQueue((q) => q.filter((id) => id !== current.id));
    if (running) void time.stop();
    setElapsedBeforePause(0);
    setManualSecs(FOCUS_SECS);
  };
  const removeFromQueue = (id: string) => setQueue((q) => q.filter((x) => x !== id));

  const { supported: voiceSupported, listening: voiceListening, error: voiceError, toggle: toggleVoice, stop: stopVoice } = useSpeechToText({
    onFinalize: (text) => {
      if (NEXT_COMMAND.test(text)) {
        completeCurrent();
        stopVoice();
      }
    },
  });

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Focus</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            {queuedTasks.length === 0
              ? "One thing at a time. Add the tasks you want to work on from Tasks or Projects."
              : `One block at a time — ${queuedTasks.length} ${queuedTasks.length === 1 ? "task" : "tasks"} queued.`}
          </p>
        </div>
        {running && (
          <Badge tone="primary" dot>
            {mode === "focus" ? "Focusing" : "On a break"}
          </Badge>
        )}
      </div>

      <div
        className="pf-2col"
        style={{
          display: "grid",
          // Timer is capped so it never balloons; the queue takes the rest and
          // is the widest thing on screen.
          gridTemplateColumns: "minmax(300px, 440px) minmax(0, 1fr)",
          gap: 16,
          marginTop: 22,
          alignItems: "start",
        }}
      >
        {/* LEFT — the timer (capped width) */}
        <Card padding={28} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <div style={{ textAlign: "center", minHeight: 24 }}>
            {running ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>Now focusing</div>
                <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{runningLabel}</div>
              </>
            ) : current ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>Up next</div>
                <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{current.title}</div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Add a task to your queue to start a block.</div>
            )}
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmtMMSS(secondsLeft)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant={running ? "secondary" : "primary"} size="lg" disabled={!current && !running} onClick={toggleRun} leadingIcon={<Icon name={running ? "ClockProperty1Bold" : "TimerProperty1Bold"} size={18} />}>
              {running ? "Pause" : elapsedBeforePause === 0 ? "Start" : "Resume"}
            </Button>
            <Button variant="secondary" size="lg" onClick={reset} leadingIcon={<Icon name="ArrowLeftProperty1Linear" size={17} />}>Reset</Button>
            <Button variant="ghost" size="lg" disabled={running} onClick={() => bump(5)}>+5 min</Button>
            <Button variant="ghost" size="lg" disabled={running} onClick={() => bump(-5)}>-5 min</Button>
          </div>

          <div style={{ width: "100%", borderTop: "1px solid var(--border-soft)", paddingTop: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button variant="accent" size="md" disabled={!current} onClick={completeCurrent} leadingIcon={<Icon name="TickCircleProperty1Bold" size={17} />}>Complete task</Button>
              {voiceSupported && (
                <Button
                  variant={voiceListening ? "danger" : "secondary"}
                  size="md"
                  disabled={!current}
                  onClick={toggleVoice}
                  aria-label={voiceListening ? "Stop listening" : "Say “next” to complete the task"}
                  leadingIcon={voiceListening ? <Square className="h-4 w-4" fill="currentColor" /> : <Mic className="h-4 w-4" />}
                >
                  {voiceListening ? "Listening…" : "Say “next”"}
                </Button>
              )}
            </div>
            {voiceError && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--status-danger)", textAlign: "center" }}>
                {voiceError === "not-allowed" ? "Microphone access denied — allow it in your browser to use voice commands." : "Voice input hit a snag, try again."}
              </p>
            )}
          </div>
        </Card>

        {/* RIGHT — the prioritised queue (widest element) */}
        <Card padding={20}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Up next</h3>
            <Badge tone="neutral">{queuedTasks.length} queued</Badge>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {queuedTasks.length === 0 && (
              <div style={{ padding: "30px 16px", textAlign: "center" }}>
                <div style={{ display: "inline-flex", marginBottom: 10, color: "var(--border-strong)" }}>
                  <Icon name="TimerProperty1Linear" size={30} />
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Nothing queued yet. Open <b>Tasks</b> or a <b>Project</b> and tap the focus icon on the tasks you want to work on — they'll line up here.
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                  <Button variant="primary" size="sm" onClick={() => navigate("/tasks")} leadingIcon={<Icon name="TaskSquareProperty1Bold" size={15} />}>Go to Tasks</Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate("/projects")} leadingIcon={<Icon name="FolderProperty1Linear" size={15} />}>Projects</Button>
                </div>
              </div>
            )}
            {queuedTasks.map((t, i) => {
              const overdue = bucket(t.endsAt) === "overdue";
              const isCurrent = i === 0;
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: isCurrent ? "var(--primary-50)" : "var(--surface-card)", borderRadius: "var(--radius-md)", border: `1px solid ${isCurrent ? "var(--primary-400)" : "var(--border-soft)"}` }}>
                  <Checkbox checked={t.completed} onChange={() => toggleTask(t.id)} />
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                  {t.priority !== "none" && (
                    <span className="pf-hide-narrow">
                      <Badge tone={PRIORITY_TONE[t.priority]} dot>{t.priority}</Badge>
                    </span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: overdue ? "var(--red-500)" : "var(--text-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>
                    <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel(t.endsAt)}
                  </span>
                  <IconButton size="sm" variant="ghost" title="Remove from focus" onClick={() => removeFromQueue(t.id)} icon={<Icon name="CloseCircleProperty1Linear" size={16} />} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
