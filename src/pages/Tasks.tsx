import { useMemo, useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useTasks, INBOX_ID, type Priority, type Task } from "@/hooks/use-tasks";
import TaskInput from "@/components/tasks/TaskInput";
import {
  ListTodo,
  FolderPlus,
  Inbox,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const PRIORITY_META: Record<
  Exclude<Priority, "none">,
  { label: string; placeholder: string; bg: string; ring: string }
> = {
  high: {
    label: "HIGH",
    placeholder: "Need focus – add here",
    bg: "bg-rose-500/15 text-rose-500",
    ring: "ring-rose-500/40",
  },
  medium: {
    label: "MEDIUM",
    placeholder: "Not urgent – add here",
    bg: "bg-amber-500/15 text-amber-500",
    ring: "ring-amber-500/40",
  },
  low: {
    label: "LOW",
    placeholder: "No rush – add here",
    bg: "bg-sky-500/15 text-sky-400",
    ring: "ring-sky-500/40",
  },
};

function PriorityChip({
  priority,
  onChange,
}: {
  priority: Priority;
  onChange: (p: Priority) => void;
}) {
  const next: Record<Priority, Priority> = {
    none: "high",
    high: "medium",
    medium: "low",
    low: "none",
  };
  if (priority === "none") {
    return (
      <button
        type="button"
        onClick={() => onChange(next[priority])}
        aria-label="Set priority"
        className="text-muted-foreground hover:text-foreground"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>
    );
  }
  const meta = PRIORITY_META[priority];
  return (
    <button
      type="button"
      onClick={() => onChange(next[priority])}
      aria-label={`Priority: ${meta.label}`}
      className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + meta.bg}
    >
      {meta.label}
    </button>
  );
}

function TaskRow({
  task,
  projectsLabel,
  onToggle,
  onDelete,
  onPriority,
}: {
  task: Task;
  projectsLabel?: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriority: (id: string, p: Priority) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-card-foreground">
      <label className="flex min-w-0 flex-1 items-center gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          aria-label={
            task.completed
              ? `Mark "${task.title}" as incomplete`
              : `Mark "${task.title}" as complete`
          }
        />
        <span className="min-w-0 flex-1">
          <span
            className={
              "block truncate " +
              (task.completed ? "line-through text-muted-foreground" : "")
            }
          >
            {task.title}
          </span>
          {projectsLabel && (
            <span className="block text-[10px] text-muted-foreground">
              {projectsLabel}
            </span>
          )}
        </span>
      </label>
      <div className="flex items-center gap-2">
        <PriorityChip
          priority={task.priority}
          onChange={(p) => onPriority(task.id, p)}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function PrioritySection({
  priority,
  tasks,
  open,
  onToggleOpen,
  onAdd,
  onToggle,
  onDelete,
  onPriority,
  projectName,
}: {
  priority: Exclude<Priority, "none">;
  tasks: Task[];
  open: boolean;
  onToggleOpen: () => void;
  onAdd: (title: string, priority: Priority) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriority: (id: string, p: Priority) => void;
  projectName: (id: string) => string;
}) {
  const meta = PRIORITY_META[priority];
  const [draft, setDraft] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft, priority);
    setDraft("");
  };
  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex items-center gap-2"
        aria-expanded={open}
      >
        <span
          className={
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold " +
            meta.bg
          }
        >
          <Flag className="h-3 w-3" />
          {meta.label}
        </span>
        <ChevronDown
          className={
            "h-4 w-4 text-muted-foreground transition-transform " +
            (open ? "" : "-rotate-90")
          }
        />
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </button>
      {open && (
        <div className="space-y-2">
          <form onSubmit={submit}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={meta.placeholder}
              className={"border-dashed " + meta.ring}
            />
          </form>
          {tasks.length > 0 && (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  projectsLabel={projectName(t.projectId)}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onPriority={onPriority}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

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
    setTaskPriority,
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
  const [openSections, setOpenSections] = useState<
    Record<Exclude<Priority, "none">, boolean>
  >({ high: true, medium: true, low: true });

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
  const stats = projectStats[activeProjectId] ?? {
    total: 0,
    completed: 0,
    remaining: 0,
  };

  const tasksByPriority = useMemo(() => {
    const buckets: Record<Exclude<Priority, "none">, Task[]> = {
      high: [],
      medium: [],
      low: [],
    };
    const open = tasks.filter((t) => !t.completed);
    for (const t of open) {
      if (t.priority === "high" || t.priority === "medium" || t.priority === "low") {
        buckets[t.priority].push(t);
      }
    }
    return buckets;
  }, [tasks]);

  const todoCount = useMemo(
    () => tasks.filter((t) => !t.completed && t.priority === "none").length,
    [tasks]
  );

  const projectName = (id: string) => {
    if (id === INBOX_ID) return "Inbox";
    return projects.find((p) => p.id === id)?.name ?? "Inbox";
  };

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
          <h1 className="text-2xl font-semibold tracking-tight">To-do</h1>
        </header>

        <Tabs defaultValue="priority" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="priority">Priority</TabsTrigger>
            <TabsTrigger value="project">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="priority" className="space-y-4">
            {(["high", "medium", "low"] as const).map((p) => (
              <PrioritySection
                key={p}
                priority={p}
                tasks={tasksByPriority[p]}
                open={openSections[p]}
                onToggleOpen={() =>
                  setOpenSections((s) => ({ ...s, [p]: !s[p] }))
                }
                onAdd={(title, priority) => addTask(title, INBOX_ID, priority)}
                onToggle={toggleTask}
                onDelete={removeTask}
                onPriority={setTaskPriority}
                projectName={projectName}
              />
            ))}

            <section className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                  TO-DO
                </span>
                <span className="text-xs text-muted-foreground">{todoCount}</span>
              </div>
              <ul className="space-y-2">
                {tasks
                  .filter((t) => !t.completed && t.priority === "none")
                  .map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      projectsLabel={projectName(t.projectId)}
                      onToggle={toggleTask}
                      onDelete={removeTask}
                      onPriority={setTaskPriority}
                    />
                  ))}
              </ul>
            </section>
          </TabsContent>

          <TabsContent value="project" className="space-y-4">
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
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={commitRename}
                      aria-label="Save name"
                    >
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
                      onClick={() =>
                        startRename(activeProject.id, activeProject.name)
                      }
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

              <TaskInput
                onAdd={(title) => addTask(title, activeProjectId)}
              />

              <div aria-live="polite" aria-atomic="true">
                {visibleTasks.length === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                    No tasks in {activeName} yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {visibleTasks.map((task) => (
                      <li key={task.id} className="space-y-1">
                        <TaskRow
                          task={task}
                          onToggle={toggleTask}
                          onDelete={removeTask}
                          onPriority={setTaskPriority}
                        />
                        {projects.length > 0 && (
                          <select
                            value={task.projectId}
                            onChange={(e) =>
                              moveTask(task.id, e.target.value)
                            }
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
          </TabsContent>
        </Tabs>
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
