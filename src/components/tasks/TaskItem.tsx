import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Task } from "@/hooks/use-tasks";

export default function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-card-foreground">
      <label className="flex items-center gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          aria-label={
            task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`
          }
        />
        <span className={task.completed ? "line-through text-muted-foreground" : undefined}>{task.title}</span>
      </label>
      <Button variant="ghost" size="icon" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
