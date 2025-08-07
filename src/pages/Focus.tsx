import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/use-seo";

const Focus = () => {
  useSEO({
    title: "Focus | Peak Focus Improved",
    description: "Start a distraction-free focus session with a calm, indigo UI.",
    canonical: "/focus",
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg-gradient-from))] to-[hsl(var(--bg-gradient-to))] flex items-center justify-center p-4">
      <article className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Focus Session</CardTitle>
            <p className="text-sm text-muted-foreground">Timer coming soon.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center text-sm text-muted-foreground">Stay in flow. We’ll add the Pomodoro timer next.</div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="secondary" asChild className="gap-2">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Home
              </Link>
            </Button>
            <Button className="flex-1">Start 25-min</Button>
          </CardFooter>
        </Card>
      </article>
    </main>
  );
};

export default Focus;
