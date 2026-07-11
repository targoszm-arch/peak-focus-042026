import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, ProgressBar, AvatarGroup } from "@/ds";
import { useProjects, type ProjectFull } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useTasks, INBOX_ID, type Task } from "@/hooks/use-tasks";
import { usePeople } from "@/hooks/use-people";
import { label as dueLabel, bucket } from "@/lib/pfdate";
import { ProjectEditModal, TaskEditModal } from "@/components/pf/modals";
import { KanbanView, TimelineView, CalendarView } from "@/components/pf/ProjectViews";

/* Projects — grouped directory (Favourites · My Projects · Finished) with
   search, star-to-favourite, and Board / Timeline / Calendar views across all
   project tasks. Ported from the design system's ProjectsScreen. */

type ViewKey = "list" | "board" | "timeline" | "calendar";
const VIEW_KEY = "pf.projects.view";
const STAR_KEY = "pf.projects.starred";
const COL_KEY = "pf.projects.collapsed";

const SECTIONS = {
  visible: { tint: "var(--primary-500)", strong: "var(--primary-700, #1D50AF)", icon: "FolderProperty1Bold", label: "My Projects" },
  favourites: { tint: "var(--yellow-500, #E6A609)", strong: "#B47D06", icon: "StarProperty1Bold", label: "Favourites" },
  finished: { tint: "var(--green-600, #2A9E75)", strong: "#1F7757", icon: "TickCircleProperty1Bold", label: "Finished" },
} as const;
type SectionKey = keyof typeof SECTIONS;

