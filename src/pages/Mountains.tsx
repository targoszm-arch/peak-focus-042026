import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";

export default function Mountains() {
  useSEO({ title: "Mountains | Peak Focus", description: "Explore your productivity peaks.", canonical: "/mountains" });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Mountains</h1>
        <p className="text-sm text-muted-foreground">Your themed goals and achievements.</p>
        <ul className="mt-4 space-y-2">
          <li><Link className="text-primary underline" to="/mountains/everest">Open Mountain “everest”</Link></li>
        </ul>
      </article>
    </main>
  );
}
