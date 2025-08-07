import { useSEO } from "@/hooks/use-seo";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { day: "Mon", pomos: 5 },
  { day: "Tue", pomos: 6 },
  { day: "Wed", pomos: 3 },
  { day: "Thu", pomos: 7 },
  { day: "Fri", pomos: 4 },
  { day: "Sat", pomos: 2 },
  { day: "Sun", pomos: 5 },
];

export default function Progress() {
  useSEO({ title: "Progress | Peak Focus", description: "View your focus trends and stats.", canonical: "/progress" });
  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
          <p className="text-sm text-muted-foreground">Weekly pomodoro count</p>
        </header>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="pomos" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </main>
  );
}
