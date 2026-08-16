import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, ProgressBar, AvatarGroup } from "@/ds";
import { useProjects, type ProjectFull } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useTasks, INBOX_ID } from "@/hooks/use-tasks";
import { usePeople } from "@/hooks/use-people";
import { useAccess } from "@/hooks/use-access";
import { label as dueLabel, bucket } from "@/lib/pfdate";
import { ProjectEditModal } from "@/components/pf/modals";

/* Projects — the project directory (Favourites · My Projects · Finished),
   plus Board / Timeline / Calendar views of the *projects themselves*
   (never tasks — task-level views live on the Tasks screen instead, so
   switching a view here never turns this screen into a disguised task
   list). Ported from the design system's ProjectsScreen. */

type ViewKey = "list" | "board" | "timeline" | "calendar";
const VIEW_KEY = "pf.projects.view";
const STAR_KEY = "pf.projects.starred";
const COL_KEY = "pf.projects.collapsed";

const PROGRESS_COLUMNS = [
  { key: "not_started", label: "Not started", dot: "var(--neutral-400, #9aa3b2)" },
  { key: "in_progress", label: "In progress", dot: "var(--primary-500)" },
  { key: "finished", label: "Finished", dot: "var(--green-600, #2A9E75)" },
] as const;
type ProgressColumn = (typeof PROGRESS_COLUMNS)[number]["key"];

function progressColumnOf(p: { status: string; s: { pct: number } }): ProgressColumn {
  if (p.status === "done" || p.s.pct === 100) return "finished";
  if (p.s.pct > 0) return "in_progress";
  return "not_started";
}

const SECTIONS = {
  visible: { tint: "var(--primary-500)", strong: "var(--primary-700, #1D50AF)", icon: "FolderProperty1Bold", label: "My Projects" },
  favourites: { tint: "var(--yellow-500, #E6A609)", strong: "#B47D06", icon: "StarProperty1Bold", label: "Favourites" },
  finished: { tint: "var(--green-600, #2A9E75)", strong: "#1F7757", icon: "TickCircleProperty1Bold", label: "Finished" },
} as const;
type SectionKey = keyof typeof SECTIONS;

