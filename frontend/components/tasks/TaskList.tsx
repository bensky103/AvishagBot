"use client";

import { useState } from "react";
import { useTasks } from "@/lib/queries/tasks";
import { TaskRow } from "./TaskRow";
import { FilterBar } from "@/components/ui/FilterBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TaskForm } from "./TaskForm";

const TASK_FILTERS = [
  {
    key: "status",
    label: "סטטוס",
    options: [
      { value: "open", label: "פתוח" },
      { value: "completed", label: "הושלם" },
    ],
  },
  {
    key: "urgency",
    label: "דחיפות",
    options: [
      { value: "low", label: "נמוכה" },
      { value: "medium", label: "בינונית" },
      { value: "high", label: "גבוהה" },
      { value: "critical", label: "קריטית" },
    ],
  },
];

interface TaskListProps {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function TaskList({ selectedId, onSelect }: TaskListProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);

  const apiFilters: Record<string, string> = {};
  if (filters.status) apiFilters.status = filters.status;
  if (filters.urgency) apiFilters.urgency = filters.urgency;

  const { data: tasks, isLoading } = useTasks(
    Object.keys(apiFilters).length > 0 ? apiFilters : undefined
  );

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading">משימות</h1>
        <Button onClick={() => setShowCreate(true)} className="text-sm">+ משימה חדשה</Button>
      </div>

      <div className="mb-4">
        <FilterBar
          filters={TASK_FILTERS}
          values={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      </div>

      {isLoading ? (
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      ) : (
        <div className="space-y-2">
          {tasks?.length === 0 && (
            <p className="text-text-secondary font-body text-sm">אין משימות</p>
          )}
          {tasks?.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={task.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="משימה חדשה">
        <TaskForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
