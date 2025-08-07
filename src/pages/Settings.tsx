import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Settings() {
  useSEO({ title: "Settings | Peak Focus", description: "Configure notifications and preferences.", canonical: "/settings" });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences.</p>
        </header>
        <Button asChild>
          <Link to="/settings/notifications">Notification Settings</Link>
        </Button>
      </article>
    </main>
  );
}
