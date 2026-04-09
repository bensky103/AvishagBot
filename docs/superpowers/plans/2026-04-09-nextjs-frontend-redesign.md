# Next.js Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Avishag frontend from vanilla HTML/JS to Next.js + React with warm brutalist RTL design, hybrid task interaction, and React Query data layer.

**Architecture:** Next.js 14 App Router with client components only. React Query fetches from existing FastAPI `/api/*` endpoints. Static export for production (no Node.js server). Tailwind CSS with custom warm brutalist tokens.

**Tech Stack:** Next.js 14, React 18, TypeScript, TanStack Query v5, Tailwind CSS 3, next/font

---

## File Map

### New files (frontend-next/)

```
frontend-next/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.ts
├── app/
│   ├── layout.tsx              # Root layout: fonts, RTL, QueryProvider, Shell
│   ├── page.tsx                # Dashboard
│   ├── providers.tsx           # QueryClientProvider wrapper
│   ├── tasks/
│   │   ├── page.tsx            # Task list + panel
│   │   └── [id]/
│   │       └── page.tsx        # Task detail
│   ├── suppliers/
│   │   ├── page.tsx            # Supplier list
│   │   └── [id]/
│   │       └── page.tsx        # Supplier detail
│   └── issues/
│       ├── page.tsx            # Issue list
│       └── [id]/
│           └── page.tsx        # Issue detail
├── components/
│   ├── layout/
│   │   ├── Shell.tsx           # App shell: sidebar + header + main area
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── SearchBar.tsx       # Global search
│   ├── tasks/
│   │   ├── TaskList.tsx        # Task list with filters
│   │   ├── TaskRow.tsx         # Single task row in list
│   │   ├── TaskPanel.tsx       # Slide-over panel
│   │   ├── TaskDetail.tsx      # Full detail page content
│   │   └── TaskForm.tsx        # Create task modal form
│   ├── suppliers/
│   │   ├── SupplierList.tsx    # Supplier list/grid
│   │   ├── SupplierCard.tsx    # Supplier preview card (used in issue detail)
│   │   └── SupplierDetail.tsx  # Full supplier detail
│   ├── issues/
│   │   ├── IssueList.tsx       # Issue list with filters
│   │   ├── IssueCard.tsx       # Issue preview card (used in supplier detail)
│   │   ├── IssueDetail.tsx     # Full issue detail
│   │   └── ActionItemList.tsx  # Action items within issue detail
│   └── ui/
│       ├── Badge.tsx           # Urgency + status badges
│       ├── Button.tsx          # Button component
│       ├── Toast.tsx           # Toast notification system
│       ├── Modal.tsx           # Modal wrapper
│       ├── FilterBar.tsx       # Filter chips + dropdowns
│       ├── InlineEdit.tsx      # Inline editable field
│       └── KpiCard.tsx         # Dashboard stat card
├── lib/
│   ├── api.ts                  # Fetch wrapper for FastAPI
│   ├── types.ts                # TypeScript types
│   └── queries/
│       ├── tasks.ts            # Task query hooks
│       ├── suppliers.ts        # Supplier query hooks
│       └── issues.ts           # Issue query hooks
└── public/
    └── (empty for now)
```

### Backend files to modify

```
app/api/tasks.py        — Add PATCH /{task_id} endpoint
app/api/issues.py       — Add PATCH /{issue_id} endpoint
app/services/task_service.py    — Add update_task function
app/services/issue_service.py   — Add update_issue function
app/main.py             — Update static file serving for Next.js output
```

---

## Task 0: Backend — Add Missing Update Endpoints

The spec requires inline editing for tasks and issues, but the backend has no PATCH endpoints for these. TaskUpdate and IssueReportUpdate schemas already exist.

**Files:**
- Modify: `app/services/task_service.py`
- Modify: `app/api/tasks.py`
- Modify: `app/services/issue_service.py` (check if update exists)
- Modify: `app/api/issues.py`

- [ ] **Step 1: Add update_task to task_service.py**

Add after the `reopen_task` function at the end of the file:

```python
async def update_task(session: AsyncSession, task_id: int, **kwargs) -> Task:
    task = await session.get(Task, task_id)
    for key, value in kwargs.items():
        if value is not None:
            setattr(task, key, value)
    await session.commit()
    await session.refresh(task)
    return task
```

- [ ] **Step 2: Add PATCH route to tasks.py**

Add import for `TaskUpdate` in the imports line (change `TaskCreate, TaskResponse` to `TaskCreate, TaskResponse, TaskUpdate`), then add after the `reopen_task` route:

```python
@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, data: TaskUpdate, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await task_service.update_task(
        session, task_id,
        title=data.title, description=data.description,
        due_date=data.due_date, urgency=data.urgency,
    )
```

- [ ] **Step 3: Check issue_service.py for update function, add if missing**

Read `app/services/issue_service.py`. If no `update_issue` function exists, add:

```python
async def update_issue(session: AsyncSession, issue_id: int, **kwargs) -> IssueReport:
    issue = await session.get(IssueReport, issue_id)
    for key, value in kwargs.items():
        if value is not None:
            setattr(issue, key, value)
    await session.commit()
    await session.refresh(issue)
    return issue
```

- [ ] **Step 4: Add PATCH route to issues.py**

Add import for `IssueReportUpdate` and add route:

```python
@router.patch("/{issue_id}", response_model=IssueReportResponse)
async def update_issue(issue_id: int, data: IssueReportUpdate, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await issue_service.update_issue(
        session, issue_id,
        product_name=data.product_name, sku=data.sku,
        problem_description=data.problem_description, status=data.status,
    )
```

- [ ] **Step 5: Test the endpoints manually**

Run: `curl -X PATCH http://localhost:8000/api/tasks/1 -H "Content-Type: application/json" -d '{"urgency":"high"}'`
Expected: 200 response with updated task JSON

- [ ] **Step 6: Commit**

```bash
git add app/services/task_service.py app/api/tasks.py app/services/issue_service.py app/api/issues.py
git commit -m "feat: add PATCH endpoints for tasks and issues"
```

---

## Task 1: Next.js Project Scaffold

**Files:**
- Create: `frontend-next/package.json`
- Create: `frontend-next/tsconfig.json`
- Create: `frontend-next/tailwind.config.ts`
- Create: `frontend-next/postcss.config.js`
- Create: `frontend-next/next.config.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "C:/Users/Guy Bensky/Desktop/Elevize/Avishag"
npx create-next-app@14 frontend-next --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend-next
npm install @tanstack/react-query
```

