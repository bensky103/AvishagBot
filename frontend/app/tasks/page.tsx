"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskPanel } from "@/components/tasks/TaskPanel";

function TasksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedId = searchParams.get("selected")
    ? Number(searchParams.get("selected"))
    : null;

  const setSelected = (id: number | null) => {
    if (id) {
      router.replace(`/tasks?selected=${id}`, { scroll: false });
    } else {
      router.replace("/tasks", { scroll: false });
    }
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-64px)] -m-4 md:-m-6">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <TaskList selectedId={selectedId} onSelect={setSelected} />
      </div>

      {selectedId && (
        <TaskPanel taskId={selectedId} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="text-text-secondary font-body">טוען...</div>}>
      <TasksContent />
    </Suspense>
  );
}