export default function Projects() {
  const navigate = useNavigate();
  const { isOwner } = useAccess();
  // Does this account have its own workspace at all (creating projects).
  // Per-project edit rights are separate — the same account can own some
  // projects and be a view-only collaborator on others at the same time.
  const canEdit = isOwner === true;
  const { projects } = useProjects();
  const { clients } = useClients();
  const { rootTasks, projectStats, assigneesByTask } = useTasks();
  const { people } = usePeople();

  const [view, setView] = useState<ViewKey>(() => {
    try { return (localStorage.getItem(VIEW_KEY) as ViewKey) || "list"; } catch { return "list"; }
  });
  const setV = (v: ViewKey) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ } };
  const [calMonth, setCalMonth] = useState(() => new Date());

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
  const [projectFilter, setProjectFilter] = useState<string>(() => {
    try { return localStorage.getItem("pf.projects.project") || ""; } catch { return ""; }
  });
  const setPF = (v: string) => { setProjectFilter(v); try { localStorage.setItem("pf.projects.project", v); } catch { /* ignore */ } };
  const [sortKey, setSortKey] = useState<string>(() => {
    try { return localStorage.getItem("pf.projects.sort") || "name"; } catch { return "name"; }
  });
  const setSort = (v: string) => { setSortKey(v); try { localStorage.setItem("pf.projects.sort", v); } catch { /* ignore */ } };
  const [projModal, setProjModal] = useState<{ project: ProjectFull | null } | null>(null);

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
    (!projectFilter || p.id === projectFilter) &&
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
  // Board/Timeline/Calendar show every matching project regardless of the
  // Favourites/My Projects/Finished split — that grouping is a List-only lens.
  const filteredForViews = withStat.filter(match);

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

  const boardView = (
    <div className="pf-hscroll" style={{ overflowX: "auto", paddingBottom: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${PROGRESS_COLUMNS.length}, minmax(260px, 1fr))`, gap: 14, minWidth: 0 }}>
        {PROGRESS_COLUMNS.map((col) => {
          const items = filteredForViews.filter((p) => progressColumnOf(p) === col.key);
          return (
            <div key={col.key} style={{ display: "flex", flexDirection: "column", gap: 10, padding: 10, borderRadius: "var(--radius-lg)", background: "var(--surface-page)", minHeight: 120 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.dot }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{col.label}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", background: "var(--surface-card)", borderRadius: "var(--radius-full)", minWidth: 22, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {items.map((p) => projectCard(p, "visible"))}
                {items.length === 0 && (
                  <div style={{ padding: "18px 10px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-tertiary)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-md)" }}>
                    No projects here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Timeline (gantt) — one bar per project, from when it was created to
  // its due date (or a single-day marker at creation when there's no due). ──
  const dayMs = 86400000;
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const parseDay = (iso: string | null): Date | null => {
    if (!iso) return null;
    const d = iso.length <= 10 ? new Date(iso + "T00:00:00") : new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };
  const timelineRows = filteredForViews.map((p) => {
    const start = startOfDay(new Date(p.createdAt));
    const due = parseDay(p.due);
    const end = due && due >= start ? startOfDay(due) : start;
    return { p, start, end };
  });
  const now = startOfDay(new Date());
  const timelineView = (() => {
    if (timelineRows.length === 0) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--surface-card)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-lg)" }}>
          No projects match these filters.
        </div>
      );
    }
    let min = timelineRows[0].start, max = timelineRows[0].end;
    for (const r of timelineRows) {
      if (r.start < min) min = r.start;
      if (r.end > max) max = r.end;
    }
    min = new Date(min.getTime() - dayMs);
    max = new Date(max.getTime() + dayMs);
    const spanDays = Math.round((max.getTime() - min.getTime()) / dayMs) + 1;
    const days = Array.from({ length: spanDays }, (_, i) => new Date(min.getTime() + i * dayMs));
    const dayW = 42, rowH = 44, labelW = 240;
    const todayIdx = Math.round((now.getTime() - min.getTime()) / dayMs);
    const monthGroups: { key: string; label: string; startIdx: number; span: number }[] = [];
    days.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const last = monthGroups[monthGroups.length - 1];
      if (last && last.key === key) last.span += 1;
      else monthGroups.push({ key, label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }), startIdx: i, span: 1 });
    });
    const stickyLabelCell: React.CSSProperties = { position: "sticky", left: 0, zIndex: 3, background: "var(--surface-card)" };
    return (
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: `max(100%, ${labelW + spanDays * dayW}px)`, position: "relative" }}>
            <div style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div style={{ display: "flex", borderBottom: "1px solid var(--border-soft)" }}>
                <div style={{ ...stickyLabelCell, width: labelW, flexShrink: 0, borderRight: "1px solid var(--border-soft)" }} />
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${spanDays}, minmax(${dayW}px, 1fr))`, flex: 1, minWidth: 0 }}>
                  {monthGroups.map((g) => (
                    <div key={g.key} style={{ gridColumn: `${g.startIdx + 1} / span ${g.span}`, padding: "6px 10px", borderLeft: g.startIdx > 0 ? "1px solid var(--border-soft)" : "none", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 800, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {g.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex" }}>
                <div style={{ ...stickyLabelCell, width: labelW, flexShrink: 0, padding: "10px 16px", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", borderRight: "1px solid var(--border-soft)" }}>Project</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${spanDays}, minmax(${dayW}px, 1fr))`, flex: 1, minWidth: 0 }}>
                  {days.map((d, i) => {
                    const isToday = i === todayIdx;
                    const weekend = [0, 6].includes(d.getDay());
                    return (
                      <div key={i} style={{ minWidth: dayW, textAlign: "center", padding: "7px 0", background: weekend ? "var(--surface-page)" : "transparent" }}>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700, color: isToday ? "var(--primary-500)" : "var(--text-tertiary)", textTransform: "uppercase" }}>{d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}</div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--primary-500)" : "var(--text-secondary)" }}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              {todayIdx >= 0 && todayIdx < spanDays && (
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(${labelW}px + ((100% - ${labelW}px) / ${spanDays}) * ${todayIdx + 0.5})`, width: 2, background: "color-mix(in srgb, var(--primary-500) 55%, transparent)", zIndex: 1, pointerEvents: "none" }} />
              )}
              {timelineRows.map(({ p, start, end }) => {
                const startIndex = Math.round((start.getTime() - min.getTime()) / dayMs);
                const duration = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
                const c = clientById.get(p.clientId ?? "");
                const col = c?.color ?? p.color;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", height: rowH, borderBottom: "1px solid var(--border-soft)" }}>
                    <div onClick={() => navigate(`/projects/${p.id}`)} title="Open project" style={{ ...stickyLabelCell, width: labelW, flexShrink: 0, padding: "0 16px", borderRight: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 7, height: "100%", cursor: "pointer" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{p.name}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700, color: col, background: `color-mix(in srgb, ${col} 12%, white)`, borderRadius: "var(--radius-full)", padding: "2px 6px", flexShrink: 0 }}>{p.s.pct}%</span>
                    </div>
                    <div style={{ position: "relative", height: "100%", flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: `repeat(${spanDays}, minmax(${dayW}px, 1fr))`, alignItems: "center" }}>
                      <div
                        onClick={() => navigate(`/projects/${p.id}`)}
                        title={`${p.name} · ${dueLabel(p.due)}`}
                        style={{ gridColumn: `${startIndex + 1} / span ${duration}`, height: 22, margin: "0 3px", minWidth: 30, position: "relative", zIndex: 2, borderRadius: "var(--radius-full)", cursor: "pointer", background: `color-mix(in srgb, ${col} 20%, white)`, border: `1.5px solid ${col}` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  })();

  // ── Calendar — projects placed on their due date. ──
  const calendarView = (() => {
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const [y, m] = [calMonth.getFullYear(), calMonth.getMonth()];
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const todayIso = iso(new Date());
    const dueIso = (p: (typeof withStat)[number]) => p.due;
    const projectsOn = (d: Date) => filteredForViews.filter((p) => dueIso(p) === iso(d));
    return (
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
          <span style={{ flex: 1 }} />
          <button onClick={() => setCalMonth(new Date(y, m - 1, 1))} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", color: "var(--text-secondary)", cursor: "pointer" }} aria-label="Previous month"><Icon name="ArrowLeftProperty1Linear" size={16} /></button>
          <button onClick={() => setCalMonth(new Date())} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700 }}>Today</button>
          <button onClick={() => setCalMonth(new Date(y, m + 1, 1))} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", color: "var(--text-secondary)", cursor: "pointer" }} aria-label="Next month"><Icon name="ArrowRightProperty1Linear" size={16} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-soft)" }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
            <div key={w} style={{ padding: "9px 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-tertiary)" }}>{w}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} style={{ minHeight: 130, borderRight: i % 7 !== 6 ? "1px solid var(--border-soft)" : "none", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-page)" }} />;
            const list = projectsOn(d);
            const isToday = iso(d) === todayIso;
            const weekend = [0, 6].includes(d.getDay());
            return (
              <div key={i} style={{ minHeight: 130, padding: 7, borderRight: i % 7 !== 6 ? "1px solid var(--border-soft)" : "none", borderBottom: "1px solid var(--border-soft)", background: weekend ? "var(--surface-page)" : "var(--surface-card)" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 5 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 5px", borderRadius: "var(--radius-full)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: isToday ? 800 : 600, background: isToday ? "var(--primary-500)" : "transparent", color: isToday ? "#fff" : "var(--text-secondary)" }}>{d.getDate()}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 95, overflowY: "auto" }}>
                  {list.map((p) => {
                    const c = clientById.get(p.clientId ?? "");
                    const col = c?.color ?? p.color;
                    return (
                      <div key={p.id} title={`Open ${p.name}`} onClick={() => navigate(`/projects/${p.id}`)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${col} 13%, white)`, overflow: "hidden", cursor: "pointer" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: col }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 600, lineHeight: 1.15, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Projects</h1>
          <p style={{ margin: "5px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)" }}>
            {projects.length} project{projects.length === 1 ? "" : "s"} across {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setProjModal({ project: null })} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
            <Icon name="AddProperty1Bold" size={17} /> New project
          </button>
        )}
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 12px 0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: projectFilter ? "color-mix(in srgb, var(--primary-500) 8%, white)" : "var(--surface-card)", flexShrink: 0 }}>
          <Icon name="FolderProperty1Linear" size={16} style={{ color: projectFilter ? "var(--primary-500)" : "var(--text-tertiary)", flexShrink: 0 }} />
          <select value={projectFilter} onChange={(e) => setPF(e.target.value)} aria-label="Filter by project" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
            <option value="">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
        {(clientFilter || projectFilter) && (
          <button
            onClick={() => { setCF(""); setPF(""); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 42, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700 }}
          >
            <Icon name="CloseCircleProperty1Linear" size={15} /> Clear
          </button>
        )}
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

      {view === "list" && (
        <>
          {favourites.length > 0 && section("favourites", favourites, "")}
          {section("visible", visible, q ? "No projects match this search." : "No active projects — create your first one above.")}
          {section("finished", finished, "No finished projects yet.")}
        </>
      )}
      {view === "board" && boardView}
      {view === "timeline" && timelineView}
      {view === "calendar" && calendarView}

      {projModal && <ProjectEditModal project={projModal.project} onClose={() => setProjModal(null)} />}
    </div>
  );
}
