"use client";

import Link from "next/link";
import { useTask, useUpdateTask, useToggleTask } from "@/lib/queries/tasks";
import { Button } from "@/components/ui/Button";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { useToast } from "@/components/ui/Toast";
import type { Urgency } from "@/lib/types";

const URGENCY_OPTIONS = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "critical", label: "קריטית" },
];

export function TaskDetail({ taskId }: { taskId: number }) {
  const { data: task, isLoading } = useTask(taskId);
  const update = useUpdateTask();
  const toggle = useToggleTask();
  const { toast } = useToast();

  if (isLoading || !task) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  const handleUpdate = (field: string, value: string) => {
    update.mutate(
      { id: task.id, data: { [field]: value } },
      {
        onSuccess: () => toast("עודכן בהצלחה", "success"),
        onError: () => toast("שגיאה בעדכון", "error"),
      }
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/tasks" className="text-primary hover:underline font-body text-sm">
        ← חזרה למשימות
      </Link>

      <div>
        <InlineEdit
          value={task.title}
          onSave={(v) => handleUpdate("title", v)}
          className="text-2xl font-heading"
        />
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">דחיפות</span>
          <InlineEdit
            value={task.urgency}
            as="select"
            options={URGENCY_OPTIONS}
            onSave={(v) => handleUpdate("urgency", v)}
          />
        </div>
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">תאריך יעד</span>
          <InlineEdit
            value={task.due_date || ""}
            onSave={(v) => handleUpdate("due_date", v)}
            placeholder="לא הוגדר"
          />
        </div>
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">סטטוס</span>
          <Button
            variant={task.is_completed ? "secondary" : "primary"}
            onClick={() => toggle.mutate(task)}
            className="text-sm"
          >
            {task.is_completed ? "פתח מחדש" : "סמן כבוצע"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-heading mb-2">תיאור</h3>
        <div className="bg-surface rounded-xl p-4 border border-border shadow-card">
          <InlineEdit
            value={task.description || ""}
            as="textarea"
            onSave={(v) => handleUpdate("description", v)}
            placeholder="הוסף תיאור..."
          />
        </div>
      </div>

      <div className="text-xs text-text-secondary font-body space-y-1 pt-4 border-t border-border">
        <div>נוצר: {new Date(task.created_at).toLocaleDateString("he-IL")}</div>
        {task.completed_at && (
          <div>הושלם: {new Date(task.completed_at).toLocaleDateString("he-IL")}</div>
        )}
      </div>
    </div>
  );
}
