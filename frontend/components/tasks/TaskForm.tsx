"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCreateTask } from "@/lib/queries/tasks";
import { useToast } from "@/components/ui/Toast";
import type { Urgency } from "@/lib/types";

interface TaskFormProps {
  onClose: () => void;
}

export function TaskForm({ onClose }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const create = useCreateTask();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        urgency,
      },
      {
        onSuccess: () => {
          toast("משימה נוצרה בהצלחה", "success");
          onClose();
        },
        onError: () => toast("שגיאה ביצירת המשימה", "error"),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-body text-text-secondary mb-1">כותרת *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-body text-text-secondary mb-1">תיאור</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body resize-y"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-body text-text-secondary mb-1">תאריך יעד</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-body text-text-secondary mb-1">דחיפות</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency)}
            className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body"
          >
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="critical">קריטית</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
        <Button type="submit" disabled={!title.trim() || create.isPending}>
          {create.isPending ? "יוצר..." : "צור משימה"}
        </Button>
      </div>
    </form>
  );
}
