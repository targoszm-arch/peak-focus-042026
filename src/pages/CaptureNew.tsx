import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CaptureNew() {
  useSEO({ title: "New Capture | Peak Focus", description: "Create a new captured item.", canonical: "/capture/new" });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">New Capture</h1>
        </header>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">Form coming soon.</div>
        <Button asChild variant="secondary" className="gap-2">
          <Link to="/capture">
            <ArrowLeft className="h-4 w-4" /> Back to Capture
          </Link>
        </Button>
      </article>
    </main>
  );
}
