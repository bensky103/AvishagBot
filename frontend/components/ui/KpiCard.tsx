"use client";

interface KpiCardProps {
  label: string;
  value: number;
  color?: string;
}

export function KpiCard({ label, value, color = "text-text-primary" }: KpiCardProps) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border shadow-card">
      <div className="text-text-secondary text-sm font-body mb-1">{label}</div>
      <div className={`text-3xl font-heading ${color}`}>{value}</div>
    </div>
  );
}
