import { useCallback, useEffect, useState } from "react";
import { PF } from "./bootstrap";

/* eslint-disable @typescript-eslint/no-explicit-any */
const w = PF as any;
const D = w.PFData;
const NS = w.PeakFocusDesignSystem_2ecfec;

function QuickAddModal({ open, onClose, onAdd }: any) {
  if (!open) return null;
  const QuickAdd = w.QuickAdd;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(17,22,37,.42)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "14vh", backdropFilter: "blur(2px)" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "92vw", animation: "pf-pop .2s ease both" }}>
        <div style={{ marginBottom: 10, color: "#fff", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <NS.Icon name="AddProperty1Bold" size={16} /> Quick add — press Esc to close
        </div>
        <QuickAdd autoFocus onAdd={(t: any) => { onAdd(t); onClose(); }} placeholder="What needs doing?" />
      </div>
    </div>
  );
}

export default function ProtoApp({ onRoute }: { onRoute?: (r: string) => void } = {}) {
  const [route, setRoute] = useState("dashboard");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>(() => D.tasks.map((t: any) => ({ ...t })));
  const [integrations, setIntegrations] = useState<any[]>(() => D.integrations.map((i: any) => ({ ...i })));
  const [editTask, setEditTask] = useState<any>(null);
  const [projModal, setProjModal] = useState<any>(null);
  const [, setRev] = useState(0);
  const bump = () => setRev((v) => v + 1);
  const [focusQueue, setFocusQueue] = useState<any[]>(() => {
    const cand = D.tasks.filter((t: any) => !t.done && ["overdue", "today", "tomorrow"].includes(w.PFDate.bucket(t.due)));
    return cand.slice(0, 3).map((t: any) => ({ taskId: t.id, minutes: 25 }));
  });
  const [habits, setHabits] = useState<any[]>(() =>
    D.habits.map((h: any) => {
      let trail = 0;
      for (let i = D.todayIdx; i >= 0; i--) { if (h.week[i]) trail++; else break; }
      return { ...h, week: [...h.week], priorStreak: Math.max(0, h.streak - trail) };
    })
  );

  const toggleTask = useCallback((id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))), []);
  const addTask = useCallback((t: any) => setTasks((ts) => [{ id: "n" + ts.length + Math.round(performance.now()), name: t.name, project: t.project ?? null, priority: t.priority || "Medium", due: t.due ?? null, done: false }, ...ts]), []);
  const updateTask = useCallback((id: string, patch: any) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))), []);
  const moveTask = useCallback((id: string, status: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status, done: status === "done" } : t))), []);
  const deleteTask = useCallback((id: string) => { setTasks((ts) => ts.filter((t) => t.id !== id)); setFocusQueue((q) => q.filter((x) => x.taskId !== id)); }, []);

  const updateProject = (id: string, patch: any) => { const p = D.projects.find((x: any) => x.id === id); if (p) Object.assign(p, patch); bump(); };
  const addProject = (patch: any) => { D.projects.push({ id: "p" + Math.round(performance.now()), ...patch }); bump(); };
  const deleteProject = (id: string) => { const i = D.projects.findIndex((x: any) => x.id === id); if (i >= 0) D.projects.splice(i, 1); setTasks((ts) => ts.map((t) => (t.project === id ? { ...t, project: null } : t))); if (projectId === id) setRoute("projects"); bump(); };
  const saveProject = (id: string | null, patch: any) => { if (id) updateProject(id, patch); else addProject(patch); };

  const focusAdd = useCallback((taskId: string) => setFocusQueue((q) => (q.some((x) => x.taskId === taskId) ? q : [...q, { taskId, minutes: 25 }])), []);
  const focusRemove = useCallback((taskId: string) => setFocusQueue((q) => q.filter((x) => x.taskId !== taskId)), []);
  const focusMove = useCallback((taskId: string, dir: string) => setFocusQueue((q) => { const i = q.findIndex((x) => x.taskId === taskId); if (i < 0) return q; const j = dir === "up" ? i - 1 : i + 1; if (j < 0 || j >= q.length) return q; const n = q.slice(); const [it] = n.splice(i, 1); n.splice(j, 0, it); return n; }), []);
  const focusSetDuration = useCallback((taskId: string, minutes: number) => setFocusQueue((q) => q.map((x) => (x.taskId === taskId ? { ...x, minutes } : x))), []);
  const focusReorder = useCallback((from: number, to: number) => setFocusQueue((q) => { if (from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return q; const n = q.slice(); const [it] = n.splice(from, 1); n.splice(to, 0, it); return n; }), []);
  const toggleIntegration = useCallback((id: string) => setIntegrations((list) => list.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))), []);

  w.PFEditTask = setEditTask;
  w.PFUpdateTask = updateTask;
  w.PFMoveTask = moveTask;
  w.PFEditProject = (p: any) => setProjModal(p ? { mode: "edit", project: p } : { mode: "new" });
  w.PFUpdateProject = updateProject;
  w.PFFocus = { has: (id: string) => focusQueue.some((x) => x.taskId === id), add: focusAdd, remove: focusRemove };

  const toggleHabitDay = useCallback((id: string, day: number) => setHabits((hs) => hs.map((h) => {
    if (h.id !== id) return h;
    const week = h.week.map((v: boolean, i: number) => (i === day ? !v : v));
    let trail = 0;
    for (let i = D.todayIdx; i >= 0; i--) { if (week[i]) trail++; else break; }
    return { ...h, week, streak: h.priorStreak + trail };
  })), []);
  const toggleHabitToday = useCallback((id: string) => toggleHabitDay(id, D.todayIdx), [toggleHabitDay]);
  const updateHabit = useCallback((id: string, patch: any) => setHabits((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h))), []);
  const deleteHabit = useCallback((id: string) => setHabits((hs) => hs.filter((h) => h.id !== id)), []);
  const addHabit = useCallback(() => setHabits((hs) => [...hs, { id: "h" + Math.round(performance.now()), name: "New habit", icon: "StarProperty1Linear", streak: 0, priorStreak: 0, week: [false, false, false, false, false, false, false] }]), []);

  const openProject = (id: string) => { setProjectId(id); setRoute("project"); setNavOpen(false); };
  const goto = (k: string) => { setNavOpen(false); if (k === "signout") { onRoute?.("signout"); return; } setRoute(k); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickOpen(false);
      else if ((e.key === "n" || e.key === "N") && !/input|textarea/i.test((document.activeElement as HTMLElement).tagName)) { e.preventDefault(); setQuickOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [route]);

  const Sidebar = w.Sidebar;
  const PeakProgress = w.PeakProgress;
  const active = route === "project" ? "projects" : route;

  let screen: any = null;
  if (route === "dashboard") screen = <w.DashboardScreen tasks={tasks} habits={habits} onToggleTask={toggleTask} onOpenProject={openProject} onGoto={goto} />;
  else if (route === "today") screen = <w.TodayScreen tasks={tasks} habits={habits} onToggleTask={toggleTask} onAddTask={addTask} onToggleHabit={toggleHabitToday} onOpenProject={openProject} onGoto={goto} />;
  else if (route === "tasks") screen = <w.TasksScreen tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} onOpenProject={openProject} />;
  else if (route === "projects") screen = <w.ProjectsScreen tasks={tasks} onOpenProject={openProject} />;
  else if (route === "clients") screen = <w.ClientsScreen onOpenProject={openProject} onGoto={goto} />;
  else if (route === "people") screen = <w.PeopleScreen tasks={tasks} onGoto={goto} />;
  else if (route === "project") screen = <w.ProjectDetailScreen projectId={projectId} tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} onBack={() => setRoute("projects")} />;
  else if (route === "habits") screen = <w.HabitsScreen habits={habits} onToggleHabit={toggleHabitToday} onToggleHabitDay={toggleHabitDay} onRename={updateHabit} onDelete={deleteHabit} onAdd={addHabit} />;
  else if (route === "focus") screen = <w.FocusScreen tasks={tasks} focusQueue={focusQueue} onMove={focusMove} onReorder={focusReorder} onRemove={focusRemove} onSetDuration={focusSetDuration} onToggleTask={toggleTask} onGoto={goto} />;
  else if (route === "health") screen = <w.HealthScreen />;
  else if (route === "integrations") screen = <w.IntegrationsScreen integrations={integrations} onToggle={toggleIntegration} />;
  else screen = <w.TodayScreen tasks={tasks} habits={habits} onToggleTask={toggleTask} onAddTask={addTask} onToggleHabit={toggleHabitToday} onOpenProject={openProject} onGoto={goto} />;

  return (
    <div className="shell">
      <Sidebar active={active} open={navOpen} onNavigate={goto} onQuickAdd={() => { setQuickOpen(true); setNavOpen(false); }} />
      <div className={"sidebar-backdrop" + (navOpen ? " show" : "")} onClick={() => setNavOpen(false)} />
      <div className="main">
        <div className="mobile-topbar">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, flexShrink: 0, borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", color: "var(--text-primary)", cursor: "pointer" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <img src="/brand/peak-focus-logo-transparent.png" alt="Peak Focus" style={{ height: 24 }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Peak Focus</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => setQuickOpen(true)} aria-label="Quick add" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, flexShrink: 0, borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer" }}>
            <NS.Icon name="AddProperty1Bold" size={20} />
          </button>
        </div>
        <PeakProgress tasks={tasks} route={route} />
        <div className="scroll">
          <div key={route + projectId}>{screen}</div>
        </div>
      </div>
      <QuickAddModal open={quickOpen} onClose={() => setQuickOpen(false)} onAdd={addTask} />
      {editTask && <w.TaskEditModal task={editTask} onSave={updateTask} onDelete={deleteTask} onClose={() => setEditTask(null)} />}
      {projModal && <w.ProjectEditModal project={projModal.mode === "edit" ? projModal.project : null} onSave={saveProject} onDelete={deleteProject} onClose={() => setProjModal(null)} />}
    </div>
  );
}
