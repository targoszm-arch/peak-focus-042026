import { useMemo, useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useTasks, INBOX_ID } from "@/hooks/use-tasks";
import TaskInput from "@/components/tasks/TaskInput";
import TaskItem from "@/components/tasks/TaskItem";
import { ListTodo, FolderPlus, Inbox, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Tasks() {
  useSEO({
    title: "Tasks | Peak Focus",
    description: "Create projects and manage tasks within them.",
    canonical: "/tasks",
  });

  const {
    tasks,
    projects,
    addTask,
    toggleTask,
    removeTask,
    moveTask,
    clearCompleted,
    addProject,
    renameProject,
    removeProject,
    projectStats,
  } = useTasks();

  const [activeProjectId, setActiveProjectId] = useState<string>(INBOX_ID);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  );
  const activeName = activeProject?.name ?? "Inbox";
  const activeColor = activeProject?.color ?? "hsl(var(--primary))";

  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.projectId === activeProjectId),
    [tasks, activeProjectId]
  );
  const stats = projectStats[activeProjectId] ?? { total: 0, completed: 0, remaining: 0 };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    addProject(newProjectName);
    setNewProjectName("");
  };

  const startRename = (id: string, name: string) => {
    setEditingProjectId(id);
    setEditingName(name);
  };
  const commitRename = () => {
    if (editingProjectId && editingName.trim()) {
      renameProject(editingProjectId, editingName);
    }
    setEditingProjectId(null);
    setEditingName("");
  };

  const handleRemoveProject = () => {
    if (!activeProject) return;
    if (
      confirm(
        `Delete project "${activeProject.name}"? Its tasks will move to Inbox.`
      )
    ) {
      removeProject(activeProject.id);
      setActiveProjectId(INBOX_ID);
    }
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-4">
      <article className="mx-auto w-full max-w-md space-y-4">
        <header className="flex items-center gap-2">
          <ListTodo className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        </header>

        <section aria-label="Projects" className="space-y-2">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <ProjectChip
              active={activeProjectId === INBOX_ID}
              color="hsl(var(--muted-foreground))"
              icon={<Inbox className="h-3.5 w-3.5" />}
              label="Inbox"
              count={projectStats[INBOX_ID]?.remaining ?? 0}
              onClick={() => setActiveProjectId(INBOX_ID)}
            />
            {projects.map((p) => (
              <ProjectChip
                key={p.id}
                active={activeProjectId === p.id}
                color={p.color}
                label={p.name}
                count={projectStats[p.id]?.remaining ?? 0}
                onClick={() => setActiveProjectId(p.id)}
              />
            ))}
          </div>

          <form
            onSubmit={handleAddProject}
            className="flex items-center gap-2"
            aria-label="Add project"
          >
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name..."
            />
            <Button type="submit" size="icon" aria-label="Add project">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </form>
        </section>

        <section
          aria-label={`${activeName} tasks`}
          className="space-y-2 rounded-lg border bg-card p-3"
        >
          <div className="flex items-center justify-between">
            {editingProjectId === activeProjectId && activeProject ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") {
                      setEditingProjectId(null);
                      setEditingName("");
                    }
                  }}
                  className="h-8"
                />
                <Button size="icon" variant="ghost" onClick={commitRename} aria-label="Save name">
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingProjectId(null);
                    setEditingName("");
                  }}
                  aria-label="Cancel rename"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: activeColor }}
                  aria-hidden="true"
                />
                {activeName}
                <span className="text-xs font-normal text-muted-foreground">
                  {stats.completed}/{stats.total}
                </span>
              </h2>
            )}
            {activeProject && editingProjectId !== activeProjectId && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Rename ${activeName}`}
                  onClick={() => startRename(activeProject.id, activeProject.name)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${activeName}`}
                  onClick={handleRemoveProject}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <TaskInput onAdd={(title) => addTask(title, activeProjectId)} />

          <div aria-live="polite" aria-atomic="true">
            {visibleTasks.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                No tasks in {activeName} yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {visibleTasks.map((task) => (
                  <li key={task.id} className="space-y-1">
                    <TaskItem task={task} onToggle={toggleTask} onDelete={removeTask} />
                    {projects.length > 0 && (
                      <select
                        value={task.projectId}
                        onChange={(e) => moveTask(task.id, e.target.value)}
                        aria-label={`Move ${task.title}`}
                        className="ml-9 h-7 rounded-md border bg-background px-2 text-xs text-muted-foreground"
                      >
                        <option value={INBOX_ID}>Inbox</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {stats.completed > 0 && (
            <div className="flex justify-end pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => clearCompleted(activeProjectId)}
              >
                Clear completed
              </Button>
            </div>
          )}
        </section>
      </article>
    </main>
  );
}

function ProjectChip({
  active,
  color,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  color: string;
  icon?: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors " +
        (active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent")
      }
    >
      {icon ?? (
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      <span className="font-medium">{label}</span>
      {count > 0 && (
        <span className="rounded-full bg-secondary px-1.5 text-[10px] font-semibold text-secondary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
