import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mountain } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";

const Index = () => {
  useSEO({
    title: "Peak Focus Improved: Focus & Reading Tools",
    description:
      "ADHD-friendly focus timer and reading tools with a calm indigo UI. Start focusing with Peak Focus Improved.",
    canonical: "/",
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg-gradient-from))] to-[hsl(var(--bg-gradient-to))] flex items-center justify-center p-4">
      <article className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mountain className="w-12 h-12 text-[hsl(var(--brand))]" aria-hidden="true" />
            </div>
            <h1 className="tracking-tight text-2xl font-bold">Peak Focus Improved</h1>
            <p className="text-sm text-muted-foreground">ADHD-friendly focus & reading experience</p>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground text-center">Clean, calm UI inspired by Peak Focus. Start a session and stay in flow.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/focus" aria-label="Start focusing now">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>
      </article>
    </main>
  );
};

export default Index;
