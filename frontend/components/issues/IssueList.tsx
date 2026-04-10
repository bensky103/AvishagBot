"use client";

import { useState } from "react";
import { useIssues, useCreateIssue } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { IssueCard } from "./IssueCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function IssueList() {
  const { data: suppliers } = useSuppliers();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);

  const apiFilters: Record<string, string> = {};
  if (filters.status) apiFilters.status = filters.status;
  if (filters.supplier_id) apiFilters.supplier_id = filters.supplier_id;

  const { data: issues, isLoading } = useIssues(
    Object.keys(apiFilters).length > 0 ? apiFilters : undefined
  );

  const supplierMap: Record<number, string> = {};
  suppliers?.forEach((s) => { supplierMap[s.id] = s.name; });

  const ISSUE_FILTERS = [
    {
      key: "status",
      label: "סטטוס",
      options: [
        { value: "open", label: "פתוח" },
        { value: "in_progress", label: "בטיפול" },
        { value: "resolved", label: "נפתר" },
      ],
    },
    {
      key: "supplier_id",
      label: "ספק",
      options: (suppliers || []).map((s) => ({ value: String(s.id), label: s.name })),
    },
  ];

  const [supplierId, setSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const create = useCreateIssue();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !productName.trim() || !arrivalDate || !problemDescription.trim()) return;
    create.mutate(
      {
        supplier_id: Number(supplierId),
        product_name: productName.trim(),
        sku: sku.trim() || undefined,
        arrival_date: arrivalDate,
        problem_description: problemDescription.trim(),
      },
      {
        onSuccess: () => {
          toast("תקלה נוצרה בהצלחה", "success");
          setShowCreate(false);
          setSupplierId(""); setProductName(""); setSku(""); setArrivalDate(""); setProblemDescription("");
        },
        onError: () => toast("שגיאה ביצירת התקלה", "error"),
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading">תקלות</h1>
        <Button onClick={() => setShowCreate(true)} className="text-sm">+ תקלה חדשה</Button>
      </div>

      <div className="mb-4">
        <FilterBar
          filters={ISSUE_FILTERS}
          values={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      </div>

      {isLoading ? (
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      ) : (
        <div className="space-y-2">
          {issues?.length === 0 && (
            <p className="text-text-secondary font-body text-sm">אין תקלות</p>
          )}
          {issues?.map((issue) => (
            <IssueCard key={issue.id} issue={issue} supplierName={supplierMap[issue.supplier_id]} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="תקלה חדשה">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">ספק *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body">
              <option value="">בחר ספק</option>
              {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">שם מוצר *</label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-body text-text-secondary mb-1">מק"ט</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)}
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-body text-text-secondary mb-1">תאריך הגעה *</label>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">תיאור בעיה *</label>
            <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} rows={3}
              className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body resize-y" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button type="submit" disabled={!supplierId || !productName.trim() || !arrivalDate || !problemDescription.trim() || create.isPending}>
              {create.isPending ? "יוצר..." : "צור תקלה"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
