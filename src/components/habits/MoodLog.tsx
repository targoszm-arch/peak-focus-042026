import { useEffect, useState } from "react";
import { MOOD_LABELS } from "@/hooks/use-habits";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check } from "lucide-react";

const MOOD_COLORS = [
  "from-indigo-700 to-indigo-900",
  "from-blue-600 to-indigo-800",
  "from-sky-500 to-blue-700",
  "from-cyan-400 to-sky-600",
  "from-teal-300 to-cyan-500",
  "from-amber-300 to-yellow-400",
  "from-yellow-300 to-orange-400",
];

type Step = "slider" | "confirmed";

function timeAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
}

export default function MoodLog({
  value,
  onChange,
  weekMoods,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  weekMoods: { date: string; mood: number | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("slider");
  const [draft, setDraft] = useState<number>(value ?? 3);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (open) {
      setStep("slider");
      setDraft(value ?? 3);
      setSavedAt(null);
    }
  }, [open, value]);

  // tick "Logged X ago"
  useEffect(() => {
    if (step !== "confirmed") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  const handleSave = () => {
    onChange(draft);
    setSavedAt(Date.now());
    setNow(Date.now());
    setStep("confirmed");
  };

  return (
    <section className="space-y-2" aria-label="Daily mood">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Mood &amp; daily reflections
        </h2>
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] text-muted-foreground underline"
          >
            clear
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        {weekMoods.map((d) => {
          const dt = new Date(d.date);
          const letter = ["S", "M", "T", "W", "T", "F", "S"][dt.getDay()];
          const isToday = d.date === new Date().toISOString().slice(0, 10);
          const moodIdx = d.mood;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => isToday && setOpen(true)}
                aria-label={
                  moodIdx !== null
                    ? `${letter}: ${MOOD_LABELS[moodIdx]}`
                    : `${letter}: log mood`
                }
                disabled={!isToday}
                className={
                  "flex h-9 w-9 items-center justify-center rounded-full border text-xs " +
                  (moodIdx !== null
                    ? "bg-gradient-to-br text-white border-transparent " +
                      MOOD_COLORS[moodIdx]
                    : isToday
                      ? "border-dashed border-primary text-primary hover:bg-primary/10"
                      : "border-border text-muted-foreground")
                }
              >
                {moodIdx !== null ? "" : isToday ? "+" : ""}
              </button>
              <span className="text-[10px] text-muted-foreground">{letter}</span>
            </div>
          );
        })}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log mood"
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-2 text-muted-foreground hover:bg-accent"
            >
              ✕
            </button>
          </div>

          {step === "slider" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Mood
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  How did you feel overall on {today}?
                </h3>
              </div>

              <div
                className={
                  "h-44 w-44 rounded-full bg-gradient-to-br shadow-lg transition-all duration-300 " +
                  MOOD_COLORS[draft]
                }
                aria-hidden="true"
              />

              <div className="w-full max-w-sm space-y-3">
                <p className="text-center text-lg font-medium">
                  {MOOD_LABELS[draft]}
                </p>
                <Slider
                  min={0}
                  max={6}
                  step={1}
                  value={[draft]}
                  onValueChange={(v) => setDraft(v[0])}
                  aria-label="Mood scale from very unpleasant to very pleasant"
                />
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Very unpleasant</span>
                  <span>Very pleasant</span>
                </div>
              </div>

              <Button className="w-full max-w-sm" onClick={handleSave}>
                Done
              </Button>
            </div>
          )}

          {step === "confirmed" && savedAt !== null && (
            <div className="flex flex-1 flex-col items-center justify-between px-6 pb-8">
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <div
                  className={
                    "h-40 w-40 rounded-full bg-gradient-to-br shadow-lg " +
                    MOOD_COLORS[draft]
                  }
                  aria-hidden="true"
                />
                <h3 className="text-2xl font-semibold">Logged in Wellbeing</h3>
              </div>

              <div className="w-full max-w-sm space-y-4">
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-sm">
                    Today, you had a{" "}
                    <strong>{MOOD_LABELS[draft].toLowerCase()}</strong> day.
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded-xl border bg-background/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>Logged {timeAgo(Math.floor((now - savedAt) / 1000))}</span>
                    </div>
                    <div
                      className={
                        "h-6 w-6 rounded-full bg-gradient-to-br " +
                        MOOD_COLORS[draft]
                      }
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
