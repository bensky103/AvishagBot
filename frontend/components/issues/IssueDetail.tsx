"use client";

import { useState } from "react";
import Link from "next/link";
import { useIssue, useUpdateIssue, useResolveIssue, useAddActionItem } from "@/lib/queries/issues";
import { useSupplier } from "@/lib/queries/suppliers";
import { StatusBadge } from "@/components/ui/Badge";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { Button } from "@/components/ui/Button";
import { SupplierCard } from "@/components/suppliers/SupplierCard";
import { ActionItemList } from "./ActionItemList";
import { useToast } from "@/components/ui/Toast";

export function IssueDetail({ issueId }: { issueId: number }) {
  const { data: issue, isLoading } = useIssue(issueId);
  const { data: supplier } = useSupplier(issue?.supplier_id);
  const update = useUpdateIssue();
  const resolve = useResolveIssue();
  const addAction = useAddActionItem();
  const { toast } = useToast();
  const [newAction, setNewAction] = useState("");

  if (isLoading || !issue) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  const handleUpdate = (field: string, value: string) => {
    update.mutate(
      { id: issue.id, data: { [field]: value } },
      {
        onSuccess: () => toast("עודכן בהצלחה", "success"),
        onError: () => toast("שגיאה בעדכון", "error"),
      }
    );
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim()) return;
    addAction.mutate(
      { issueId: issue.id, data: { description: newAction.trim() } },
      {
        onSuccess: () => { toast("פעולה נוספה", "success"); setNewAction(""); },
        onError: () => toast("שגיאה בהוספת פעולה", "error"),
      }
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/issues" className="text-primary hover:underline font-body text-sm">
        ← חזרה לתקלות
      </Link>

      <div className="flex items-center gap-3">
        <InlineEdit
          value={issue.product_name}
          onSave={(v) => handleUpdate("product_name", v)}
          className="text-2xl font-heading"
        />
        <StatusBadge status={issue.status} />
      </div>

      <div className="flex flex-wrap gap-4">
        {issue.sku && (
          <div>
            <span className="text-xs text-text-secondary font-body block mb-1">מק"ט</span>
            <span className="font-body text-sm">{issue.sku}</span>
          </div>
        )}
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">תאריך הגעה</span>
          <span className="font-body text-sm">{new Date(issue.arrival_date).toLocaleDateString("he-IL")}</span>
        </div>
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">פעולה</span>
          {issue.status !== "resolved" ? (
            <Button variant="primary" className="text-sm" onClick={() => resolve.mutate(issue.id)}>
              סמן כנפתר
            </Button>
          ) : (
            <span className="text-success font-body text-sm">נפתר</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-heading mb-2">תיאור הבעיה</h3>
        <div className="bg-surface rounded-xl p-4 border border-border shadow-card">
          <InlineEdit
            value={issue.problem_description}
            as="textarea"
            onSave={(v) => handleUpdate("problem_description", v)}
          />
        </div>
      </div>

      {supplier && (
        <div>
          <h3 className="text-sm font-heading mb-2">ספק</h3>
          <SupplierCard supplier={supplier} compact />
        </div>
      )}

      <div>
        <h3 className="text-sm font-heading mb-2">פעולות ({issue.action_items.length})</h3>
        <ActionItemList items={issue.action_items} />
        <form onSubmit={handleAddAction} className="flex gap-2 mt-3">
          <input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="הוסף פעולה חדשה..."
            className="flex-1 bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-body placeholder:text-text-secondary"
          />
          <Button type="submit" className="text-sm" disabled={!newAction.trim()}>הוסף</Button>
        </form>
      </div>

      <div className="text-xs text-text-secondary font-body space-y-1 pt-4 border-t border-border">
        <div>נוצר: {new Date(issue.created_at).toLocaleDateString("he-IL")}</div>
        {issue.resolved_at && <div>נפתר: {new Date(issue.resolved_at).toLocaleDateString("he-IL")}</div>}
      </div>
    </div>
  );
}
