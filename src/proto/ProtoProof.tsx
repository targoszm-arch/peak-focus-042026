import { PF } from "./bootstrap";

// Temporary harness: renders the unmodified prototype TodayScreen with the mock
// PFData, to verify the exact design renders in the real build.
export default function ProtoProof() {
  const D = PF.PFData;
  const TodayScreen = PF.TodayScreen;
  if (!TodayScreen) return <div style={{ padding: 40 }}>TodayScreen not registered</div>;
  const noop = () => {};
  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: "var(--surface-page)" }}>
      <TodayScreen
        tasks={D.tasks}
        habits={D.habits}
        onToggleTask={noop}
        onAddTask={noop}
        onToggleHabit={noop}
        onOpenProject={noop}
        onGoto={noop}
      />
    </div>
  );
}
