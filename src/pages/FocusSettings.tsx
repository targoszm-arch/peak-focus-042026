import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function FocusSettings() {
  useSEO({ title: "Timer Settings | Peak Focus", description: "Adjust focus and break durations.", canonical: "/focus/timer-settings" });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[hsl(var(--bg-gradient-from))] to-[hsl(var(--bg-gradient-to))] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Timer Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your focus, short break, and long break lengths.</p>
        </header>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <p className="text-sm text-muted-foreground">Coming soon: adjustable durations and cycles.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/focus">
              <ArrowLeft className="h-4 w-4" />
              Back to Focus
            </Link>
          </Button>
        </div>
      </article>
    </main>
  );
}
