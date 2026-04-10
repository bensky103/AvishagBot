"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import type { IssueReport } from "@/lib/types";

interface IssueCardProps {
  issue: IssueReport;
  supplierName?: string;
}

export function IssueCard({ issue, supplierName }: IssueCardProps) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="block bg-surface rounded-xl p-3 border border-border hover:bg-elevated shadow-card transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-body text-sm">{issue.product_name}</span>
          {supplierName && (
            <span className="text-xs text-text-secondary font-body mr-2"> · {supplierName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={issue.status} />
          <span className="text-xs text-text-secondary font-body">
            {new Date(issue.arrival_date).toLocaleDateString("he-IL")}
          </span>
        </div>
      </div>
    </Link>
  );
}
