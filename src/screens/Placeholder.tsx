import { Card, Icon } from "@/ds";

// Branded placeholder for screens being ported from the design system.
export default function Placeholder({
  title,
  icon = "Element3Property1Linear",
  blurb,
}: {
  title: string;
  icon?: string;
  blurb?: string;
}) {
  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{title}</h1>
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
          <Icon name={icon} size={24} />
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            {title} is being rebuilt on the new design system
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            {blurb ?? "This screen is next in the port. The shell, brand, and live data layer are already in place."}
          </div>
        </div>
      </Card>
    </div>
  );
}
