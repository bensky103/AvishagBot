"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SearchBar } from "./SearchBar";

export function Shell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base text-text-primary flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-surface border-b border-border px-4 py-3 flex items-center gap-4 shadow-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-text-secondary hover:text-primary text-xl"
          >
            ☰
          </button>
          <SearchBar />
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
