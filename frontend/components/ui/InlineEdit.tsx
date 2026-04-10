"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  as?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}

export function InlineEdit({
  value,
  onSave,
  as = "input",
  options,
  className = "",
  placeholder,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const save = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer hover:bg-base rounded px-1 -mx-1 transition-colors ${className}`}
      >
        {value || <span className="text-text-secondary italic">{placeholder || "לחץ לעריכה"}</span>}
      </span>
    );
  }

  if (as === "select" && options) {
    return (
      <select
        ref={ref as React.RefObject<HTMLSelectElement>}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setEditing(false);
          if (e.target.value !== value) onSave(e.target.value);
        }}
        onBlur={cancel}
        className="bg-surface border border-border rounded-lg px-2 py-1 text-text-primary font-body"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (as === "textarea") {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
        className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-text-primary font-body resize-y min-h-[80px]"
      />
    );
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") cancel();
      }}
      className="bg-surface border border-border rounded-lg px-2 py-1 text-text-primary font-body"
    />
  );
}
