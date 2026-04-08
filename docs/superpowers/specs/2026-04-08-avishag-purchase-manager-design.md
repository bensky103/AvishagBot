# Avishag Purchase Manager — Design Spec

## Overview

A mobile-first web application for Avishag, the purchase manager at Elevize. The app helps her manage procurement tasks, track supplier issues, and interact with the system via a Telegram AI agent that understands Hebrew free text.

**Single user, MVP scope, scalable feature-wise.**

## Architecture

Single FastAPI monolith deployed as a Docker container on Railway.

```
Mobile Browser ──┐
                 ├──→ FastAPI (API + Static Frontend + Telegram Bot)
Telegram ────────┘              │
                            SQLite (persistent volume)
```

### Components (all in one process)

- **FastAPI** — REST API, serves static frontend assets, hosts the application
- **Telegram Bot** — runs as an asyncio background task within the FastAPI lifespan
- **LangChain Agent** — processes Telegram messages, calls the shared service layer
- **SQLite** — on a Railway persistent volume, accessed via SQLAlchemy async + aiosqlite

### Why monolith

Single user, single developer, low traffic. No benefit to service separation. Clean module boundaries in code allow future extraction if ever needed. SQLAlchemy ORM makes migrating to PostgreSQL a connection-string change.

## Data Model

### Task

| Field | Type | Notes |
|-------|------|-------|
| id | int, PK | auto-increment |
| title | string | required |
| description | text | nullable |
| due_date | date | nullable |
| urgency | enum: low, medium, high, critical | default: medium |
| is_completed | bool | default: false |
| created_at | datetime | auto |
| completed_at | datetime | nullable, set on completion |

### Supplier

| Field | Type | Notes |
|-------|------|-------|
| id | int, PK | auto-increment |
| name | string | required |
| contact_info | string | nullable |
| notes | text | nullable |
| created_at | datetime | auto |

### IssueReport

| Field | Type | Notes |
|-------|------|-------|
| id | int, PK | auto-increment |
| supplier_id | int, FK → Supplier | required |
| product_name | string | required |
| sku | string | nullable |
| arrival_date | date | required |
| problem_description | text | required |
| status | enum: open, in_progress, resolved | default: open |
| created_at | datetime | auto |
| resolved_at | datetime | nullable |

### ActionItem

| Field | Type | Notes |
|-------|------|-------|
| id | int, PK | auto-increment |
| issue_report_id | int, FK → IssueReport | required |
| task_id | int, FK → Task | nullable — set when synced to main TODO |
| description | text | required |
| is_completed | bool | default: false |
| created_at | datetime | auto |

**ActionItem ↔ Task sync:** Creating an action item optionally creates a linked Task. Completing either side marks both as done.

### AgentConversation

| Field | Type | Notes |
|-------|------|-------|
| id | int, PK | auto-increment |
| session_id | string | groups messages per conversation |
| role | enum: user, assistant, tool | message role |
| content | text | message content |
| created_at | datetime | auto |

## Feature 1: Task Management

An advanced TODO list page.

- List all tasks with filtering by status (open/completed) and urgency
- Each task shows: title, description, due date, urgency badge, checkbox
- Add task button opens a form: title, description, due date, urgency selector
- Check/uncheck to complete/reopen tasks
- Tasks linked from action items show a visual indicator linking back to the issue

## Feature 2: Supplier Issue Tracking

A full page for tracking problems in supplier shipments.

### Supplier Management
- "Add Supplier" button to register new suppliers (name, contact info, notes)
- Supplier list/dropdown used when creating issue reports
- Avishag manually manages the supplier list (app is source of truth)

### Issue Reports
- "Create Issue Report" button opens a form:
  - Supplier (dropdown from supplier list)
  - Product name
  - SKU (optional)
  - Arrival date
  - Problem description
- Each report has a status: open → in_progress → resolved
- Each report contains action items with checkboxes
- Action items can optionally sync to the main Task list

### Issue List View
- All issue reports listed with filters: by supplier, by status
- Each row shows: supplier name, product, status badge, date, action item progress

