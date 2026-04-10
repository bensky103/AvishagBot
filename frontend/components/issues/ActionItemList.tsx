"use client";

import Link from "next/link";
import { useToggleActionItem } from "@/lib/queries/issues";
import type { ActionItem } from "@/lib/types";

interface ActionItemListProps {
  items: ActionItem[];
}

export function ActionItemList({ items }: ActionItemListProps) {
  const toggle = useToggleActionItem();

  if (items.length === 0) {
    return <p className="text-text-secondary font-body text-sm">אין פעולות</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 bg-surface rounded-xl p-3 border border-border shadow-card">
          <button
            onClick={() => toggle.mutate({ id: item.id, isCompleted: item.is_completed })}
            className={`
              w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center text-xs transition-colors
              ${item.is_completed ? "bg-success border-success text-white" : "border-border hover:border-primary"}
            `}
          >
            {item.is_completed && "✓"}
          </button>
          <div className="flex-1">
            <span className={`font-body text-sm ${item.is_completed ? "line-through opacity-60" : ""}`}>
              {item.description}
            </span>
            {item.task_id && (
              <Link
                href={`/tasks?selected=${item.task_id}`}
                className="block text-xs text-primary hover:underline font-body mt-1"
              >
                משימה מקושרת →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
