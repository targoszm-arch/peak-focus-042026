import { useSEO } from "@/hooks/use-seo";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MountainDetail() {
  const { id } = useParams<{ id: string }>();
  useSEO({ title: `Mountain: ${id ?? "Detail"} | Peak Focus`, description: "Mountain details and stats.", canonical: `/mountains/${id ?? "detail"}` });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Mountain: {id}</h1>
          <p className="text-sm text-muted-foreground">Details and stats for this goal.</p>
        </header>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">Stats coming soon.</div>
        <Button asChild variant="secondary" className="gap-2">
          <Link to="/mountains">
            <ArrowLeft className="h-4 w-4" /> Back to Mountains
          </Link>
        </Button>
      </article>
    </main>
  );
}