## Feature 3: Telegram AI Agent

A LangChain agent connected to Telegram that understands Hebrew free text.

### Capabilities
- **Create:** tasks, suppliers, issue reports, action items
- **Query:** "what's open with supplier X?", "what's due this week?", "show all critical tasks"
- **Update:** complete tasks, resolve issues
- **Multi-step:** a single message can trigger multiple tool calls (e.g., create issue + create follow-up task)

### Agent Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| create_task | Add a new task | title, description, due_date, urgency |
| list_tasks | Query tasks with filters | status, urgency, due_before |
| complete_task | Mark a task as done | task_id |
| create_supplier | Register a new supplier | name, contact_info |
| list_suppliers | Get all suppliers | — |
| create_issue_report | Log a supplier issue | supplier_id, product_name, sku, arrival_date, problem |
| list_issues | Query issues with filters | supplier_id, status |
| add_action_item | Add action item to an issue | issue_report_id, description, create_task (bool) |
| resolve_issue | Mark an issue as resolved | issue_report_id |

### Agent Design
- **LLM:** OpenAI GPT-4o
- **Framework:** LangChain with tool-calling agent
- **System prompt:** Hebrew-aware, responds in Hebrew, fuzzy supplier name matching
- **Memory:** Conversation history stored in AgentConversation table (SQLite-backed LangChain memory)
- **Logging:** Custom LangChain callback handler using structlog — logs every LLM decision, tool call, parameters, and result in structured JSON

### Tools call the service layer directly
Since everything runs in one process, agent tools call the same Python service functions that the API routes use. No HTTP overhead. Validation and side effects (like action-item-to-task sync) happen in one place.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite + aiosqlite |
| Migrations | Alembic |
| Frontend | TBD (Guy designing UX separately with Dribbble + Google Stitch) |
| AI Agent | LangChain (tool-calling agent) |
| LLM | OpenAI GPT-4o |
| Telegram | python-telegram-bot (async) |
| Logging | structlog (JSON) |
| Containerization | Docker |
| Hosting | Railway (single service + persistent volume) |

## Project Structure

```
avishag/
├── app/
│   ├── main.py              # FastAPI app + lifespan (starts bot)
│   ├── config.py             # settings from env vars
│   ├── database.py           # SQLAlchemy engine + session
│   ├── models/               # SQLAlchemy models
│   │   ├── task.py
│   │   ├── supplier.py
│   │   ├── issue_report.py
│   │   └── action_item.py
│   ├── schemas/              # Pydantic request/response schemas
│   ├── services/             # business logic layer
│   │   ├── task_service.py
│   │   ├── supplier_service.py
│   │   └── issue_service.py
│   ├── api/                  # FastAPI route handlers
│   │   ├── tasks.py
│   │   ├── suppliers.py
│   │   └── issues.py
│   └── agent/                # Telegram + LangChain
│       ├── bot.py            # telegram message handler
│       ├── agent.py          # LangChain agent setup
│       ├── tools.py          # @tool definitions
│       ├── prompts.py        # system prompt
│       └── callbacks.py      # structlog callback handler
├── alembic/                  # DB migrations
├── frontend/                 # TBD — UX designed separately
├── docs/
├── Dockerfile
└── requirements.txt
```

## Key Design Principles

1. **Service layer is the single source of truth** — both API routes and agent tools call the same service functions
2. **Async throughout** — FastAPI, SQLAlchemy, aiosqlite, python-telegram-bot all async
3. **Agent transparency** — every LangChain decision logged via structlog callbacks
4. **Feature-scalable** — clean module boundaries make adding new features straightforward without service extraction
5. **DB-portable** — SQLAlchemy ORM means migrating from SQLite to PostgreSQL is a config change

## Out of Scope (MVP)

- Frontend framework selection and UX design (handled separately)
- Multi-user authentication
- File/image attachments on issue reports
- Email notifications
- Supplier import/export
- Analytics or reporting dashboards
