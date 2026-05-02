import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Activity, LogOut, Mail } from "lucide-react";

const OURA_CLIENT_ID = "7e27aab7-c93f-4acd-bb9b-cf083c82b33a";
const OURA_REDIRECT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oura-callback`;
const OURA_SCOPE = "personal daily heartrate workout session";

export default function Settings() {
  useSEO({
    title: "Settings | Peak Focus",
    description: "Manage account, integrations, and notifications.",
    canonical: "/settings",
  });
  const { user, signOut } = useAuth();
  const [oura, setOura] = useState<{ connected: boolean; loading: boolean }>({
    connected: false,
    loading: true,
  });
  const [params] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("oura_connections")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setOura({ connected: !!data, loading: false });
      });
  }, [user, params]);

  const connectOura = () => {
    if (!user) return;
    const url = new URL("https://cloud.ouraring.com/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", OURA_CLIENT_ID);
    url.searchParams.set("redirect_uri", OURA_REDIRECT);
    url.searchParams.set("scope", OURA_SCOPE);
    url.searchParams.set("state", user.id);
    window.location.href = url.toString();
  };

  const disconnectOura = async () => {
    if (!user) return;
    if (!confirm("Disconnect Oura?")) return;
    await supabase.from("oura_connections").delete().eq("user_id", user.id);
    setOura({ connected: false, loading: false });
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage account, integrations, and notifications.
          </p>
        </header>

        <section className="space-y-2 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Account</h2>
          </div>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={signOut}
            className="gap-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </section>

        <section className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Integrations</h2>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Oura Ring</p>
              <p className="text-xs text-muted-foreground">
                {oura.loading
                  ? "Checking…"
                  : oura.connected
                    ? "Connected — sleep, readiness, activity will sync."
                    : "Sync sleep, readiness, and activity into your dashboard."}
              </p>
            </div>
            {oura.connected ? (
              <Button size="sm" variant="secondary" onClick={disconnectOura}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={connectOura} disabled={oura.loading}>
                Connect
              </Button>
            )}
          </div>
          {params.get("oura") === "error" && (
            <p className="text-xs text-destructive">
              Connection failed — please try again.
            </p>
          )}
          {params.get("oura") === "connected" && (
            <p className="text-xs text-emerald-600">
              Oura connected. We'll sync your data shortly.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <Button asChild className="w-full">
            <Link to="/settings/notifications">Notification Settings</Link>
          </Button>
        </section>
      </article>
    </main>
  );
}
