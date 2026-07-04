import { useMemo, useState } from "react";
import { Card, Button, Icon, Badge, ProgressBar, Input } from "@/ds";
import { useHabits, type Habit, type DailyEntry } from "@/hooks/use-habits";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeekStrip({
  habitKey,
  last7Days,
  onToggleDay,
}: {
  habitKey: string;
  last7Days: DailyEntry[];
  onToggleDay: (date: string) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {last7Days.map((day, i) => {
        const done = !!day?.habits?.[habitKey];
        const date = day?.date;
        return (
          <div key={date ?? i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--text-tertiary)",
                lineHeight: 1,
              }}
            >
              {WEEKDAYS[i]}
            </span>
            <button
              onClick={() => date && onToggleDay(date)}
              disabled={!date}
              aria-pressed={done}
              aria-label={`${WEEKDAYS[i]} — ${done ? "done" : "not done"}`}
              style={{
                width: "100%",
                maxWidth: 40,
                aspectRatio: "1",
                borderRadius: "50%",
                background: done ? "var(--primary-500)" : "transparent",
                border: done ? "1.5px solid var(--primary-500)" : "1.5px solid var(--border-strong)",
                cursor: date ? "pointer" : "default",
                padding: 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function HabitRow({
  habit,
  weeklyCount,
  done,
  last7Days,
  onToggle,
  onToggleDay,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  habit: Habit;
  weeklyCount: number;
  done: boolean;
  last7Days: DailyEntry[];
  onToggle: () => void;
  onToggleDay: (date: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const target = habit.weeklyTarget || 1;
  const pct = Math.round((Math.min(weeklyCount, target) / target) * 100);
  const reorderBtn = (enabled: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 24, height: 20, border: "none", background: "transparent", padding: 0,
    color: enabled ? "var(--text-tertiary)" : "var(--border-soft)",
    cursor: enabled ? "pointer" : "default",
  });
  return (
    <Card padding={16}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <button onClick={onMoveUp} disabled={!canMoveUp} title="Move up" style={reorderBtn(canMoveUp)}>
            <Icon name="ArrowUpProperty1Linear" size={14} />
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown} title="Move down" style={reorderBtn(canMoveDown)}>
            <Icon name="ArrowDownProperty1Linear" size={14} />
          </button>
        </div>
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{habit.emoji}</span>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            flex: 1,
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {habit.label}
        </span>

        <button
          onClick={onToggle}
          aria-pressed={done}
          title={done ? "Done today" : "Mark done today"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 34,
            padding: "0 12px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${done ? "var(--primary-500)" : "var(--border-soft)"}`,
            background: done ? "var(--primary-50)" : "var(--surface-card)",
            color: done ? "var(--primary-600)" : "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span style={{ color: done ? "var(--primary-500)" : "var(--border-strong)", display: "inline-flex" }}>
            <Icon name="TickCircleProperty1Bold" size={18} />
          </span>
          {done ? "Done today" : "Mark done"}
        </button>

        <button
          onClick={onRemove}
          title="Remove habit"
          aria-label={`Remove ${habit.label}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-soft)",
            background: "var(--surface-card)",
            color: "var(--text-tertiary)",
            cursor: "pointer",
          }}
        >
          <Icon name="TrashProperty1Linear" size={16} />
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <ProgressBar value={pct} tone="primary" label={`${weeklyCount}/${target} this week`} />
      </div>

      <div style={{ marginTop: 10 }}>
        <WeekStrip habitKey={habit.key} last7Days={last7Days} onToggleDay={onToggleDay} />
      </div>
    </Card>
  );
}

const HABITS_ORDER_KEY = "pf.habits.order.v1";

export default function Habits() {
  const {
    habits,
    todayEntry,
    weeklyCounts,
    currentStreak,
    last7Days,
    toggleHabit,
    addHabit,
    removeHabit,
  } = useHabits();

  // Client-side order (persisted locally) — drag-and-drop isn't reliable on
  // iOS Safari (no HTML5 DnD touch support), so reordering is via up/down
  // buttons instead, which work identically on desktop and mobile.
  const [order, setOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HABITS_ORDER_KEY) || "[]"); } catch { return []; }
  });
  const orderedHabits = useMemo(() => {
    const known = new Set(order);
    const ids = [...order.filter((id) => habits.some((h) => h.id === id)), ...habits.filter((h) => !known.has(h.id)).map((h) => h.id)];
    return ids.map((id) => habits.find((h) => h.id === id)!).filter(Boolean);
  }, [habits, order]);
  const moveHabit = (id: string, delta: number) => {
    const ids = orderedHabits.map((h) => h.id);
    const i = ids.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setOrder(ids);
    try { localStorage.setItem(HABITS_ORDER_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  };

  const [showForm, setShowForm] = useState(false);
  const [emoji, setEmoji] = useState("✨");
  const [label, setLabel] = useState("");
  const [target, setTarget] = useState(3);

  const resetForm = () => {
    setEmoji("✨");
    setLabel("");
    setTarget(3);
  };

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const wt = Math.max(1, Math.min(7, Number(target) || 1));
    void addHabit(trimmed, emoji.trim() || "✨", wt);
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Habits</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge tone="primary" dot>
            {currentStreak}d streak
          </Badge>
          <Button
            variant="accent"
            size="sm"
            leadingIcon={<Icon name="AddProperty1Bold" size={16} />}
            onClick={() => setShowForm((v) => !v)}
          >
            Add habit
          </Button>
        </div>
      </div>

      {/* inline add form */}
      {showForm && (
        <Card padding={16} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ width: 64 }}>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                aria-label="Emoji"
                style={{ textAlign: "center" }}
              />
            </div>
            <div style={{ flex: "1 1 220px", minWidth: 160 }}>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="What would you like to build? e.g. Read 10 pages"
                aria-label="Habit name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                Weekly target
              </span>
              <div style={{ width: 72 }}>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  aria-label="Weekly target"
                />
              </div>
            </div>
            <Button variant="primary" size="md" onClick={submit} disabled={!label.trim()}>
              Add
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* body */}
      <style>{`.pf-habits-grid{display:grid;grid-template-columns:1fr;gap:12px;} @media (min-width:800px){ .pf-habits-grid{grid-template-columns:1fr 1fr;} }`}</style>
      {habits.length === 0 && (
        <Card padding={28} style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 14, marginTop: 16 }}>
          No habits yet — add one to start a streak.
        </Card>
      )}
      <div className="pf-habits-grid" style={{ marginTop: 16 }}>
        {orderedHabits.map((h, i) => (
          <HabitRow
            key={h.id}
            habit={h}
            weeklyCount={weeklyCounts[h.key] ?? 0}
            done={!!todayEntry.habits[h.key]}
            last7Days={last7Days}
            onToggle={() => toggleHabit(h.key)}
            onToggleDay={(date) => toggleHabit(h.key, date)}
            onRemove={() => removeHabit(h.key)}
            onMoveUp={() => moveHabit(h.id, -1)}
            onMoveDown={() => moveHabit(h.id, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < orderedHabits.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