- [ ] **Step 3: Configure Tailwind with design tokens**

Replace `frontend-next/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#C45D3E", dark: "#A34830" },
        surface: "#16213e",
        elevated: "#0f3460",
        base: "#1a1a2e",
        "text-primary": "#f0e6d3",
        "text-secondary": "#a89b8c",
        border: "#2a2a4a",
        success: "#4CAF50",
        warning: "#FF9800",
        danger: "#e74c3c",
      },
      fontFamily: {
        heading: ["var(--font-secular-one)", "sans-serif"],
        body: ["var(--font-heebo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Configure next.config.ts with API proxy and static export**

Replace `frontend-next/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
    ];
  },
};

export default nextConfig;
```

Note: `rewrites` only works in dev mode. In production, FastAPI handles `/api/*` directly.

- [ ] **Step 5: Verify dev server starts**

```bash
cd frontend-next
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000

- [ ] **Step 6: Commit**

```bash
git add frontend-next/
git commit -m "feat: scaffold Next.js project with Tailwind design tokens"
```

---

## Task 2: TypeScript Types + API Client + React Query Provider

**Files:**
- Create: `frontend-next/lib/types.ts`
- Create: `frontend-next/lib/api.ts`
- Create: `frontend-next/app/providers.tsx`

- [ ] **Step 1: Create TypeScript types**

Create `frontend-next/lib/types.ts`:

```typescript
export type Urgency = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "in_progress" | "resolved";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  urgency: Urgency;
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  contact_info: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActionItem {
  id: number;
  issue_report_id: number;
  task_id: number | null;
  description: string;
  is_completed: boolean;
  created_at: string;
}

export interface IssueReport {
  id: number;
  supplier_id: number;
  product_name: string;
  sku: string | null;
  arrival_date: string;
  problem_description: string;
  status: IssueStatus;
  created_at: string;
  resolved_at: string | null;
  action_items: ActionItem[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date?: string;
  urgency?: Urgency;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  urgency?: Urgency;
}

export interface SupplierCreate {
  name: string;
  contact_info?: string;
  notes?: string;
}

export interface SupplierUpdate {
  name?: string;
  contact_info?: string;
  notes?: string;
}

export interface IssueCreate {
  supplier_id: number;
  product_name: string;
  sku?: string;
  arrival_date: string;
  problem_description: string;
}

export interface IssueUpdate {
  product_name?: string;
  sku?: string;
  problem_description?: string;
  status?: IssueStatus;
}

export interface ActionItemCreate {
  description: string;
  task_id?: number;
}
```

- [ ] **Step 2: Create API client**

Create `frontend-next/lib/api.ts`:

```typescript
const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Tasks
export const tasks = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<import("./types").Task[]>(`/tasks/${qs}`);
  },
  get: (id: number) => request<import("./types").Task>(`/tasks/${id}`),
  create: (data: import("./types").TaskCreate) =>
    request<import("./types").Task>("/tasks/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: import("./types").TaskUpdate) =>
    request<import("./types").Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  complete: (id: number) =>
    request<import("./types").Task>(`/tasks/${id}/complete`, { method: "POST" }),
  reopen: (id: number) =>
    request<import("./types").Task>(`/tasks/${id}/reopen`, { method: "POST" }),
};

// Suppliers
export const suppliers = {
  list: () => request<import("./types").Supplier[]>("/suppliers/"),
  get: (id: number) => request<import("./types").Supplier>(`/suppliers/${id}`),
  create: (data: import("./types").SupplierCreate) =>
    request<import("./types").Supplier>("/suppliers/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: import("./types").SupplierUpdate) =>
    request<import("./types").Supplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// Issues
export const issues = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<import("./types").IssueReport[]>(`/issues/${qs}`);
  },
  get: (id: number) => request<import("./types").IssueReport>(`/issues/${id}`),
  create: (data: import("./types").IssueCreate) =>
    request<import("./types").IssueReport>("/issues/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: import("./types").IssueUpdate) =>
    request<import("./types").IssueReport>(`/issues/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  resolve: (id: number) =>
    request<import("./types").IssueReport>(`/issues/${id}/resolve`, { method: "POST" }),
  reopen: (id: number) =>
    request<import("./types").IssueReport>(`/issues/${id}/reopen`, { method: "POST" }),
  addActionItem: (issueId: number, data: import("./types").ActionItemCreate) =>
    request<import("./types").ActionItem>(`/issues/${issueId}/action-items`, { method: "POST", body: JSON.stringify(data) }),
  completeActionItem: (actionItemId: number) =>
    request<import("./types").ActionItem>(`/issues/action-items/${actionItemId}/complete`, { method: "POST" }),
  uncompleteActionItem: (actionItemId: number) =>
    request<import("./types").ActionItem>(`/issues/action-items/${actionItemId}/uncomplete`, { method: "POST" }),
};
```

- [ ] **Step 3: Create QueryClient provider**

Create `frontend-next/app/providers.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend-next/lib/ frontend-next/app/providers.tsx
git commit -m "feat: add TypeScript types, API client, and React Query provider"
```

---

## Task 3: React Query Hooks

**Files:**
- Create: `frontend-next/lib/queries/tasks.ts`
- Create: `frontend-next/lib/queries/suppliers.ts`
- Create: `frontend-next/lib/queries/issues.ts`

- [ ] **Step 1: Create task query hooks**

Create `frontend-next/lib/queries/tasks.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasks as api } from "../api";
import type { Task, TaskCreate, TaskUpdate } from "../types";

export function useTasks(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => api.list(filters),
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.get(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskUpdate }) => api.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks", id] });
      const prev = qc.getQueryData<Task>(["tasks", id]);
      if (prev) {
        qc.setQueryData(["tasks", id], { ...prev, ...data });
      }
      return { prev };
    },
    onError: (_err, { id }, context) => {
      if (context?.prev) qc.setQueryData(["tasks", id], context.prev);
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Task) =>
      task.is_completed ? api.reopen(task.id) : api.complete(task.id),
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: ["tasks", task.id] });
      const prev = qc.getQueryData<Task>(["tasks", task.id]);
      qc.setQueryData(["tasks", task.id], {
        ...task,
        is_completed: !task.is_completed,
      });
      // Also update list cache
      qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
        old?.map((t) =>
          t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
        )
      );
      return { prev };
    },
    onError: (_err, task, context) => {
      if (context?.prev) qc.setQueryData(["tasks", task.id], context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
```

- [ ] **Step 2: Create supplier query hooks**

Create `frontend-next/lib/queries/suppliers.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { suppliers as api } from "../api";
import type { SupplierCreate, SupplierUpdate } from "../types";

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.list(),
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => api.get(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierCreate) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierUpdate }) => api.update(id, data),
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["suppliers", id] });
    },
  });
}
```

- [ ] **Step 3: Create issue query hooks**

Create `frontend-next/lib/queries/issues.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { issues as api } from "../api";
import type { ActionItemCreate, IssueCreate, IssueReport, IssueUpdate } from "../types";

export function useIssues(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["issues", filters],
    queryFn: () => api.list(filters),
  });
}

export function useIssue(id: number) {
  return useQuery({
    queryKey: ["issues", id],
    queryFn: () => api.get(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IssueCreate) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IssueUpdate }) => api.update(id, data),
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["issues", id] });
    },
  });
}

export function useResolveIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.resolve(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["issues", id] });
      const prev = qc.getQueryData<IssueReport>(["issues", id]);
      if (prev) {
        qc.setQueryData(["issues", id], { ...prev, status: "resolved" });
      }
      return { prev };
    },
    onError: (_err, id, context) => {
      if (context?.prev) qc.setQueryData(["issues", id], context.prev);
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["issues", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: number; data: ActionItemCreate }) =>
      api.addActionItem(issueId, data),
    onSettled: (_data, _err, { issueId }) => {
      qc.invalidateQueries({ queryKey: ["issues", issueId] });
    },
  });
}

export function useToggleActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      isCompleted ? api.uncompleteActionItem(id) : api.completeActionItem(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend-next/lib/queries/
git commit -m "feat: add React Query hooks for tasks, suppliers, and issues"
```

---

## Task 4: UI Primitives — Badge, Button, Toast, Modal, InlineEdit, KpiCard

**Files:**
- Create: `frontend-next/components/ui/Badge.tsx`
- Create: `frontend-next/components/ui/Button.tsx`
- Create: `frontend-next/components/ui/Toast.tsx`
- Create: `frontend-next/components/ui/Modal.tsx`
- Create: `frontend-next/components/ui/InlineEdit.tsx`
- Create: `frontend-next/components/ui/KpiCard.tsx`
- Create: `frontend-next/components/ui/FilterBar.tsx`

- [ ] **Step 1: Create Badge component**

Create `frontend-next/components/ui/Badge.tsx`:

```tsx
"use client";

import type { Urgency, IssueStatus } from "@/lib/types";

const URGENCY_STYLES: Record<Urgency, string> = {
  low: "bg-surface text-text-secondary",
  medium: "bg-warning/20 text-warning",
  high: "bg-primary/20 text-primary",
  critical: "bg-danger/20 text-danger animate-pulse",
};

const URGENCY_LABELS: Record<Urgency, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  critical: "קריטית",
};

const STATUS_STYLES: Record<IssueStatus, string> = {
  open: "border border-warning text-warning",
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
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-body ${URGENCY_STYLES[urgency]}`}>
      {URGENCY_LABELS[urgency]}
    </span>
  );
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-body ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 2: Create Button component**

Create `frontend-next/components/ui/Button.tsx`:

```tsx
"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-primary hover:bg-primary-dark text-white",
  secondary: "bg-surface hover:bg-elevated text-text-primary border border-border",
  danger: "bg-danger hover:bg-danger/80 text-white",
  ghost: "hover:bg-surface text-text-secondary",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded font-body text-sm transition-colors disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Create Toast system**

Create `frontend-next/components/ui/Toast.tsx`:

```tsx
"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const TYPE_STYLES: Record<ToastType, string> = {
    success: "bg-success",
    error: "bg-danger",
    info: "bg-elevated",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${TYPE_STYLES[t.type]} text-white px-4 py-2 rounded shadow-lg font-body text-sm animate-in slide-in-from-left`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 4: Create Modal component**

Create `frontend-next/components/ui/Modal.tsx`:

```tsx
"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-elevated rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create InlineEdit component**

Create `frontend-next/components/ui/InlineEdit.tsx`:

```tsx
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
        className={`cursor-pointer hover:bg-surface/50 rounded px-1 -mx-1 transition-colors ${className}`}
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
        className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-body"
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
        className="w-full bg-surface border border-border rounded px-2 py-1 text-text-primary font-body resize-y min-h-[80px]"
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
      className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-body"
    />
  );
}
```

- [ ] **Step 6: Create KpiCard component**

Create `frontend-next/components/ui/KpiCard.tsx`:

```tsx
"use client";

interface KpiCardProps {
  label: string;
  value: number;
  color?: string;
}

export function KpiCard({ label, value, color = "text-text-primary" }: KpiCardProps) {
  return (
    <div className="bg-surface rounded-lg p-4 border border-border">
      <div className="text-text-secondary text-sm font-body mb-1">{label}</div>
      <div className={`text-3xl font-heading ${color}`}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 7: Create FilterBar component**

Create `frontend-next/components/ui/FilterBar.tsx`:

```tsx
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
          className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-text-primary font-body"
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
              className="bg-primary/20 text-primary text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
            >
              {val} &times;
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend-next/components/ui/
git commit -m "feat: add UI primitive components (Badge, Button, Toast, Modal, InlineEdit, KpiCard, FilterBar)"
```

---

## Task 5: App Shell — Layout, Sidebar, SearchBar

**Files:**
- Create: `frontend-next/components/layout/Sidebar.tsx`
- Create: `frontend-next/components/layout/SearchBar.tsx`
- Create: `frontend-next/components/layout/Shell.tsx`
- Modify: `frontend-next/app/layout.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `frontend-next/components/layout/Sidebar.tsx`:

```tsx
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
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}

      <nav
        className={`
          fixed top-0 right-0 h-full w-64 bg-elevated border-l border-border z-40
          transition-transform duration-200
          md:static md:translate-x-0
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
                  flex items-center gap-3 px-3 py-2 rounded font-body text-sm transition-colors
                  ${isActive(item.href)
                    ? "bg-primary/20 text-primary border-r-2 border-primary"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
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
```

- [ ] **Step 2: Create SearchBar component**

Create `frontend-next/components/layout/SearchBar.tsx`:

```tsx
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
        className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm text-text-primary font-body placeholder:text-text-secondary"
      />

      {open && q && (
        <div className="absolute top-full mt-1 w-full bg-elevated border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
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
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-surface font-body"
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
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-surface font-body"
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
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-surface font-body"
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
```

- [ ] **Step 3: Create Shell component**

Create `frontend-next/components/layout/Shell.tsx`:

```tsx
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
        {/* Header */}
        <header className="bg-elevated border-b border-border px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-text-secondary hover:text-text-primary text-xl"
          >
            ☰
          </button>
          <SearchBar />
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update root layout.tsx**

