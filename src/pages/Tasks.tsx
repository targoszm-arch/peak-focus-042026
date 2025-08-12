import { useSEO } from "@/hooks/use-seo";
import { useTasks } from "@/hooks/use-tasks";
import TaskInput from "@/components/tasks/TaskInput";
import TaskItem from "@/components/tasks/TaskItem";
import { ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Tasks() {
  useSEO({ title: "Tasks | Peak Focus", description: "Create and manage your task checklist.", canonical: "/tasks" });
  const { tasks, addTask, toggleTask, removeTask, clearCompleted, stats } = useTasks();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header className="flex items-center gap-2">
          <ListTodo className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        </header>

        <section>
          <TaskInput onAdd={addTask} />
        </section>

        <section aria-live="polite" aria-atomic="true">
          {tasks.length === 0 ? (
            <div className="rounded-lg border bg-card p-4 text-card-foreground text-sm text-muted-foreground">
              No tasks yet. Add your first task above.
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={removeTask} />
              ))}
            </ul>
          )}
        </section>

        <footer className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {stats.completed}/{stats.total} completed • {stats.remaining} remaining
          </p>
          {stats.completed > 0 && (
            <Button variant="secondary" size="sm" onClick={clearCompleted} aria-label="Clear completed tasks">
              Clear completed
            </Button>
          )}
        </footer>
      </article>
    </main>
  );
}