export default function Projects() {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { clients } = useClients();
  const { rootTasks, projectStats, assigneesByTask } = useTasks();
  const { people } = usePeople();

  const [view, setView] = useState<ViewKey>(() => {
    try { return (localStorage.getItem(VIEW_KEY) as ViewKey) || "list"; } catch { return "list"; }
  });
  const setV = (v: ViewKey) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ } };

  const [starred, setStarred] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STAR_KEY) || "[]")); } catch { return new Set(); }
  });
  const toggleStar = (id: string) =>
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(STAR_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(COL_KEY) || "{}"); } catch { return {}; }
  });
  const toggleSec = (k: SectionKey) =>
    setCollapsed((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      try { localStorage.setItem(COL_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>(() => {
    try { return localStorage.getItem("pf.projects.client") || ""; } catch { return ""; }
  });
  const setCF = (v: string) => { setClientFilter(v); try { localStorage.setItem("pf.projects.client", v); } catch { /* ignore */ } };
  const [sortKey, setSortKey] = useState<string>(() => {
    try { return localStorage.getItem("pf.projects.sort") || "name"; } catch { return "name"; }
  });
  const setSort = (v: string) => { setSortKey(v); try { localStorage.setItem("pf.projects.sort", v); } catch { /* ignore */ } };
  const [projModal, setProjModal] = useState<{ project: ProjectFull | null } | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const projectTasks = useMemo(() => rootTasks.filter((t) => t.projectId !== INBOX_ID), [rootTasks]);

  const stat = (pid: string) => {
    const s = projectStats[pid] ?? { total: 0, completed: 0, remaining: 0 };
    const pct = s.total ? Math.round((s.completed / s.total) * 100) : 0;
    const list = projectTasks.filter((t) => t.projectId === pid);
    const openDue = list.filter((t) => !t.completed && ["overdue", "today"].includes(bucket(t.endsAt))).length;
    const ids = new Set<string>();
    for (const t of list) for (const a of assigneesByTask[t.id] ?? []) ids.add(a);
    const team = people.filter((p) => ids.has(p.id));
    return { ...s, pct, openDue, team };
  };

  const q = query.trim().toLowerCase();
  const matchClient = (p: ProjectFull) =>
    !clientFilter ||
    (clientFilter === "__none" ? !p.clientId : p.clientId === clientFilter);
  const match = (p: ProjectFull) =>
    matchClient(p) &&
    (!q ||
      p.name.toLowerCase().includes(q) ||
      (clientById.get(p.clientId ?? "")?.name ?? "").toLowerCase().includes(q));

  const clientNameOf = (p: ProjectFull) => clientById.get(p.clientId ?? "")?.name ?? "￿";
  // Each project's most urgent open task (high=0 … none=3) so the List can sort
  // by priority even though projects have no priority field of their own.
  const PRIO_RANK: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
  const projPrio: Record<string, number> = {};
  for (const t of projectTasks) {
    if (t.completed) continue;
    const r = PRIO_RANK[t.priority] ?? 3;
    if (projPrio[t.projectId] === undefined || r < projPrio[t.projectId]) projPrio[t.projectId] = r;
  }
  const withStat = projects.map((p) => ({ ...p, s: stat(p.id) })).sort((a, b) => {
    if (sortKey === "client") return clientNameOf(a).localeCompare(clientNameOf(b)) || a.name.localeCompare(b.name);
    if (sortKey === "due") return (a.due ?? "9999-99").localeCompare(b.due ?? "9999-99") || a.name.localeCompare(b.name);
    if (sortKey === "priority") return (projPrio[a.id] ?? 3) - (projPrio[b.id] ?? 3) || a.name.localeCompare(b.name);
    if (sortKey === "created") return b.createdAt - a.createdAt || a.name.localeCompare(b.name);
    if (sortKey === "progress") return b.s.pct - a.s.pct || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
  const finished = withStat.filter((p) => ((p.s.total > 0 && p.s.pct === 100) || p.status === "done") && match(p));
  const finishedIds = new Set(finished.map((p) => p.id));
  const visible = withStat.filter((p) => !finishedIds.has(p.id) && match(p));
  const favourites = visible.filter((p) => starred.has(p.id));

  // Board/Timeline/Calendar don't have their own project rows to filter — apply
  // the same search here so switching views doesn't make the search box go dead.
  const matchingProjectIds = new Set(projects.filter(match).map((p) => p.id));
  const searchedProjectTasks =
    q || clientFilter ? projectTasks.filter((t) => matchingProjectIds.has(t.projectId)) : projectTasks;

  const projectCard = (p: (typeof withStat)[number], sec: SectionKey) => {
    const c = clientById.get(p.clientId ?? "");
    const color = c?.color ?? p.color;
    const s = p.s;
    const isStar = starred.has(p.id);
    const cfg = SECTIONS[sec];
    return (
      <button
        key={sec + "-" + p.id}
        onClick={() => navigate(`/projects/${p.id}`)}
        style={{
          display: "flex", flexDirection: "column", gap: 10, textAlign: "left",
          cursor: "pointer", padding: "13px 14px", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-soft)", background: "var(--surface-card)",
          transition: "background .13s, border-color .13s, box-shadow .13s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${cfg.tint} 6%, white)`; e.currentTarget.style.borderColor = `color-mix(in srgb, ${cfg.tint} 30%, var(--border-strong))`; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-card)"; e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${color} 15%, white)`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 800 }}>
            {(c?.name ?? p.name).slice(0, 1).toUpperCase()}
          </span>
          <span style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c?.name ?? "No client"}</span>
          </span>
          <span
            role="button"
            title={isStar ? "Remove from favourites" : "Add to favourites"}
            onClick={(e) => { e.stopPropagation(); toggleStar(p.id); }}
            style={{ flexShrink: 0, width: 36, height: 36, margin: "-6px -6px -6px 0", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isStar ? "var(--yellow-500, #E6A609)" : "var(--text-tertiary)" }}
          >
            <Icon name={isStar ? "StarProperty1Bold" : "StarProperty1Linear"} size={18} />
          </span>
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>
            <span>{s.completed}/{s.total}</span>
            <span>{s.pct}%</span>
          </span>
          <ProgressBar value={s.pct} height={6} tone={s.pct === 100 ? "success" : "primary"} />
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: s.openDue > 0 ? "var(--red-500)" : "var(--text-tertiary)" }}>
            <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel(p.due)}
          </span>
          <span style={{ flex: 1 }} />
          {s.team.length > 0 && <AvatarGroup users={s.team.map((a) => ({ name: a.name }))} size={22} max={3} />}
        </span>
      </button>
    );
  };

  const section = (key: SectionKey, list: typeof withStat, emptyText: string) => {
    const cfg = SECTIONS[key];
    const isCollapsed = !!collapsed[key];
    return (
      <div style={{
        borderRadius: "var(--radius-xl)", padding: 8,
        border: `1px solid color-mix(in srgb, ${cfg.tint} 18%, var(--border-soft))`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${cfg.tint} 6%, white) 0%, var(--surface-card) 70%)`,
      }}>
        <button onClick={() => toggleSec(key)} aria-expanded={!isCollapsed} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 10, padding: "7px 8px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <Icon name={cfg.icon} size={17} style={{ color: cfg.tint }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{cfg.label}</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
            <span style={{ minWidth: 26, height: 21, padding: "0 7px", borderRadius: "var(--radius-full)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: cfg.strong, border: `1px solid color-mix(in srgb, ${cfg.tint} 30%, white)`, background: `color-mix(in srgb, ${cfg.tint} 13%, white)` }}>{list.length}</span>
            <Icon name="ArrowDownProperty1Linear" size={15} style={{ color: "var(--text-tertiary)", transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform .2s" }} />
          </span>
        </button>
        {!isCollapsed && (
          <div style={{ display: list.length > 0 ? "grid" : "block", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 8, marginTop: 4, padding: 4 }}>
            {list.length > 0
              ? list.map((p) => projectCard(p, key))
              : <div style={{ padding: "10px 12px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)" }}>{emptyText}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Projects</h1>
          <p style={{ margin: "5px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)" }}>
            {projects.length} project{projects.length === 1 ? "" : "s"} across {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        <button onClick={() => setProjModal({ project: null })} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
          <Icon name="AddProperty1Bold" size={17} /> New project
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 42, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", flex: "1 1 240px", minWidth: 0 }}>
          <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for a project or client" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-primary)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 12px 0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: clientFilter ? "color-mix(in srgb, var(--primary-500) 8%, white)" : "var(--surface-card)", flexShrink: 0 }}>
          <Icon name="CategoryProperty1Linear" size={16} style={{ color: clientFilter ? "var(--primary-500)" : "var(--text-tertiary)", flexShrink: 0 }} />
          <select value={clientFilter} onChange={(e) => setCF(e.target.value)} aria-label="Filter by client" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__none">No client</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 12px 0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", flexShrink: 0 }}>
          <Icon name="ArrowDownProperty1Linear" size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <select value={sortKey} onChange={(e) => setSort(e.target.value)} aria-label="Sort projects" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
            <option value="due">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
            <option value="client">Sort: Client</option>
            <option value="created">Sort: Newest</option>
            <option value="progress">Sort: Progress</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: 4, background: "var(--surface-sunken, var(--surface-page))", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", alignSelf: "flex-start", flexWrap: "wrap" }}>
        {([["list", "List", "FolderProperty1Linear"], ["board", "Board", "Element3Property1Linear"], ["timeline", "Timeline", "ChartProperty1Linear"], ["calendar", "Calendar", "CalendarProperty1Linear"]] as [ViewKey, string, string][]).map(([k, l, ic]) => (
          <button key={k} onClick={() => setV(k)} style={{
            display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 13px",
            borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
            background: view === k ? "var(--surface-card)" : "transparent",
            color: view === k ? "var(--text-primary)" : "var(--text-secondary)",
            boxShadow: view === k ? "var(--shadow-sm)" : "none",
            transition: "background .12s, color .12s",
          }}>
            <Icon name={ic} size={15} /> {l}
          </button>
        ))}
      </div>

      {view === "board" && <KanbanView tasks={searchedProjectTasks} onOpen={setEditTask} sortKey={sortKey} />}
      {view === "timeline" && <TimelineView tasks={searchedProjectTasks} onOpen={setEditTask} sortKey={sortKey} />}
      {view === "calendar" && <CalendarView tasks={searchedProjectTasks} onOpen={setEditTask} />}

      {view === "list" && (
        <>
          {section("favourites", favourites, "No starred projects yet — tap the star on any project.")}
          {section("visible", visible, q ? "No projects match this search." : "No active projects — create your first one above.")}
          {section("finished", finished, "No finished projects yet.")}
        </>
      )}

      {projModal && <ProjectEditModal project={projModal.project} onClose={() => setProjModal(null)} />}
      {editTask && <TaskEditModal task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  );
}
