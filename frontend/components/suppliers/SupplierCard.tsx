"use client";

import Link from "next/link";
import type { Supplier } from "@/lib/types";

interface SupplierCardProps {
  supplier: Supplier;
  issueCount?: number;
  compact?: boolean;
}

export function SupplierCard({ supplier, issueCount, compact = false }: SupplierCardProps) {
  if (compact) {
    return (
      <Link
        href={`/suppliers/${supplier.id}`}
        className="block bg-surface rounded-xl p-3 border border-border hover:bg-elevated shadow-card transition-all"
      >
        <div className="font-body text-sm font-bold">{supplier.name}</div>
        {supplier.contact_info && (
          <div className="text-xs text-text-secondary font-body mt-1">{supplier.contact_info}</div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/suppliers/${supplier.id}`}
      className="block bg-surface rounded-xl p-4 border border-border hover:bg-elevated shadow-card transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="font-body font-bold">{supplier.name}</div>
        {issueCount !== undefined && issueCount > 0 && (
          <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-md font-body border border-warning/20">
            {issueCount} תקלות
          </span>
        )}
      </div>
      {supplier.contact_info && (
        <div className="text-sm text-text-secondary font-body mt-1">{supplier.contact_info}</div>
      )}
    </Link>
  );
}
