"use client";

import { useState } from "react";
import { useSuppliers, useCreateSupplier } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { SupplierCard } from "./SupplierCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function SupplierList() {
  const { data: suppliers, isLoading } = useSuppliers();
  const { data: issues } = useIssues();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");
  const create = useCreateSupplier();
  const { toast } = useToast();

  const issueCounts: Record<number, number> = {};
  issues?.forEach((i) => {
    issueCounts[i.supplier_id] = (issueCounts[i.supplier_id] || 0) + 1;
  });

  const [search, setSearch] = useState("");
  const filtered = suppliers?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), contact_info: contactInfo.trim() || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast("ספק נוצר בהצלחה", "success");
          setShowCreate(false);
          setName("");
          setContactInfo("");
          setNotes("");
        },
        onError: () => toast("שגיאה ביצירת הספק", "error"),
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading">ספקים</h1>
        <Button onClick={() => setShowCreate(true)} className="text-sm">+ ספק חדש</Button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="חיפוש ספק..."
        className="w-full max-w-sm bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-body mb-4 placeholder:text-text-secondary"
      />

      {isLoading ? (
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered?.map((s) => (
            <SupplierCard key={s.id} supplier={s} issueCount={issueCounts[s.id]} />
          ))}
          {filtered?.length === 0 && (
            <p className="text-text-secondary font-body text-sm col-span-full">אין ספקים</p>
          )}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="ספק חדש">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">שם *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body" />
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">פרטי קשר</label>
            <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
              className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body" />
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">הערות</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body resize-y" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? "יוצר..." : "צור ספק"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
