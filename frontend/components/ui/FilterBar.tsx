"use client";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function FilterBar({ filters, values, onChange }: FilterBarProps) {
  const activeFilters = Object.entries(values).filter(([, v]) => v !== "");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((f) => (
        <select
          key={f.key}
          value={values[f.key] || ""}
          onChange={(e) => onChange(f.key, e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-body shadow-card"
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      {activeFilters.length > 0 && (
        <div className="flex gap-1">
          {activeFilters.map(([key, val]) => (
            <button
              key={key}
              onClick={() => onChange(key, "")}
              className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md flex items-center gap-1 font-body border border-primary/20"
            >
              {val} &times;
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
