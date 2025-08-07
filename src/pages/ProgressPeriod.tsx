import { useSEO } from "@/hooks/use-seo";
import { useParams } from "react-router-dom";

export default function ProgressPeriod() {
  const { period } = useParams<{ period: string }>();
  useSEO({ title: `Progress: ${period ?? "period"} | Peak Focus`, description: "Detailed progress for selected period.", canonical: `/progress/${period ?? "period"}` });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Progress: {period}</h1>
        <p className="text-sm text-muted-foreground">More charts coming soon.</p>
      </article>
    </main>
  );
}
