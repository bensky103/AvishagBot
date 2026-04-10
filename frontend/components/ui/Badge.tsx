"use client";

import type { Urgency, IssueStatus } from "@/lib/types";

const URGENCY_STYLES: Record<Urgency, string> = {
  low: "bg-base text-text-secondary border border-border",
  medium: "bg-warning/10 text-warning border border-warning/20",
  high: "bg-primary/10 text-primary border border-primary/20",
  critical: "bg-danger/10 text-danger border border-danger/20 animate-pulse",
};

const URGENCY_LABELS: Record<Urgency, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  critical: "קריטית",
};

const STATUS_STYLES: Record<IssueStatus, string> = {
  open: "bg-warning/10 border border-warning/30 text-warning",
  in_progress: "bg-primary text-white",
  resolved: "bg-success text-white",
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  resolved: "נפתר",
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-body ${URGENCY_STYLES[urgency]}`}>
      {URGENCY_LABELS[urgency]}
    </span>
  );
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-body ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
