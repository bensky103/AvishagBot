"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "לוח בקרה", icon: "📊" },
  { href: "/tasks", label: "משימות", icon: "✅" },
  { href: "/suppliers", label: "ספקים", icon: "🏭" },
  { href: "/issues", label: "תקלות", icon: "⚠️" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />
      )}

      <nav
        className={`
          fixed top-0 right-0 h-full w-64 bg-surface border-l border-border z-40 shadow-elevated
          transition-transform duration-200
          md:static md:translate-x-0 md:shadow-none
          ${open ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-heading text-primary">אבישג</h1>
          <p className="text-xs text-text-secondary font-body">ניהול רכש</p>
        </div>

        <ul className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors
                  ${isActive(item.href)
                    ? "bg-primary/10 text-primary font-bold border-r-2 border-primary"
                    : "text-text-secondary hover:bg-base hover:text-text-primary"
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
