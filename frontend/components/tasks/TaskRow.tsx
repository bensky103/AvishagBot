"use client";

import { UrgencyBadge } from "@/components/ui/Badge";
import { useToggleTask } from "@/lib/queries/tasks";
import type { Task } from "@/lib/types";

interface TaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: (id: number) => void;
}

export function TaskRow({ task, selected, onSelect }: TaskRowProps) {
  const toggle = useToggleTask();

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`
        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
        ${selected ? "bg-elevated border-primary shadow-elevated" : "bg-surface border-border hover:bg-elevated shadow-card"}
        ${task.is_completed ? "opacity-60" : ""}
      `}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle.mutate(task);
        }}
        className={`
          w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${task.is_completed ? "bg-success border-success text-white" : "border-border hover:border-primary"}
        `}
      >
        {task.is_completed && "✓"}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-body text-sm ${task.is_completed ? "line-through" : ""}`}>
          {task.title}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <UrgencyBadge urgency={task.urgency} />
        {task.due_date && (
          <span className={`text-xs font-body ${
            !task.is_completed && new Date(task.due_date) < new Date()
              ? "text-danger"
              : "text-text-secondary"
          }`}>
            {new Date(task.due_date).toLocaleDateString("he-IL")}
          </span>
        )}
      </div>
    </div>
  );
}
