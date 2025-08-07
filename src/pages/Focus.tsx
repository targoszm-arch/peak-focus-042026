import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/use-seo";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useMemo, useState } from "react";

const Focus = () => {
  useSEO({
    title: "Focus | Peak Focus Improved",
    description: "Start a distraction-free focus session with a calm, indigo UI.",
    canonical: "/focus",
  });

  const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
  const durations = useMemo(() => ({ focus: 25 * 60, short: 5 * 60, long: 15 * 60 }), []);
  const [secondsLeft, setSecondsLeft] = useState(durations.focus);
  const [running, setRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    setSecondsLeft(durations[mode]);
  }, [mode, durations]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const handleComplete = () => {
    if (mode === "focus") {
      const nextCount = cyclesCompleted + 1;
      setCyclesCompleted(nextCount);
      const nextMode = nextCount % 4 === 0 ? "long" : "short";
      setMode(nextMode);
      toast({
        title: "Focus session complete",
        description: nextMode === "long" ? "Take a long break." : "Time for a short break.",
      });
    } else {
      setMode("focus");
      toast({
        title: "Break complete",
        description: "Let's get back to focus.",
      });
    }
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const total = durations[mode];
  const percent = ((total - secondsLeft) / total) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg-gradient-from))] to-[hsl(var(--bg-gradient-to))] flex items-center justify-center p-4">
      <article className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Focus Session</CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === "focus" ? "Deep focus" : mode === "short" ? "Short break" : "Long break"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div aria-live="polite" className="text-6xl font-bold tracking-tight">
                {format(secondsLeft)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "focus" ? "Stay in flow" : "Rest and reset"}
              </p>
            </div>

            <Progress value={percent} aria-label="Session progress" />

            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => setRunning((r) => !r)} className="min-w-24">
                {running ? "Pause" : "Start"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(total);
                }}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRunning(false);
                  if (mode === "focus") {
                    const nextCount = cyclesCompleted + 1;
                    setCyclesCompleted(nextCount);
                    setMode(nextCount % 4 === 0 ? "long" : "short");
                  } else {
                    setMode("focus");
                  }
                }}
              >
                Skip
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="secondary" asChild className="gap-2">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Home
              </Link>
            </Button>
          </CardFooter>

        </Card>
      </article>
    </main>
  );
};

export default Focus;
