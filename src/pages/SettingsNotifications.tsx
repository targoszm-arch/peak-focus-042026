import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SettingsNotifications() {
  useSEO({ title: "Notifications | Peak Focus", description: "Notification preferences.", canonical: "/settings/notifications" });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Configure reminder notifications.</p>
        </header>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">Controls coming soon.</div>
        <Button asChild variant="secondary" className="gap-2">
          <Link to="/settings">
            <ArrowLeft className="h-4 w-4" /> Back to Settings
          </Link>
        </Button>
      </article>
    </main>
  );
}
