"use client";

import Link from "next/link";
import { useTasks } from "@/lib/queries/tasks";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { KpiCard } from "@/components/ui/KpiCard";
import { UrgencyBadge, StatusBadge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { data: issues, isLoading: loadingIssues } = useIssues();

  const openTasks = tasks?.filter((t) => !t.is_completed) || [];
  const overdueTasks = openTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  );
  const openIssues = issues?.filter((i) => i.status !== "resolved") || [];

  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const needsAttention = openTasks
    .filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return due <= weekFromNow;
    })
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 3) -
             (urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 3);
    });

  if (loadingTasks || loadingSuppliers || loadingIssues) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading">לוח בקרה</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="משימות פתוחות" value={openTasks.length} />
        <KpiCard label="משימות באיחור" value={overdueTasks.length} color="text-danger" />
        <KpiCard label="תקלות פתוחות" value={openIssues.length} color="text-warning" />
        <KpiCard label="ספקים" value={suppliers?.length || 0} />
      </div>

      <section>
        <h2 className="text-lg font-heading mb-3">דורש טיפול</h2>
        {needsAttention.length === 0 ? (
          <p className="text-text-secondary font-body text-sm">אין משימות דחופות השבוע</p>
        ) : (
          <div className="space-y-2">
            {needsAttention.map((task) => (
              <Link
                key={task.id}
                href={`/tasks?selected=${task.id}`}
                className="block bg-surface hover:bg-elevated rounded-xl p-3 border border-border shadow-card transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <UrgencyBadge urgency={task.urgency} />
                    {task.due_date && (
                      <span className={`text-xs font-body ${
                        new Date(task.due_date) < today ? "text-danger" : "text-text-secondary"
                      }`}>
                        {new Date(task.due_date).toLocaleDateString("he-IL")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-heading mb-3">תקלות אחרונות</h2>
        {openIssues.length === 0 ? (
          <p className="text-text-secondary font-body text-sm">אין תקלות פתוחות</p>
        ) : (
          <div className="space-y-2">
            {openIssues.slice(0, 5).map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="block bg-surface hover:bg-elevated rounded-xl p-3 border border-border shadow-card transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm">{issue.product_name}</span>
                  <StatusBadge status={issue.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
