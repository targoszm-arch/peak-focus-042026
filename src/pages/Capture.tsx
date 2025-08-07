import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Capture() {
  useSEO({ title: "Capture | Peak Focus", description: "Quickly capture tasks and ideas.", canonical: "/capture" });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Capture</h1>
          <p className="text-sm text-muted-foreground">Inbox for thoughts, tasks, and notes.</p>
        </header>
        <Button asChild>
          <Link to="/capture/new">Add New</Link>
        </Button>
      </article>
    </main>
  );
}
