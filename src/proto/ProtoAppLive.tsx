import { useCallback, useEffect, useMemo, useState } from "react";
import { PF } from "./bootstrap";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, type Priority, type Task } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { usePeople } from "@/hooks/use-people";
import { useHabits, startOfWeek, addDays, todayKey } from "@/hooks/use-habits";

/* eslint-disable @typescript-eslint/no-explicit-any */
const w = PF as any;
const NS = w.PeakFocusDesignSystem_2ecfec;

const CAP: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low", none: "Low" };
const LOWER: Record<string, Priority> = { High: "high", Medium: "medium", Low: "low" };
const CLIENT_TOKENS = ["--primary-500", "--secondary-500", "--green-600", "--yellow-500", "--red-500", "--primary-600"];
const HABIT_ICONS = ["SunProperty1Linear", "StarProperty1Linear", "NoteProperty1Linear", "TickCircleProperty1Linear", "MoonProperty1Linear"];

const d10 = (iso: string | null) => (iso ? iso.slice(0, 10) : null);

function QuickAddModal({ open, onClose, onAdd }: any) {
  if (!open) return null;
  const QuickAdd = w.QuickAdd;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(17,22,37,.42)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "14vh", backdropFilter: "blur(2px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "92vw", animation: "pf-pop .2s ease both" }}>
        <div style={{ marginBottom: 10, color: "#fff", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <NS.Icon name="AddProperty1Bold" size={16} /> Quick add — press Esc to close
        </div>
        <QuickAdd autoFocus onAdd={(t: any) => { onAdd(t); onClose(); }} placeholder="What needs doing?" />
      </div>
    </div>
  );
}

export default function ProtoAppLive() {
  const { user, signOut } = useAuth();
  const tasksH = useTasks();
  const projectsH = useProjects();
  const clientsH = useClients();
  const peopleH = usePeople();
  const habitsH = useHabits();

  const [route, setRoute] = useState("dashboard");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [projModal, setProjModal] = useState<any>(null);
  const [focusQueue, setFocusQueue] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>(() => (w.PFData.integrations || []).map((i: any) => ({ ...i })));

  const idToKey = useMemo(() => {
    const m: Record<string, string> = {};
    for (const h of habitsH.habits) m[h.id] = h.key;
    return m;
  }, [habitsH.habits]);

  // ── map live data → the exact PFData shapes the screens read ──
  const protoTasks = useMemo(
    () =>
      tasksH.tasks.map((t: Task) => ({
        id: t.id,
        name: t.title,
        project: t.projectId === "inbox" ? null : t.projectId,
        priority: CAP[t.priority],
        due: d10(t.endsAt),
        done: t.completed,
        status: t.status,
        start: d10(t.startsAt) ?? undefined,
        tag: t.tag || undefined,
      })),
    [tasksH.tasks]
  );

  const protoHabits = useMemo(
    () =>
      habitsH.habits.map((h, i) => ({
        id: h.id,
        key: h.key,
        name: h.label,
        emoji: h.emoji,
        icon: HABIT_ICONS[i % HABIT_ICONS.length],
        streak: habitsH.habitStreaks[h.key] ?? 0,
        priorStreak: 0,
        week: habitsH.weekGrids[h.key] ?? [false, false, false, false, false, false, false],
      })),
    [habitsH.habits, habitsH.habitStreaks, habitsH.weekGrids]
  );

  // Keep window.PFData populated so lookups (PFProject, Clients/People/Health) resolve.
  w.PF_TODAY = new Date();
  w.PFData.todayIdx = (new Date().getDay() + 6) % 7;
  w.PFData.user = {
    name: (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "You",
    role: "Founder",
  };
  w.PFData.tasks = protoTasks;
  w.PFData.habits = protoHabits;
  w.PFData.projects = projectsH.projects.map((p) => ({ id: p.id, name: p.name, customer: p.clientId, due: p.due }));
  w.PFData.customers = clientsH.clients.map((c, i) => ({
    id: c.id, name: c.name, initial: (c.name[0] || "?").toUpperCase(),
    color: CLIENT_TOKENS[i % CLIENT_TOKENS.length],
    website: c.website, contact: c.contactName, role: c.contactRole, email: c.email,
    location: c.location, stage: c.stage, health: c.health, arr: c.arr, renewal: c.renewal || "",
  }));
  w.PFData.team = peopleH.people.map((p) => ({ id: p.id, name: p.name, role: p.role, email: p.email, teamRole: p.teamRole }));

  // ── task handlers ──
  const toggleTask = useCallback((id: string) => tasksH.toggleTask(id), [tasksH]);
  const addTask = useCallback(
    (t: any) => tasksH.addTask({ title: t.name, projectId: t.project ?? undefined, priority: LOWER[t.priority] || "medium", endsAt: t.due ?? null }),
    [tasksH]
  );
  const updateTask = useCallback(
    (id: string, patch: any) => {
      const p: any = {};
      if (patch.name !== undefined) p.title = patch.name;
      if (patch.priority !== undefined) p.priority = LOWER[patch.priority] || "medium";
      if (patch.project !== undefined) p.projectId = patch.project === null ? "inbox" : patch.project;
      if (patch.due !== undefined) p.endsAt = patch.due;
      if (patch.status !== undefined) p.status = patch.status;
      if (patch.tag !== undefined) p.tag = patch.tag;
      tasksH.updateTaskFields(id, p);
    },
    [tasksH]
  );
  const moveTask = useCallback((id: string, status: any) => tasksH.setTaskStatus(id, status), [tasksH]);
  const deleteTask = useCallback((id: string) => { tasksH.removeTask(id); setFocusQueue((q) => q.filter((x) => x.taskId !== id)); }, [tasksH]);

  // ── project handlers ──
  const updateProject = useCallback((id: string, patch: any) => projectsH.updateProject(id, { name: patch.name, clientId: patch.customer, due: patch.due }), [projectsH]);
  const addProject = useCallback((patch: any) => projectsH.addProject({ name: patch.name, clientId: patch.customer ?? null, due: patch.due ?? null }), [projectsH]);
  const deleteProject = useCallback((id: string) => { projectsH.removeProject(id); if (projectId === id) setRoute("projects"); }, [projectsH, projectId]);
  const saveProject = useCallback((id: string | null, patch: any) => { if (id) updateProject(id, patch); else addProject(patch); }, [updateProject, addProject]);

  // ── focus queue (client-side) ──
  const focusAdd = useCallback((taskId: string) => setFocusQueue((q) => (q.some((x) => x.taskId === taskId) ? q : [...q, { taskId, minutes: 25 }])), []);
  const focusRemove = useCallback((taskId: string) => setFocusQueue((q) => q.filter((x) => x.taskId !== taskId)), []);
  const focusMove = useCallback((taskId: string, dir: string) => setFocusQueue((q) => { const i = q.findIndex((x) => x.taskId === taskId); if (i < 0) return q; const j = dir === "up" ? i - 1 : i + 1; if (j < 0 || j >= q.length) return q; const n = q.slice(); const [it] = n.splice(i, 1); n.splice(j, 0, it); return n; }), []);
  const focusSetDuration = useCallback((taskId: string, minutes: number) => setFocusQueue((q) => q.map((x) => (x.taskId === taskId ? { ...x, minutes } : x))), []);
  const focusReorder = useCallback((from: number, to: number) => setFocusQueue((q) => { if (from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return q; const n = q.slice(); const [it] = n.splice(from, 1); n.splice(to, 0, it); return n; }), []);
  const toggleIntegration = useCallback((id: string) => setIntegrations((list) => list.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))), []);

  // ── habit handlers (map prototype id-based calls → key-based hooks) ──
  const toggleHabitToday = useCallback((id: string) => { const key = idToKey[id]; if (key) habitsH.toggleHabit(key); }, [idToKey, habitsH]);
  const toggleHabitDay = useCallback((id: string, day: number) => {
    const key = idToKey[id];
    if (!key) return;
    const date = todayKey(addDays(startOfWeek(new Date()), day));
    const current = habitsH.weekGrids[key]?.[day] ?? false;
    habitsH.setHabitDay(key, date, !current);
  }, [idToKey, habitsH]);
  const updateHabit = useCallback((id: string, patch: any) => { const key = idToKey[id]; if (key) habitsH.updateHabitFields(key, { label: patch.name, emoji: patch.emoji }); }, [idToKey, habitsH]);
  const deleteHabit = useCallback((id: string) => { const key = idToKey[id]; if (key) habitsH.removeHabit(key); }, [idToKey, habitsH]);
  const addHabit = useCallback(() => habitsH.addHabit("New habit", "⭐", 3), [habitsH]);

  // expose the without-prop-drilling handles the screens/rows use
  w.PFEditTask = setEditTask;
  w.PFUpdateTask = updateTask;
  w.PFMoveTask = moveTask;
  w.PFEditProject = (p: any) => setProjModal(p ? { mode: "edit", project: p } : { mode: "new" });
  w.PFUpdateProject = updateProject;
  w.PFFocus = { has: (id: string) => focusQueue.some((x) => x.taskId === id), add: focusAdd, remove: focusRemove };

  const openProject = (id: string) => { setProjectId(id); setRoute("project"); setNavOpen(false); };
  const goto = (k: string) => { setNavOpen(false); if (k === "signout") { void signOut(); return; } setRoute(k); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickOpen(false);
      else if ((e.key === "n" || e.key === "N") && !/input|textarea/i.test((document.activeElement as HTMLElement).tagName)) { e.preventDefault(); setQuickOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Sidebar = w.Sidebar;
  const PeakProgress = w.PeakProgress;
  const active = route === "project" ? "projects" : route;

  let screen: any = null;
  if (route === "dashboard") screen = <w.DashboardScreen tasks={protoTasks} habits={protoHabits} onToggleTask={toggleTask} onOpenProject={openProject} onGoto={goto} />;
  else if (route === "today") screen = <w.TodayScreen tasks={protoTasks} habits={protoHabits} onToggleTask={toggleTask} onAddTask={addTask} onToggleHabit={toggleHabitToday} onOpenProject={openProject} onGoto={goto} />;
  else if (route === "tasks") screen = <w.TasksScreen tasks={protoTasks} onToggleTask={toggleTask} onAddTask={addTask} onOpenProject={openProject} />;
  else if (route === "projects") screen = <w.ProjectsScreen tasks={protoTasks} onOpenProject={openProject} />;
  else if (route === "clients") screen = <w.ClientsScreen onOpenProject={openProject} onGoto={goto} />;
  else if (route === "people") screen = <w.PeopleScreen tasks={protoTasks} onGoto={goto} />;
  else if (route === "project") screen = <w.ProjectDetailScreen projectId={projectId} tasks={protoTasks} onToggleTask={toggleTask} onAddTask={addTask} onBack={() => setRoute("projects")} />;
  else if (route === "habits") screen = <w.HabitsScreen habits={protoHabits} onToggleHabit={toggleHabitToday} onToggleHabitDay={toggleHabitDay} onRename={updateHabit} onDelete={deleteHabit} onAdd={addHabit} />;
  else if (route === "focus") screen = <w.FocusScreen tasks={protoTasks} focusQueue={focusQueue} onMove={focusMove} onReorder={focusReorder} onRemove={focusRemove} onSetDuration={focusSetDuration} onToggleTask={toggleTask} onGoto={goto} />;
  else if (route === "health") screen = <w.HealthScreen />;
  else if (route === "integrations") screen = <w.IntegrationsScreen integrations={integrations} onToggle={toggleIntegration} />;
  else screen = <w.DashboardScreen tasks={protoTasks} habits={protoHabits} onToggleTask={toggleTask} onOpenProject={openProject} onGoto={goto} />;

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
        <PeakProgress tasks={protoTasks} route={route} />
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
