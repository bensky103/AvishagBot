"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTasks } from "@/lib/queries/tasks";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: tasks } = useTasks();
  const { data: suppliers } = useSuppliers();
  const { data: issues } = useIssues();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.toLowerCase().trim();
  const filteredTasks = q ? (tasks || []).filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5) : [];
  const filteredSuppliers = q ? (suppliers || []).filter((s) => s.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const filteredIssues = q ? (issues || []).filter((i) => i.product_name.toLowerCase().includes(q) || i.problem_description.toLowerCase().includes(q)).slice(0, 3) : [];
  const hasResults = filteredTasks.length > 0 || filteredSuppliers.length > 0 || filteredIssues.length > 0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { if (query) setOpen(true); }}
        placeholder="חיפוש..."
        className="w-full bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-body placeholder:text-text-secondary"
      />

      {open && q && (
        <div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-elevated z-50 max-h-80 overflow-y-auto">
          {!hasResults && (
            <div className="p-3 text-sm text-text-secondary font-body">לא נמצאו תוצאות</div>
          )}

          {filteredTasks.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs text-text-secondary font-body border-b border-border">משימות</div>
              {filteredTasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks?selected=${t.id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-base font-body rounded"
                >
                  {t.title}
                </Link>
              ))}
            </div>
          )}

          {filteredSuppliers.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs text-text-secondary font-body border-b border-border">ספקים</div>
              {filteredSuppliers.map((s) => (
                <Link
                  key={s.id}
                  href={`/suppliers/${s.id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-base font-body rounded"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}

          {filteredIssues.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs text-text-secondary font-body border-b border-border">תקלות</div>
              {filteredIssues.map((i) => (
                <Link
                  key={i.id}
                  href={`/issues/${i.id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-base font-body rounded"
                >
                  {i.product_name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
