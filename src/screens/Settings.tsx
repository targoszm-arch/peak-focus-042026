import { Card, Icon, Button, Avatar } from "@/ds";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user, signOut } = useAuth();
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "You";
  const email = user?.email ?? "";

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Settings</h1>

      <Card padding={22} style={{ marginTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={name} size={52} status="online" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{name}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{email}</div>
          </div>
          <Button variant="secondary" onClick={() => signOut()} leadingIcon={<Icon name="LogoutProperty1Linear" size={16} />}>
            Log out
          </Button>
        </div>
      </Card>

      <Card padding={22} style={{ marginTop: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>About your data</h3>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Your tasks, projects, clients, people, habits and health sync to your private Supabase workspace and are visible
          only to you. Connect more tools on the Integrations screen.
        </p>
      </Card>
    </div>
  );
}
