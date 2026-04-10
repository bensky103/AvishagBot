"use client";

import Link from "next/link";
import { useSupplier, useUpdateSupplier } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export function SupplierDetail({ supplierId }: { supplierId: number }) {
  const { data: supplier, isLoading } = useSupplier(supplierId);
  const { data: supplierIssues } = useIssues({ supplier_id: String(supplierId) });
  const update = useUpdateSupplier();
  const { toast } = useToast();

  if (isLoading || !supplier) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  const handleUpdate = (field: string, value: string) => {
    update.mutate(
      { id: supplier.id, data: { [field]: value } },
      {
        onSuccess: () => toast("עודכן בהצלחה", "success"),
        onError: () => toast("שגיאה בעדכון", "error"),
      }
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/suppliers" className="text-primary hover:underline font-body text-sm">
        ← חזרה לספקים
      </Link>

      <InlineEdit
        value={supplier.name}
        onSave={(v) => handleUpdate("name", v)}
        className="text-2xl font-heading"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-border shadow-card">
          <h3 className="text-sm font-heading mb-2">פרטי קשר</h3>
          <InlineEdit
            value={supplier.contact_info || ""}
            onSave={(v) => handleUpdate("contact_info", v)}
            placeholder="הוסף פרטי קשר..."
            className="font-body text-sm"
          />
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border shadow-card">
          <h3 className="text-sm font-heading mb-2">הערות</h3>
          <InlineEdit
            value={supplier.notes || ""}
            as="textarea"
            onSave={(v) => handleUpdate("notes", v)}
            placeholder="הוסף הערות..."
            className="font-body text-sm"
          />
        </div>
      </div>

      <section>
        <h3 className="text-lg font-heading mb-3">תקלות ({supplierIssues?.length ?? 0})</h3>
        {!supplierIssues?.length ? (
          <p className="text-text-secondary font-body text-sm">אין תקלות לספק זה</p>
        ) : (
          <div className="space-y-2">
            {supplierIssues?.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="block bg-surface rounded-xl p-3 border border-border hover:bg-elevated shadow-card transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm">{issue.product_name}</span>
                  <StatusBadge status={issue.status} />
                </div>
                <p className="text-xs text-text-secondary font-body mt-1 line-clamp-1">
                  {issue.problem_description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="text-xs text-text-secondary font-body pt-4 border-t border-border">
        נוצר: {new Date(supplier.created_at).toLocaleDateString("he-IL")}
      </div>
    </div>
  );
}