Replace `frontend-next/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Secular_One, Heebo } from "next/font/google";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/ui/Toast";
import { Shell } from "@/components/layout/Shell";
import "./globals.css";

const secularOne = Secular_One({
  weight: "400",
  subsets: ["hebrew", "latin"],
  variable: "--font-secular-one",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "אבישג - ניהול רכש",
  description: "מערכת ניהול רכש",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${secularOne.variable} ${heebo.variable}`}>
      <body className="bg-base font-body">
        <Providers>
          <ToastProvider>
            <Shell>{children}</Shell>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Update globals.css**

Replace `frontend-next/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
  }

  body {
    color: #f0e6d3;
    background: #1a1a2e;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #1a1a2e;
  }
  ::-webkit-scrollbar-thumb {
    background: #2a2a4a;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #C45D3E;
  }
}

/* Animations */
@keyframes slide-in-from-left {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-in.slide-in-from-left {
  animation: slide-in-from-left 0.2s ease-out;
}
```

- [ ] **Step 6: Verify layout renders**

```bash
cd frontend-next && npm run dev
```

Open http://localhost:3000 — should see sidebar with nav items, header with search bar, and empty main area.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/components/layout/ frontend-next/app/layout.tsx frontend-next/app/globals.css
git commit -m "feat: add app shell with sidebar, search bar, and responsive layout"
```

---

## Task 6: Dashboard Page

**Files:**
- Modify: `frontend-next/app/page.tsx`

- [ ] **Step 1: Implement dashboard page**

Replace `frontend-next/app/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useTasks } from "@/lib/queries/tasks";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { KpiCard } from "@/components/ui/KpiCard";
import { UrgencyBadge, StatusBadge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { data: issues, isLoading: loadingIssues } = useIssues();

  const openTasks = tasks?.filter((t) => !t.is_completed) || [];
  const overdueTasks = openTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  );
  const openIssues = issues?.filter((i) => i.status !== "resolved") || [];

  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const needsAttention = openTasks
    .filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return due <= weekFromNow;
    })
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 3) -
             (urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 3);
    });

  if (loadingTasks || loadingSuppliers || loadingIssues) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading">לוח בקרה</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="משימות פתוחות" value={openTasks.length} />
        <KpiCard label="משימות באיחור" value={overdueTasks.length} color="text-danger" />
        <KpiCard label="תקלות פתוחות" value={openIssues.length} color="text-warning" />
        <KpiCard label="ספקים" value={suppliers?.length || 0} />
      </div>

      {/* Needs Attention */}
      <section>
        <h2 className="text-lg font-heading mb-3">דורש טיפול</h2>
        {needsAttention.length === 0 ? (
          <p className="text-text-secondary font-body text-sm">אין משימות דחופות השבוע 🎉</p>
        ) : (
          <div className="space-y-2">
            {needsAttention.map((task) => (
              <Link
                key={task.id}
                href={`/tasks?selected=${task.id}`}
                className="block bg-surface hover:bg-elevated rounded-lg p-3 border border-border transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <UrgencyBadge urgency={task.urgency} />
                    {task.due_date && (
                      <span className={`text-xs font-body ${
                        new Date(task.due_date) < today ? "text-danger" : "text-text-secondary"
                      }`}>
                        {new Date(task.due_date).toLocaleDateString("he-IL")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Issues */}
      <section>
        <h2 className="text-lg font-heading mb-3">תקלות אחרונות</h2>
        {openIssues.length === 0 ? (
          <p className="text-text-secondary font-body text-sm">אין תקלות פתוחות</p>
        ) : (
          <div className="space-y-2">
            {openIssues.slice(0, 5).map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="block bg-surface hover:bg-elevated rounded-lg p-3 border border-border transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm">{issue.product_name}</span>
                  <StatusBadge status={issue.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/app/page.tsx
git commit -m "feat: add action-oriented dashboard with KPIs and needs-attention lists"
```

---

## Task 7: Task List + Slide-Over Panel

**Files:**
- Create: `frontend-next/components/tasks/TaskRow.tsx`
- Create: `frontend-next/components/tasks/TaskPanel.tsx`
- Create: `frontend-next/components/tasks/TaskList.tsx`
- Create: `frontend-next/components/tasks/TaskForm.tsx`
- Modify: `frontend-next/app/tasks/page.tsx`

- [ ] **Step 1: Create TaskRow component**

Create `frontend-next/components/tasks/TaskRow.tsx`:

```tsx
"use client";

import { UrgencyBadge } from "@/components/ui/Badge";
import { useToggleTask } from "@/lib/queries/tasks";
import type { Task } from "@/lib/types";

interface TaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: (id: number) => void;
}

export function TaskRow({ task, selected, onSelect }: TaskRowProps) {
  const toggle = useToggleTask();

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
        ${selected ? "bg-elevated border-primary" : "bg-surface border-border hover:bg-elevated"}
        ${task.is_completed ? "opacity-60" : ""}
      `}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle.mutate(task);
        }}
        className={`
          w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${task.is_completed ? "bg-success border-success text-white" : "border-border hover:border-primary"}
        `}
      >
        {task.is_completed && "✓"}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-body text-sm ${task.is_completed ? "line-through" : ""}`}>
          {task.title}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <UrgencyBadge urgency={task.urgency} />
        {task.due_date && (
          <span className={`text-xs font-body ${
            !task.is_completed && new Date(task.due_date) < new Date()
              ? "text-danger"
              : "text-text-secondary"
          }`}>
            {new Date(task.due_date).toLocaleDateString("he-IL")}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TaskPanel component**

Create `frontend-next/components/tasks/TaskPanel.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useTask, useToggleTask, useUpdateTask } from "@/lib/queries/tasks";
import { UrgencyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InlineEdit } from "@/components/ui/InlineEdit";
import type { Urgency } from "@/lib/types";

interface TaskPanelProps {
  taskId: number;
  onClose: () => void;
}

const URGENCY_OPTIONS = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "critical", label: "קריטית" },
];

export function TaskPanel({ taskId, onClose }: TaskPanelProps) {
  const { data: task, isLoading } = useTask(taskId);
  const toggle = useToggleTask();
  const update = useUpdateTask();

  if (isLoading || !task) {
    return (
      <div className="w-80 lg:w-96 bg-elevated border-s border-border p-4">
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-96 bg-elevated border-s border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-heading text-lg truncate">{task.title}</h2>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl flex-shrink-0">
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Urgency */}
        <div>
          <div className="text-xs text-text-secondary font-body mb-1">דחיפות</div>
          <InlineEdit
            value={task.urgency}
            as="select"
            options={URGENCY_OPTIONS}
            onSave={(val) => update.mutate({ id: task.id, data: { urgency: val as Urgency } })}
          />
        </div>

        {/* Due date */}
        <div>
          <div className="text-xs text-text-secondary font-body mb-1">תאריך יעד</div>
          <span className={`font-body text-sm ${
            task.due_date && !task.is_completed && new Date(task.due_date) < new Date()
              ? "text-danger" : "text-text-primary"
          }`}>
            {task.due_date ? new Date(task.due_date).toLocaleDateString("he-IL") : "לא הוגדר"}
          </span>
        </div>

        {/* Description */}
        <div>
          <div className="text-xs text-text-secondary font-body mb-1">תיאור</div>
          <p className="font-body text-sm text-text-primary line-clamp-3">
            {task.description || "אין תיאור"}
          </p>
        </div>

        {/* Status */}
        <div>
          <div className="text-xs text-text-secondary font-body mb-1">סטטוס</div>
          <Button
            variant={task.is_completed ? "secondary" : "primary"}
            onClick={() => toggle.mutate(task)}
            className="text-sm"
          >
            {task.is_completed ? "פתח מחדש" : "סמן כבוצע"}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link href={`/tasks/${task.id}`}>
          <Button variant="secondary" className="w-full text-sm">
            פתח דף מלא →
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create TaskForm component**

Create `frontend-next/components/tasks/TaskForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCreateTask } from "@/lib/queries/tasks";
import { useToast } from "@/components/ui/Toast";
import type { Urgency } from "@/lib/types";

interface TaskFormProps {
  onClose: () => void;
}

export function TaskForm({ onClose }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const create = useCreateTask();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        urgency,
      },
      {
        onSuccess: () => {
          toast("משימה נוצרה בהצלחה", "success");
          onClose();
        },
        onError: () => toast("שגיאה ביצירת המשימה", "error"),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-body text-text-secondary mb-1">כותרת *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-body text-text-secondary mb-1">תיאור</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body resize-y"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-body text-text-secondary mb-1">תאריך יעד</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-body text-text-secondary mb-1">דחיפות</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency)}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body"
          >
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="critical">קריטית</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
        <Button type="submit" disabled={!title.trim() || create.isPending}>
          {create.isPending ? "יוצר..." : "צור משימה"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create TaskList component**

Create `frontend-next/components/tasks/TaskList.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTasks } from "@/lib/queries/tasks";
import { TaskRow } from "./TaskRow";
import { FilterBar } from "@/components/ui/FilterBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TaskForm } from "./TaskForm";

const TASK_FILTERS = [
  {
    key: "status",
    label: "סטטוס",
    options: [
      { value: "open", label: "פתוח" },
      { value: "completed", label: "הושלם" },
    ],
  },
  {
    key: "urgency",
    label: "דחיפות",
    options: [
      { value: "low", label: "נמוכה" },
      { value: "medium", label: "בינונית" },
      { value: "high", label: "גבוהה" },
      { value: "critical", label: "קריטית" },
    ],
  },
];

interface TaskListProps {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function TaskList({ selectedId, onSelect }: TaskListProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);

  const apiFilters: Record<string, string> = {};
  if (filters.status) apiFilters.status = filters.status;
  if (filters.urgency) apiFilters.urgency = filters.urgency;

  const { data: tasks, isLoading } = useTasks(
    Object.keys(apiFilters).length > 0 ? apiFilters : undefined
  );

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading">משימות</h1>
        <Button onClick={() => setShowCreate(true)} className="text-sm">+ משימה חדשה</Button>
      </div>

      <div className="mb-4">
        <FilterBar
          filters={TASK_FILTERS}
          values={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      </div>

      {isLoading ? (
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      ) : (
        <div className="space-y-2">
          {tasks?.length === 0 && (
            <p className="text-text-secondary font-body text-sm">אין משימות</p>
          )}
          {tasks?.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={task.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="משימה חדשה">
        <TaskForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
```

- [ ] **Step 5: Create tasks page with panel**

Replace `frontend-next/app/tasks/page.tsx`:

```tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskPanel } from "@/components/tasks/TaskPanel";

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedId = searchParams.get("selected")
    ? Number(searchParams.get("selected"))
    : null;

  const setSelected = (id: number | null) => {
    if (id) {
      router.replace(`/tasks?selected=${id}`, { scroll: false });
    } else {
      router.replace("/tasks", { scroll: false });
    }
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-64px)] -m-4 md:-m-6">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <TaskList selectedId={selectedId} onSelect={setSelected} />
      </div>

      {selectedId && (
        <TaskPanel taskId={selectedId} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify tasks page works**

With FastAPI running on port 8000, open http://localhost:3000/tasks. Should see task list with filters. Clicking a task should open the slide-over panel.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/components/tasks/ frontend-next/app/tasks/
git commit -m "feat: add task list page with slide-over panel, filters, and create form"
```

---

## Task 8: Task Detail Page

**Files:**
- Create: `frontend-next/components/tasks/TaskDetail.tsx`
- Modify: `frontend-next/app/tasks/[id]/page.tsx`

- [ ] **Step 1: Create TaskDetail component**

Create `frontend-next/components/tasks/TaskDetail.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useTask, useUpdateTask, useToggleTask } from "@/lib/queries/tasks";
import { UrgencyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { useToast } from "@/components/ui/Toast";
import type { Urgency } from "@/lib/types";

const URGENCY_OPTIONS = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "critical", label: "קריטית" },
];

export function TaskDetail({ taskId }: { taskId: number }) {
  const { data: task, isLoading } = useTask(taskId);
  const update = useUpdateTask();
  const toggle = useToggleTask();
  const { toast } = useToast();

  if (isLoading || !task) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  const handleUpdate = (field: string, value: string) => {
    update.mutate(
      { id: task.id, data: { [field]: value } },
      {
        onSuccess: () => toast("עודכן בהצלחה", "success"),
        onError: () => toast("שגיאה בעדכון", "error"),
      }
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link href="/tasks" className="text-primary hover:underline font-body text-sm">
        ← חזרה למשימות
      </Link>

      {/* Title */}
      <div>
        <InlineEdit
          value={task.title}
          onSave={(v) => handleUpdate("title", v)}
          className="text-2xl font-heading"
        />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">דחיפות</span>
          <InlineEdit
            value={task.urgency}
            as="select"
            options={URGENCY_OPTIONS}
            onSave={(v) => handleUpdate("urgency", v)}
          />
        </div>
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">תאריך יעד</span>
          <InlineEdit
            value={task.due_date || ""}
            onSave={(v) => handleUpdate("due_date", v)}
            placeholder="לא הוגדר"
          />
        </div>
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">סטטוס</span>
          <Button
            variant={task.is_completed ? "secondary" : "primary"}
            onClick={() => toggle.mutate(task)}
            className="text-sm"
          >
            {task.is_completed ? "פתח מחדש" : "סמן כבוצע"}
          </Button>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-heading mb-2">תיאור</h3>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <InlineEdit
            value={task.description || ""}
            as="textarea"
            onSave={(v) => handleUpdate("description", v)}
            placeholder="הוסף תיאור..."
          />
        </div>
      </div>

      {/* Metadata footer */}
      <div className="text-xs text-text-secondary font-body space-y-1 pt-4 border-t border-border">
        <div>נוצר: {new Date(task.created_at).toLocaleDateString("he-IL")}</div>
        {task.completed_at && (
          <div>הושלם: {new Date(task.completed_at).toLocaleDateString("he-IL")}</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create task detail page**

Create `frontend-next/app/tasks/[id]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { TaskDetail } from "@/components/tasks/TaskDetail";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TaskDetail taskId={Number(id)} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend-next/components/tasks/TaskDetail.tsx frontend-next/app/tasks/\[id\]/
git commit -m "feat: add task detail page with inline editing"
```

---

## Task 9: Supplier List + Detail Pages

**Files:**
- Create: `frontend-next/components/suppliers/SupplierList.tsx`
- Create: `frontend-next/components/suppliers/SupplierCard.tsx`
- Create: `frontend-next/components/suppliers/SupplierDetail.tsx`
- Modify: `frontend-next/app/suppliers/page.tsx`
- Create: `frontend-next/app/suppliers/[id]/page.tsx`

- [ ] **Step 1: Create SupplierCard component**

Create `frontend-next/components/suppliers/SupplierCard.tsx`:

```tsx
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
        className="block bg-surface rounded-lg p-3 border border-border hover:bg-elevated transition-colors"
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
      className="block bg-surface rounded-lg p-4 border border-border hover:bg-elevated transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="font-body font-bold">{supplier.name}</div>
        {issueCount !== undefined && issueCount > 0 && (
          <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded font-body">
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
```

- [ ] **Step 2: Create SupplierList component**

Create `frontend-next/components/suppliers/SupplierList.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSuppliers, useCreateSupplier } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { SupplierCard } from "./SupplierCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function SupplierList() {
  const { data: suppliers, isLoading } = useSuppliers();
  const { data: issues } = useIssues();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");
  const create = useCreateSupplier();
  const { toast } = useToast();

  const issueCounts: Record<number, number> = {};
  issues?.forEach((i) => {
    issueCounts[i.supplier_id] = (issueCounts[i.supplier_id] || 0) + 1;
  });

  const [search, setSearch] = useState("");
  const filtered = suppliers?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), contact_info: contactInfo.trim() || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast("ספק נוצר בהצלחה", "success");
          setShowCreate(false);
          setName("");
          setContactInfo("");
          setNotes("");
        },
        onError: () => toast("שגיאה ביצירת הספק", "error"),
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading">ספקים</h1>
        <Button onClick={() => setShowCreate(true)} className="text-sm">+ ספק חדש</Button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="חיפוש ספק..."
        className="w-full max-w-sm bg-surface border border-border rounded px-3 py-1.5 text-sm text-text-primary font-body mb-4 placeholder:text-text-secondary"
      />

      {isLoading ? (
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered?.map((s) => (
            <SupplierCard key={s.id} supplier={s} issueCount={issueCounts[s.id]} />
          ))}
          {filtered?.length === 0 && (
            <p className="text-text-secondary font-body text-sm col-span-full">אין ספקים</p>
          )}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="ספק חדש">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">שם *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body" />
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">פרטי קשר</label>
            <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body" />
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">הערות</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body resize-y" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? "יוצר..." : "צור ספק"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Create SupplierDetail component**

Create `frontend-next/components/suppliers/SupplierDetail.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useSupplier, useUpdateSupplier } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export function SupplierDetail({ supplierId }: { supplierId: number }) {
  const { data: supplier, isLoading } = useSupplier(supplierId);
  const { data: allIssues } = useIssues();
  const update = useUpdateSupplier();
  const { toast } = useToast();

  const supplierIssues = allIssues?.filter((i) => i.supplier_id === supplierId) || [];

  if (isLoading || !supplier) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  const handleUpdate = (field: string, value: string) => {
    update.mutate(
      { id: supplier.id, data: { [field]: value } },
      {
        onSuccess: () => toast("עודכן בהצלחה", "success"),
        onError: () => toast("שגיאה בעדכון", "error"),
      }
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/suppliers" className="text-primary hover:underline font-body text-sm">
        ← חזרה לספקים
      </Link>

      <InlineEdit
        value={supplier.name}
        onSave={(v) => handleUpdate("name", v)}
        className="text-2xl font-heading"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <h3 className="text-sm font-heading mb-2">פרטי קשר</h3>
          <InlineEdit
            value={supplier.contact_info || ""}
            onSave={(v) => handleUpdate("contact_info", v)}
            placeholder="הוסף פרטי קשר..."
            className="font-body text-sm"
          />
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <h3 className="text-sm font-heading mb-2">הערות</h3>
          <InlineEdit
            value={supplier.notes || ""}
            as="textarea"
            onSave={(v) => handleUpdate("notes", v)}
            placeholder="הוסף הערות..."
            className="font-body text-sm"
          />
        </div>
      </div>

      {/* Issues section */}
      <section>
        <h3 className="text-lg font-heading mb-3">תקלות ({supplierIssues.length})</h3>
        {supplierIssues.length === 0 ? (
          <p className="text-text-secondary font-body text-sm">אין תקלות לספק זה</p>
        ) : (
          <div className="space-y-2">
            {supplierIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="block bg-surface rounded-lg p-3 border border-border hover:bg-elevated transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm">{issue.product_name}</span>
                  <StatusBadge status={issue.status} />
                </div>
                <p className="text-xs text-text-secondary font-body mt-1 line-clamp-1">
                  {issue.problem_description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="text-xs text-text-secondary font-body pt-4 border-t border-border">
        נוצר: {new Date(supplier.created_at).toLocaleDateString("he-IL")}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create supplier pages**

Replace `frontend-next/app/suppliers/page.tsx`:

```tsx
import { SupplierList } from "@/components/suppliers/SupplierList";

export default function SuppliersPage() {
  return <SupplierList />;
}
```

Create `frontend-next/app/suppliers/[id]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { SupplierDetail } from "@/components/suppliers/SupplierDetail";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SupplierDetail supplierId={Number(id)} />;
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend-next/components/suppliers/ frontend-next/app/suppliers/
git commit -m "feat: add supplier list and detail pages with inline editing"
```

---

## Task 10: Issue List + Detail Pages

**Files:**
- Create: `frontend-next/components/issues/IssueList.tsx`
- Create: `frontend-next/components/issues/IssueCard.tsx`
- Create: `frontend-next/components/issues/IssueDetail.tsx`
- Create: `frontend-next/components/issues/ActionItemList.tsx`
- Modify: `frontend-next/app/issues/page.tsx`
- Create: `frontend-next/app/issues/[id]/page.tsx`

- [ ] **Step 1: Create IssueCard component**

Create `frontend-next/components/issues/IssueCard.tsx`:

```tsx
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
      className="block bg-surface rounded-lg p-3 border border-border hover:bg-elevated transition-colors"
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
```

- [ ] **Step 2: Create ActionItemList component**

Create `frontend-next/components/issues/ActionItemList.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useToggleActionItem } from "@/lib/queries/issues";
import type { ActionItem } from "@/lib/types";

interface ActionItemListProps {
  items: ActionItem[];
}

export function ActionItemList({ items }: ActionItemListProps) {
  const toggle = useToggleActionItem();

  if (items.length === 0) {
    return <p className="text-text-secondary font-body text-sm">אין פעולות</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 bg-surface rounded p-3 border border-border">
          <button
            onClick={() => toggle.mutate({ id: item.id, isCompleted: item.is_completed })}
            className={`
              w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center text-xs transition-colors
              ${item.is_completed ? "bg-success border-success text-white" : "border-border hover:border-primary"}
            `}
          >
            {item.is_completed && "✓"}
          </button>
          <div className="flex-1">
            <span className={`font-body text-sm ${item.is_completed ? "line-through opacity-60" : ""}`}>
              {item.description}
            </span>
            {item.task_id && (
              <Link
                href={`/tasks?selected=${item.task_id}`}
                className="block text-xs text-primary hover:underline font-body mt-1"
              >
                משימה מקושרת →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create IssueList component**

Create `frontend-next/components/issues/IssueList.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useIssues, useCreateIssue } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { IssueCard } from "./IssueCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function IssueList() {
  const { data: suppliers } = useSuppliers();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);

  const apiFilters: Record<string, string> = {};
  if (filters.status) apiFilters.status = filters.status;
  if (filters.supplier_id) apiFilters.supplier_id = filters.supplier_id;

  const { data: issues, isLoading } = useIssues(
    Object.keys(apiFilters).length > 0 ? apiFilters : undefined
  );

  const supplierMap: Record<number, string> = {};
  suppliers?.forEach((s) => { supplierMap[s.id] = s.name; });

  const ISSUE_FILTERS = [
    {
      key: "status",
      label: "סטטוס",
      options: [
        { value: "open", label: "פתוח" },
        { value: "in_progress", label: "בטיפול" },
        { value: "resolved", label: "נפתר" },
      ],
    },
    {
      key: "supplier_id",
      label: "ספק",
      options: (suppliers || []).map((s) => ({ value: String(s.id), label: s.name })),
    },
  ];

  // Create form state
  const [supplierId, setSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const create = useCreateIssue();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !productName.trim() || !arrivalDate || !problemDescription.trim()) return;
    create.mutate(
      {
        supplier_id: Number(supplierId),
        product_name: productName.trim(),
        sku: sku.trim() || undefined,
        arrival_date: arrivalDate,
        problem_description: problemDescription.trim(),
      },
      {
        onSuccess: () => {
          toast("תקלה נוצרה בהצלחה", "success");
          setShowCreate(false);
          setSupplierId(""); setProductName(""); setSku(""); setArrivalDate(""); setProblemDescription("");
        },
        onError: () => toast("שגיאה ביצירת התקלה", "error"),
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading">תקלות</h1>
        <Button onClick={() => setShowCreate(true)} className="text-sm">+ תקלה חדשה</Button>
      </div>

      <div className="mb-4">
        <FilterBar
          filters={ISSUE_FILTERS}
          values={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      </div>

      {isLoading ? (
        <div className="text-text-secondary font-body text-sm">טוען...</div>
      ) : (
        <div className="space-y-2">
          {issues?.length === 0 && (
            <p className="text-text-secondary font-body text-sm">אין תקלות</p>
          )}
          {issues?.map((issue) => (
            <IssueCard key={issue.id} issue={issue} supplierName={supplierMap[issue.supplier_id]} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="תקלה חדשה">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">ספק *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body">
              <option value="">בחר ספק</option>
              {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">שם מוצר *</label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-body text-text-secondary mb-1">מק"ט</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-body text-text-secondary mb-1">תאריך הגעה *</label>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-body text-text-secondary mb-1">תיאור בעיה *</label>
            <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} rows={3}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-body resize-y" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button type="submit" disabled={!supplierId || !productName.trim() || !arrivalDate || !problemDescription.trim() || create.isPending}>
              {create.isPending ? "יוצר..." : "צור תקלה"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 4: Create IssueDetail component**

Create `frontend-next/components/issues/IssueDetail.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useIssue, useUpdateIssue, useResolveIssue, useAddActionItem } from "@/lib/queries/issues";
import { useSupplier } from "@/lib/queries/suppliers";
import { StatusBadge } from "@/components/ui/Badge";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { Button } from "@/components/ui/Button";
import { SupplierCard } from "@/components/suppliers/SupplierCard";
import { ActionItemList } from "./ActionItemList";
import { useToast } from "@/components/ui/Toast";

export function IssueDetail({ issueId }: { issueId: number }) {
  const { data: issue, isLoading } = useIssue(issueId);
  const { data: supplier } = useSupplier(issue?.supplier_id ?? 0);
  const update = useUpdateIssue();
  const resolve = useResolveIssue();
  const addAction = useAddActionItem();
  const { toast } = useToast();
  const [newAction, setNewAction] = useState("");

  if (isLoading || !issue) {
    return <div className="text-text-secondary font-body">טוען...</div>;
  }

  const handleUpdate = (field: string, value: string) => {
    update.mutate(
      { id: issue.id, data: { [field]: value } },
      {
        onSuccess: () => toast("עודכן בהצלחה", "success"),
        onError: () => toast("שגיאה בעדכון", "error"),
      }
    );
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim()) return;
    addAction.mutate(
      { issueId: issue.id, data: { description: newAction.trim() } },
      {
        onSuccess: () => { toast("פעולה נוספה", "success"); setNewAction(""); },
        onError: () => toast("שגיאה בהוספת פעולה", "error"),
      }
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/issues" className="text-primary hover:underline font-body text-sm">
        ← חזרה לתקלות
      </Link>

      <div className="flex items-center gap-3">
        <InlineEdit
          value={issue.product_name}
          onSave={(v) => handleUpdate("product_name", v)}
          className="text-2xl font-heading"
        />
        <StatusBadge status={issue.status} />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4">
        {issue.sku && (
          <div>
            <span className="text-xs text-text-secondary font-body block mb-1">מק"ט</span>
            <span className="font-body text-sm">{issue.sku}</span>
          </div>
        )}
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">תאריך הגעה</span>
          <span className="font-body text-sm">{new Date(issue.arrival_date).toLocaleDateString("he-IL")}</span>
        </div>
        <div>
          <span className="text-xs text-text-secondary font-body block mb-1">פעולה</span>
          {issue.status !== "resolved" ? (
            <Button variant="primary" className="text-sm" onClick={() => resolve.mutate(issue.id)}>
              סמן כנפתר
            </Button>
          ) : (
            <span className="text-success font-body text-sm">נפתר</span>
          )}
        </div>
      </div>

      {/* Problem description */}
      <div>
        <h3 className="text-sm font-heading mb-2">תיאור הבעיה</h3>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <InlineEdit
            value={issue.problem_description}
            as="textarea"
            onSave={(v) => handleUpdate("problem_description", v)}
          />
        </div>
      </div>

      {/* Supplier card */}
      {supplier && (
        <div>
          <h3 className="text-sm font-heading mb-2">ספק</h3>
          <SupplierCard supplier={supplier} compact />
        </div>
      )}

      {/* Action Items */}
      <div>
        <h3 className="text-sm font-heading mb-2">פעולות ({issue.action_items.length})</h3>
        <ActionItemList items={issue.action_items} />
        <form onSubmit={handleAddAction} className="flex gap-2 mt-3">
          <input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="הוסף פעולה חדשה..."
            className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-text-primary font-body placeholder:text-text-secondary"
          />
          <Button type="submit" className="text-sm" disabled={!newAction.trim()}>הוסף</Button>
        </form>
      </div>

      <div className="text-xs text-text-secondary font-body space-y-1 pt-4 border-t border-border">
        <div>נוצר: {new Date(issue.created_at).toLocaleDateString("he-IL")}</div>
        {issue.resolved_at && <div>נפתר: {new Date(issue.resolved_at).toLocaleDateString("he-IL")}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create issue pages**

Replace `frontend-next/app/issues/page.tsx`:

```tsx
import { IssueList } from "@/components/issues/IssueList";

export default function IssuesPage() {
  return <IssueList />;
}
```

Create `frontend-next/app/issues/[id]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { IssueDetail } from "@/components/issues/IssueDetail";

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <IssueDetail issueId={Number(id)} />;
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend-next/components/issues/ frontend-next/app/issues/
git commit -m "feat: add issue list and detail pages with action items and supplier cards"
```

---

## Task 11: Update FastAPI to Serve Next.js Static Export

**Files:**
- Modify: `app/main.py`

- [ ] **Step 1: Update main.py static file serving**

In `app/main.py`, update the static file mounting and add a catch-all route. Replace the existing static file and root route code with:

```python
import os
from pathlib import Path
from fastapi.responses import FileResponse

# After router includes, before app startup:

# Serve Next.js static export
FRONTEND_DIR = Path(__file__).parent.parent / "frontend-next" / "out"

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Try exact file first
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # Try with .html extension (Next.js static export pattern)
        html_path = FRONTEND_DIR / f"{full_path}.html"
        if html_path.is_file():
            return FileResponse(html_path)
        # Fallback to index.html for client-side routing
        return FileResponse(FRONTEND_DIR / "index.html")
else:
    # Fallback: serve old frontend
    app.mount("/static", StaticFiles(directory="frontend"), name="static")

    @app.get("/")
    async def root():
        return FileResponse("frontend/index.html")
```

- [ ] **Step 2: Commit**

```bash
git add app/main.py
git commit -m "feat: update FastAPI to serve Next.js static export with client-side routing fallback"
```

---

## Task 12: Build, Smoke Test, Final Polish

- [ ] **Step 1: Build the Next.js static export**

```bash
cd frontend-next && npm run build
```

Expected: Build completes, `out/` directory is created with HTML files.

Note: `output: "export"` does not support `rewrites`, so remove the `rewrites` from `next.config.ts` before building (they're only for dev). Update `next.config.ts` to:

```typescript
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  ...(isDev && {
    async rewrites() {
      return [
        { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
      ];
    },
  }),
};

export default nextConfig;
```

- [ ] **Step 2: Start FastAPI and verify full app works**

```bash
cd .. && uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000 — should serve the Next.js static export with all pages working.

- [ ] **Step 3: Test each route**

Verify these routes work:
- `http://localhost:8000/` — Dashboard with KPIs
- `http://localhost:8000/tasks` — Task list
- `http://localhost:8000/tasks?selected=1` — Task list with panel open
- `http://localhost:8000/tasks/1` — Task detail page
- `http://localhost:8000/suppliers` — Supplier list
- `http://localhost:8000/suppliers/1` — Supplier detail
- `http://localhost:8000/issues` — Issue list
- `http://localhost:8000/issues/1` — Issue detail

- [ ] **Step 4: Commit and tag**

```bash
git add -A
git commit -m "feat: complete Next.js frontend migration v1"
```
