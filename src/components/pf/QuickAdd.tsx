import { useEffect, useRef, useState } from "react";
import { Icon } from "@/ds";
import { useTasks, type Priority } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { PRIORITY_LABEL, PRIORITY_TOKEN, DUE_PRESETS, dueFromPreset } from "./pf-helpers";

type Menu = "priority" | "project" | "due" | null;

export default function QuickAdd({
  defaultProjectId = null,
  autoFocus = false,
  placeholder = "Add a task…",
  onAdded,
}: {
  defaultProjectId?: string | null;
  autoFocus?: boolean;
  placeholder?: string;
  onAdded?: () => void;
}) {
  const { addTask } = useTasks();
  const { projects } = useProjects();
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Exclude<Priority, "none">>("medium");
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId);
  const [due, setDue] = useState<"today" | "tomorrow" | "week" | "none">("today");
  const [menu, setMenu] = useState<Menu>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (!menu) return;
    const h = () => setMenu(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [menu]);

  const project = projects.find((p) => p.id === projectId) || null;
  const projTag = { name: project?.name ?? "Chores", color: project?.color ?? "#8796AF" };
  const dueLabel = DUE_PRESETS.find(([k]) => k === due)?.[1] ?? "Someday";

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    await addTask({ title: n, projectId: projectId ?? undefined, priority, endsAt: dueFromPreset(due) });
    setName("");
    setMenu(null);
    inputRef.current?.focus();
    onAdded?.();
  };

  const pill = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 30,
    padding: "0 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-soft)",
    background: active ? "var(--surface-sunken)" : "var(--surface-card)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
  });
  const menuBox: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    zIndex: 20,
    background: "var(--surface-card)",
    border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    padding: 6,
    minWidth: 180,
    maxHeight: 280,
    overflowY: "auto",
  };
  const menuItem = (sel: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    color: "var(--text-primary)",
    background: sel ? "var(--surface-sunken)" : "transparent",
  });

  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "var(--radius-lg)",
        padding: 12,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: "var(--secondary-500)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="AddProperty1Bold" size={20} />
        </span>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={submit}
          disabled={!name.trim()}
          style={{
            height: 34,
            padding: "0 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: name.trim() ? "var(--primary-500)" : "var(--neutral-200)",
            color: name.trim() ? "#fff" : "var(--text-tertiary)",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 700,
            cursor: name.trim() ? "pointer" : "default",
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, paddingLeft: 44, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
        {/* priority */}
        <div style={{ position: "relative" }}>
          <div style={pill(menu === "priority")} onClick={() => setMenu(menu === "priority" ? null : "priority")}>
            <Icon name="FlagProperty1Bold" size={13} style={{ color: `var(${PRIORITY_TOKEN[priority]})` }} /> {PRIORITY_LABEL[priority]}
          </div>
          {menu === "priority" && (
            <div style={menuBox}>
              {(["high", "medium", "low"] as const).map((p) => (
                <div key={p} style={menuItem(p === priority)} onClick={() => { setPriority(p); setMenu(null); }}>
                  <Icon name="FlagProperty1Bold" size={14} style={{ color: `var(${PRIORITY_TOKEN[p]})` }} /> {PRIORITY_LABEL[p]}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* project */}
        <div style={{ position: "relative" }}>
          <div style={pill(menu === "project")} onClick={() => setMenu(menu === "project" ? null : "project")}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: projTag.color }} /> {projTag.name}
          </div>
          {menu === "project" && (
            <div style={menuBox}>
              <div style={menuItem(projectId === null)} onClick={() => { setProjectId(null); setMenu(null); }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8796AF" }} /> Chores
              </div>
              {projects.map((p) => (
                <div key={p.id} style={menuItem(projectId === p.id)} onClick={() => { setProjectId(p.id); setMenu(null); }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} /> {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* due */}
        <div style={{ position: "relative" }}>
          <div style={pill(menu === "due")} onClick={() => setMenu(menu === "due" ? null : "due")}>
            <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel}
          </div>
          {menu === "due" && (
            <div style={menuBox}>
              {DUE_PRESETS.map(([k, l]) => (
                <div key={k} style={menuItem(due === k)} onClick={() => { setDue(k); setMenu(null); }}>
                  <Icon name="CalendarProperty1Linear" size={14} style={{ color: "var(--text-tertiary)" }} /> {l}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
