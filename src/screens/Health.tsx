import { useState } from "react";
import { toast } from "sonner";
import { Card, StatCard, Icon, Badge, Button } from "@/ds";
import { useHealth, type OuraDay } from "@/hooks/use-health";
import { useAuth } from "@/contexts/AuthContext";
import { connectOura, syncOura, disconnectOura } from "@/lib/oura";

function Sparkline({ values, tone = "var(--primary-500)" }: { values: number[]; tone?: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Health() {
  const { days, latest, connected, loading, spark, summary, reload } = useHealth();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const doSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const rows = await syncOura();
      toast.success(`Synced ${rows} days from Oura`);
      await reload();
    } catch (e) {
      toast.error(`Sync failed: ${(e as Error).message}`);
    } finally {
      setSyncing(false);
    }
  };

  const metrics: {
    key: keyof OuraDay;
    label: string;
    icon: string;
    tone: "primary" | "accent" | "success";
    unit: string;
    fmt?: (v: number) => string;
  }[] = [
    { key: "sleepScore", label: "Sleep score", icon: "MoonProperty1Bold", tone: "accent", unit: "/ 100" },
    { key: "readiness", label: "Readiness", icon: "SunProperty1Bold", tone: "primary", unit: "/ 100" },
    { key: "activity", label: "Activity", icon: "StarProperty1Bold", tone: "success", unit: "/ 100" },
    { key: "hrvAvg", label: "HRV (avg)", icon: "ChartProperty1Bold", tone: "accent", unit: "ms" },
    { key: "restingHr", label: "Resting HR", icon: "TimerProperty1Bold", tone: "primary", unit: "bpm" },
    {
      key: "totalSleepSeconds",
      label: "Time asleep",
      icon: "MoonProperty1Bold",
      tone: "success",
      unit: "",
      fmt: (v) => `${Math.floor(v / 3600)}h ${Math.round((v % 3600) / 60)}m`,
    },
  ];

  const toneColor = { primary: "var(--primary-500)", accent: "var(--secondary-500)", success: "var(--status-success)" };

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Health</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {connected ? (
            <>
              <Badge tone="success" dot>Oura connected</Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={doSync}
                disabled={syncing}
                leadingIcon={<Icon name="TimerProperty1Linear" size={15} style={syncing ? { animation: "pf-spin 1s linear infinite" } : undefined} />}
              >
                {syncing ? "Syncing…" : "Sync now"}
              </Button>
              <Button variant="ghost" size="sm" onClick={async () => { if (user && confirm("Disconnect Oura?")) { await disconnectOura(user.id); await reload(); } }}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={() => user && connectOura(user.id)} leadingIcon={<Icon name="AddProperty1Bold" size={15} />}>
              Connect Oura
            </Button>
          )}
        </div>
      </div>

      {!loading && days.length === 0 && (
        <Card padding={28} style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: "var(--primary-50)",
              color: "var(--primary-500)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="ChartProperty1Bold" size={24} />
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {connected ? "No health data yet" : "Connect your Oura ring"}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
              {connected
                ? "Tap “Sync now” above to pull your last 30 days of sleep, readiness, HRV and activity."
                : "Tap “Connect Oura” above to link your ring — your sleep, readiness and activity then sync here."}
            </div>
          </div>
        </Card>
      )}

      {days.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 22 }}>
            {metrics.map((m) => {
              const raw = latest?.[m.key];
              const value = typeof raw === "number" ? (m.fmt ? m.fmt(raw) : String(raw)) : "—";
              const series = spark(m.key);
              return (
                <Card key={m.key} padding={18} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-md)",
                        background: "var(--surface-sunken)",
                        color: toneColor[m.tone],
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name={m.icon} size={18} />
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{m.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                      {value}
                      {m.unit && <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-tertiary)", marginLeft: 4 }}>{m.unit}</span>}
                    </span>
                    <Sparkline values={series} tone={toneColor[m.tone]} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 16 }}>
            <StatCard icon={<Icon name="MoonProperty1Bold" size={20} />} label="Avg sleep (30d)" value={summary.avgSleep != null ? Math.round(summary.avgSleep) : "—"} iconTone="accent" />
            <StatCard icon={<Icon name="SunProperty1Bold" size={20} />} label="Avg readiness (30d)" value={summary.avgReadiness != null ? Math.round(summary.avgReadiness) : "—"} iconTone="primary" />
            <StatCard icon={<Icon name="TimerProperty1Bold" size={20} />} label="Avg resting HR (30d)" value={summary.avgRestingHr != null ? Math.round(summary.avgRestingHr) : "—"} iconTone="success" />
          </div>
        </>
      )}
    </div>
  );
}
