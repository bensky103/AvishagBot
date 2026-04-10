"use client";

import Link from "next/link";
import { useTask, useToggleTask, useUpdateTask } from "@/lib/queries/tasks";
import { Button } from "@/components/ui/Button";
import { InlineEdit } from "@/components/ui/InlineEdit";
import type { Urgency } from "@/lib/types";

interface TaskPanelProps {
  taskId: number;
  onClose: () => void;
}

const URGENCY_OPTIONS = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "critical", label: "קריטית" },
];

export function TaskPanel({ taskId, onClose }: TaskPanelProps) {
  const { data: task, isLoading } = useTask(taskId);
  const toggle = useToggleTask();
  const update = useUpdateTask();

  if (isLoading || !task) {
    return (
      <div className="w-80 lg:w-96 bg-surface border-s border-border p-4 shadow-elevated">
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-96 bg-surface border-s border-border flex flex-col h-full shadow-elevated">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-heading text-lg truncate">{task.title}</h2>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl flex-shrink-0">
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="text-xs text-text-secondary font-body mb-1">דחיפות</div>
          <InlineEdit
            value={task.urgency}
            as="select"
            options={URGENCY_OPTIONS}
            onSave={(val) => update.mutate({ id: task.id, data: { urgency: val as Urgency } })}
          />
        </div>

        <div>
          <div className="text-xs text-text-secondary font-body mb-1">תאריך יעד</div>
          <span className={`font-body text-sm ${
            task.due_date && !task.is_completed && new Date(task.due_date) < new Date()
              ? "text-danger" : "text-text-primary"
          }`}>
            {task.due_date ? new Date(task.due_date).toLocaleDateString("he-IL") : "לא הוגדר"}
          </span>
        </div>

        <div>
          <div className="text-xs text-text-secondary font-body mb-1">תיאור</div>
          <p className="font-body text-sm text-text-primary line-clamp-3">
            {task.description || "אין תיאור"}
          </p>
        </div>

        <div>
          <div className="text-xs text-text-secondary font-body mb-1">סטטוס</div>
          <Button
            variant={task.is_completed ? "secondary" : "primary"}
            onClick={() => toggle.mutate(task)}
            className="text-sm"
          >
            {task.is_completed ? "פתח מחדש" : "סמן כבוצע"}
          </Button>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <Link href={`/tasks/${task.id}`}>
          <Button variant="secondary" className="w-full text-sm">
            פתח דף מלא →
          </Button>
        </Link>
      </div>
    </div>
  );
}
