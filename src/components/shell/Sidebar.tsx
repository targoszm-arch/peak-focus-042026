import { useLocation, useNavigate } from "react-router-dom";
import { Icon, NavItem, Avatar } from "@/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/use-tasks";
import { bucket } from "@/lib/pfdate";

const logo = "/brand/peak-focus-logo-transparent.png";

type NavDef = { key: string; label: string; icon: string; path: string };

const NAV: NavDef[] = [
  { key: "dashboard", label: "Dashboard", icon: "CategoryProperty1Linear", path: "/" },
  { key: "today", label: "Today", icon: "Home2Property1Linear", path: "/today" },
  { key: "tasks", label: "Tasks", icon: "TaskSquareProperty1Linear", path: "/tasks" },
  { key: "projects", label: "Projects", icon: "FolderProperty1Linear", path: "/projects" },
  { key: "clients", label: "Clients", icon: "CategoryProperty1Linear", path: "/clients" },
  { key: "people", label: "People", icon: "Profile2userProperty1Linear", path: "/people" },
  { key: "habits", label: "Habits", icon: "StarProperty1Linear", path: "/habits" },
  { key: "focus", label: "Focus", icon: "TimerProperty1Linear", path: "/focus" },
  { key: "health", label: "Health", icon: "ChartProperty1Linear", path: "/health" },
  { key: "integrations", label: "Integrations", icon: "Element3Property1Linear", path: "/integrations" },
];

export default function Sidebar({
  open,
  onClose,
  onQuickAdd,
}: {
  open: boolean;
  onClose: () => void;
  onQuickAdd: () => void;
}) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { tasks } = useTasks();

  const openCount = tasks.filter(
    (t) => !t.completed && (bucket(t.endsAt) === "today" || bucket(t.endsAt) === "overdue")
  ).length;

  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));
  const go = (path: string) => {
    nav(path);
    onClose();
  };

  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "You";
  const email = user?.email ?? "";

  return (
    <aside
      className={"pf-sidebar" + (open ? " open" : "")}
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        height: "100%",
        background: "var(--surface-card)",
        borderRight: "1px solid var(--border-soft)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 6px" }}>
        <img src={logo} alt="Peak Focus" style={{ height: 30 }} />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          Peak Focus
        </span>
      </div>

      <button
        onClick={() => {
          onQuickAdd();
          onClose();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 20,
          padding: "11px 12px",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--primary-500)",
          color: "#fff",
          cursor: "pointer",
          width: "100%",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Icon name="AddProperty1Bold" size={19} />
        <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>Quick add</span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>N</span>
      </button>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV.map((n) => (
          <NavItem
            key={n.key}
            icon={<Icon name={n.icon} size={20} />}
            label={n.label}
            badge={n.key === "today" ? openCount || null : null}
            active={isActive(n.path)}
            onClick={() => go(n.path)}
          />
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border-soft)",
          paddingTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <NavItem
          icon={<Icon name="Setting2Property1Linear" size={20} />}
          label="Settings"
          active={isActive("/settings")}
          onClick={() => go("/settings")}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 8px",
            marginTop: 4,
            borderRadius: "var(--radius-md)",
            background: "var(--surface-page)",
          }}
        >
          <Avatar name={name} size={36} status="online" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                color: "var(--text-tertiary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {email}
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Log out"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              display: "inline-flex",
              padding: 4,
            }}
          >
            <Icon name="LogoutProperty1Linear" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
