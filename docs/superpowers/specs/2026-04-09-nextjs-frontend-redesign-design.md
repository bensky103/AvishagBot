# Avishag Frontend Redesign: Next.js + React

**Date:** 2026-04-09
**Status:** Approved

## Overview

Migrate the Avishag purchase management app frontend from vanilla HTML/CSS/JS to Next.js + React while preserving the warm brutalist RTL Hebrew design language. The key UX improvement is making tasks fully interactive via a hybrid slide-over panel + detail page pattern.

## Decisions Summary

| Decision | Choice |
|---|---|
| Task interaction pattern | Hybrid: slide-over panel + full detail page |
| Panel vs page split | Panel: key info + quick actions. Page: full detail + inline edit + related entities |
| Navigation structure | 4 top-level routes: `/`, `/tasks`, `/suppliers`, `/issues` with `[id]` sub-routes |
| QoL features for v1 | Search, inline editing, responsive layout |
| Dashboard style | Action-oriented: surfaces overdue tasks, upcoming deadlines, open issues |
| Supplier/Issue detail views | Direct detail pages (no panel) |
| Entity relationships in UI | Inline preview cards on detail pages, simple links in panel |
| Architecture approach | Next.js App Router + client components, React Query for data fetching |

## Architecture & Tech Stack

- **Next.js 14+** (App Router) — client components only, no SSR
- **React Query (TanStack Query v5)** — data fetching, caching, optimistic updates
- **TypeScript** — full type safety matching Pydantic schemas
- **Tailwind CSS** — customized with warm brutalist design tokens, RTL plugin
- **Fonts:** Secular One (headings) + Heebo (body) via `next/font/google`

### Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout (fonts, RTL dir, QueryProvider)
│   ├── page.tsx            # Dashboard (action-oriented)
│   ├── tasks/
│   │   ├── page.tsx        # Task list + slide-over panel
│   │   └── [id]/
│   │       └── page.tsx    # Task full detail page
│   ├── suppliers/
│   │   ├── page.tsx        # Supplier list
│   │   └── [id]/
│   │       └── page.tsx    # Supplier detail page
│   └── issues/
│       ├── page.tsx        # Issue list
│       └── [id]/
│           └── page.tsx    # Issue detail page
├── components/
│   ├── layout/             # Shell, Sidebar, SearchBar
│   ├── tasks/              # TaskList, TaskPanel, TaskDetail, TaskForm
│   ├── suppliers/          # SupplierList, SupplierDetail, SupplierCard
│   ├── issues/             # IssueList, IssueDetail, IssueCard, ActionItemList
│   └── ui/                 # Badge, Button, Toast, Modal, FilterBar
├── lib/
│   ├── api.ts              # Fetch wrapper for FastAPI endpoints
│   ├── queries/            # React Query hooks (useTasks, useSuppliers, etc.)
│   └── types.ts            # TypeScript types matching Pydantic schemas
├── tailwind.config.ts      # Warm brutalist design tokens
└── next.config.ts          # API proxy rewrites
```

### FastAPI Connection

- **Dev:** Next.js dev server (port 3000) proxies `/api/*` to FastAPI (port 8000) via `next.config.ts` rewrites
- **Prod:** `next build` with `output: 'export'` produces static HTML/JS/CSS; FastAPI serves these via `StaticFiles` mount with a catch-all route for client-side routing

## Data Model (Backend — No Changes)

Existing models remain untouched. Key relationships:

- **Task:** id, title, description, due_date, urgency (low/medium/high/critical), is_completed, created_at, completed_at
- **Supplier:** id, name, contact_info, notes, created_at → has many IssueReports
- **IssueReport:** id, supplier_id (FK), product_name, sku, arrival_date, problem_description, status (open/in_progress/resolved), created_at, resolved_at → has many ActionItems
- **ActionItem:** id, issue_report_id (FK), task_id (FK, nullable), description, is_completed, created_at

Relationship chain: `IssueReport → ActionItem → Task (optional)`. Tasks have no direct supplier FK. Related issues for a task are found by reverse lookup through action_items.

## TypeScript Types

```typescript
type Urgency = "low" | "medium" | "high" | "critical"
type IssueStatus = "open" | "in_progress" | "resolved"

interface Task {
  id: number; title: string; description: string | null
  due_date: string | null; urgency: Urgency
  is_completed: boolean; created_at: string; completed_at: string | null
}

interface Supplier {
  id: number; name: string; contact_info: string | null
  notes: string | null; created_at: string
}

interface IssueReport {
  id: number; supplier_id: number; product_name: string
  sku: string | null; arrival_date: string
  problem_description: string; status: IssueStatus
  created_at: string; resolved_at: string | null
  action_items: ActionItem[]
}

interface ActionItem {
  id: number; issue_report_id: number; task_id: number | null
  description: string; is_completed: boolean; created_at: string
}
```

## Page-by-Page UI Design

### Dashboard (`/`)

- 4 KPI cards: Open Tasks, Overdue Tasks, Open Issues, Suppliers count
- "Needs Attention" section: overdue tasks + tasks due this week, sorted by urgency
- "Recent Issues" section: latest open/in-progress issues with supplier name and status badge
- All items clickable — tasks navigate to `/tasks` with panel opened, issues to `/issues/[id]`

### Task List (`/tasks`)

- Header: search bar + filter controls (urgency, status, date range)
- Task rows: title, urgency badge, due date, completion checkbox
- Click a task → slide-over panel opens from the left (RTL)
- URL updates to `/tasks?selected=[id]` (shareable panel state)

### Task Slide-Over Panel

- Title, urgency badge, due date, completion toggle
- Description (first ~3 lines, truncated)
- Related action items (from linked IssueReports)
- Quick actions: toggle complete, change urgency
- "Open full page" button → navigates to `/tasks/[id]`
- Close via: X button, Escape, click outside (mobile), click different task

### Task Detail Page (`/tasks/[id]`)

- Back link to `/tasks`
- All fields inline-editable: title, description, urgency (dropdown), due date (date picker)
- Click to edit, auto-save on blur, cancel on Escape
- Related section: "Action Items from Issues" — preview cards showing linked IssueReport with supplier name, problem description, and the specific action item, linking to `/issues/[id]`
- Status bar: created date, completed date, completion toggle

### Supplier List (`/suppliers`)

- Search bar + grid/list of supplier cards
- Each card: name, contact info preview, issue count badge
- Click → `/suppliers/[id]`

### Supplier Detail (`/suppliers/[id]`)

- Name, contact info, notes — all inline-editable
- "Issues" section: list of all IssueReports for this supplier with status badges
- Each issue links to `/issues/[id]`

### Issue List (`/issues`)

- Search + filter by status (open/in_progress/resolved) and supplier
- Each row: product name, supplier name, status badge, arrival date
- Click → `/issues/[id]`

### Issue Detail (`/issues/[id]`)

- Full detail: product name, SKU, arrival date, problem description, status — inline-editable
- Supplier preview card (name + contact info, links to `/suppliers/[id]`)
- Action Items list: description, completion checkbox, linked task (if any, links to `/tasks/[id]`)

## Design System

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `primary` | `#C45D3E` | Buttons, active states, urgency-high |
| `primary-dark` | `#A34830` | Hover states |
| `bg-base` | `#1a1a2e` | Page background |
| `bg-surface` | `#16213e` | Cards, list items |
| `bg-elevated` | `#0f3460` | Panel, modals, hover |
| `text-primary` | `#f0e6d3` | Main text |
| `text-secondary` | `#a89b8c` | Meta text, labels |
| `border` | `#2a2a4a` | Dividers, card borders |
| `success` | `#4CAF50` | Completed states |
| `warning` | `#FF9800` | Medium urgency, due soon |
| `danger` | `#e74c3c` | Overdue, critical urgency |

### Typography

- **Secular One** — headings, titles (bold brutalist feel)
- **Heebo** — body text, labels, meta (clean Hebrew readability)
- Loaded via `next/font/google`

### RTL

- `dir="rtl"` on root `<html>`
- Tailwind RTL variant plugin for directional overrides
- Logical properties (`ps-`, `pe-`, `ms-`, `me-`) instead of `pl-`/`pr-`
- Panel slides from the left (logical "end" in RTL)

### Urgency Badges

| Level | Style | Label |
|---|---|---|
| `low` | `bg-surface`, muted text | נמוכה |
| `medium` | `warning` bg | בינונית |
| `high` | `primary` bg | גבוהה |
| `critical` | `danger` bg + pulse animation | קריטית |

### Issue Status Badges

| Status | Style |
|---|---|
| `open` | Outlined, warning color |
| `in_progress` | Filled, primary color |
| `resolved` | Filled, success color |

### Responsive Breakpoints

- **Mobile (<640px):** Single column, no panel — task click goes directly to detail page
- **Tablet (640-1024px):** Narrower panel, condensed list
- **Desktop (>1024px):** Full list + panel side by side

## Shared Components

### App Shell (`components/layout/`)

- Persistent sidebar navigation: Dashboard, Tasks, Suppliers, Issues
- Active route highlighted with `primary` color bar
- Mobile: collapses to hamburger menu / bottom tab bar
- Global search bar in top header

### Search

- Client-side filtering (sufficient for app's scale)
- Debounced input (300ms), searches title/name/description fields
- Results dropdown grouped by entity type, each links to detail page

### Toast Notifications

- Bottom-left stack (RTL)
- Variants: success (green), error (red), info (neutral)
- Auto-dismiss 3s, manually dismissable
- Triggered on: create, update, delete, toggle completion

### Filter Controls

- Dropdown selects: urgency, status, supplier (on issues)
- Date range picker for due dates
- Active filters shown as removable chips
- Filter state stored in URL search params (shareable)

### Create Modals

- "New Task" / "New Supplier" / "New Issue" modals from list pages
- Client-side form validation
- On success: close modal, invalidate cache, show toast

## React Query Strategy

### Query Keys

```
["tasks"]              → task list (filters included in key)
["tasks", id]          → single task
["suppliers"]          → supplier list
["suppliers", id]      → single supplier + its issues
["issues"]             → issue list
["issues", id]         → single issue + action items
["dashboard"]          → dashboard aggregated data
```

### Mutations & Cache Invalidation

| Action | Optimistic? | Invalidates |
|---|---|---|
| Toggle task complete | Yes | `["tasks"]`, `["tasks", id]`, `["dashboard"]` |
| Inline edit task field | Yes | `["tasks"]`, `["tasks", id]` |
| Create task | No (wait for server ID) | `["tasks"]`, `["dashboard"]` |
| Delete task | Yes | `["tasks"]`, `["dashboard"]` |
| Update issue status | Yes | `["issues"]`, `["issues", id]`, `["dashboard"]` |
| Toggle action item | Yes | `["issues", parentId]` |

### Stale Times

- Lists: 30s
- Detail pages: 60s
- Dashboard: 15s
- Background refetch on window focus for all queries

### Error Handling

- API errors surface as toast notifications
- Optimistic updates roll back on failure
- Network errors show a subtle banner ("Connection lost — retrying...")
- Cached data shown immediately while refreshing in background

## Deployment

### Development

- Next.js dev server on port 3000
- FastAPI on port 8000
- `next.config.ts` rewrites proxy `/api/*` to FastAPI

### Production

- `next build` with `output: 'export'` produces static HTML/JS/CSS in `frontend/out/`
- FastAPI serves static files via `StaticFiles` mount pointing at `out/`
- Catch-all route in FastAPI serves `index.html` for client-side routing
- Single process deployment — no Node.js server needed in production

### Docker

- Build stage: Node.js builds Next.js static export
- Runtime stage: Python runs FastAPI, serves built frontend
- Single container, same as current setup

### No Authentication

App is currently unauthenticated. No auth changes in v1.

## Out of Scope (v1)

- Drag-and-drop reordering
- Keyboard shortcuts
- Bulk actions
- Notifications/reminders beyond visual badges
- Saved filter presets
- Dark/light mode toggle
- Activity/history log (layout is future-ready but not built)
- Comments on tasks
- File attachments
