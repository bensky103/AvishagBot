"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-primary hover:bg-primary-dark text-white shadow-card hover:shadow-elevated",
  secondary: "bg-surface hover:bg-base text-text-primary border border-border shadow-card",
  danger: "bg-danger hover:bg-danger/90 text-white shadow-card",
  ghost: "hover:bg-base text-text-secondary hover:text-text-primary",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-body text-sm transition-all disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
