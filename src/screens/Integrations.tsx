import { useState } from "react";
import { Card, Icon, Switch, Badge } from "@/ds";

type Integration = {
  id: string;
  name: string;
  initial: string;
  color: string;
  connected: boolean;
  account: string;
  blurb: string;
  metricValue: number;
  metricLabel: string;
  lastSync: string;
};

const SEED: Integration[] = [
  { id: "gcal", name: "Google Calendar", initial: "G", color: "#4285F4", connected: true, account: "you@rivera.co", blurb: "Task due dates and focus blocks appear on your calendar automatically.", metricValue: 312, metricLabel: "events synced", lastSync: "2 min ago" },
  { id: "slack", name: "Slack", initial: "S", color: "#4A154B", connected: true, account: "Rivera HQ workspace", blurb: "Get a daily focus summary and gentle reminders in your Slack DMs.", metricValue: 18, metricLabel: "reminders sent", lastSync: "12 min ago" },
  { id: "notion", name: "Notion", initial: "N", color: "#111827", connected: true, account: "Rivera HQ", blurb: "Turn Notion pages into tasks and link project notes back to Notion.", metricValue: 24, metricLabel: "pages linked", lastSync: "1 hr ago" },
  { id: "health", name: "Apple Health", initial: "H", color: "#FF2D55", connected: true, account: "iPhone 15 Pro", blurb: "Steps, sleep and activity flow into your Health dashboard each morning.", metricValue: 7, metricLabel: "metrics synced", lastSync: "9 min ago" },
  { id: "github", name: "GitHub", initial: "G", color: "#24292F", connected: false, account: "", blurb: "Convert assigned issues and PRs into Peak Focus tasks.", metricValue: 0, metricLabel: "", lastSync: "" },
  { id: "linear", name: "Linear", initial: "L", color: "#5E6AD2", connected: false, account: "", blurb: "Two-way sync your Linear issues with your task list.", metricValue: 0, metricLabel: "", lastSync: "" },
  { id: "gmail", name: "Gmail", initial: "M", color: "#EA4335", connected: false, account: "", blurb: "Star an email to instantly create a task with a link back.", metricValue: 0, metricLabel: "", lastSync: "" },
  { id: "zoom", name: "Zoom", initial: "Z", color: "#2D8CFF", connected: false, account: "", blurb: "Auto-block focus time around your scheduled meetings.", metricValue: 0, metricLabel: "", lastSync: "" },
];

export default function Integrations() {
  const [items, setItems] = useState<Integration[]>(SEED);
  const connected = items.filter((i) => i.connected).length;

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));

  return (
    <div className="pf-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Integrations</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            Connect your tools so tasks, focus time and health flow into Peak Focus.
          </p>
        </div>
        <Badge tone="primary">{connected} connected</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 22 }}>
        {items.map((it) => (
          <Card key={it.id} padding={20} style={{ opacity: it.connected ? 1 : 0.94 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-md)",
                  background: it.color,
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {it.initial}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{it.name}</span>
                  <Switch checked={it.connected} onChange={() => toggle(it.id)} />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.45 }}>{it.blurb}</p>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-soft)", minHeight: 20 }}>
              {it.connected ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {it.account}
                  </span>
                  <span style={{ color: "var(--text-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {it.metricValue} {it.metricLabel} · {it.lastSync}
                  </span>
                </div>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)" }}>
                  <Icon name="AddProperty1Bold" size={14} /> Not connected
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
