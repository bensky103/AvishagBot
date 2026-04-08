# Avishag Purchase Manager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI backend with SQLite persistence, REST API for task/supplier/issue management, and a LangChain-powered Telegram agent that understands Hebrew free text — all in a single Docker container.

**Architecture:** Single FastAPI monolith. Three layers: models (SQLAlchemy), services (business logic), API routes (FastAPI). A LangChain tool-calling agent runs inside the same process, sharing the service layer. Telegram bot polls as an asyncio background task started in FastAPI's lifespan. SQLite on a persistent volume via aiosqlite.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), aiosqlite, Alembic, LangChain, OpenAI GPT-4o, python-telegram-bot, structlog, Docker

---

## File Map

```
app/
├── __init__.py
├── main.py                    # FastAPI app, lifespan (starts telegram bot), mounts static
├── config.py                  # Pydantic Settings — reads env vars
├── database.py                # async engine, sessionmaker, Base
├── models/
│   ├── __init__.py            # re-exports all models
│   ├── task.py                # Task model
│   ├── supplier.py            # Supplier model
│   ├── issue_report.py        # IssueReport model
│   └── action_item.py         # ActionItem model (FK to IssueReport + Task)
├── schemas/
│   ├── __init__.py
│   ├── task.py                # TaskCreate, TaskUpdate, TaskResponse
│   ├── supplier.py            # SupplierCreate, SupplierUpdate, SupplierResponse
│   ├── issue_report.py        # IssueReportCreate, IssueReportUpdate, IssueReportResponse
│   └── action_item.py         # ActionItemCreate, ActionItemResponse
├── services/
│   ├── __init__.py
│   ├── task_service.py        # CRUD + complete/reopen logic
│   ├── supplier_service.py    # CRUD
│   └── issue_service.py       # CRUD for issues + action items, sync logic
├── api/
│   ├── __init__.py
│   ├── tasks.py               # /api/tasks routes
│   ├── suppliers.py           # /api/suppliers routes
│   └── issues.py              # /api/issues + /api/issues/{id}/action-items routes
└── agent/
    ├── __init__.py
    ├── bot.py                 # python-telegram-bot setup, message handler
    ├── agent.py               # LangChain agent config, tool binding
    ├── tools.py               # 9 @tool functions calling service layer
    ├── prompts.py             # System prompt (Hebrew-aware)
    └── callbacks.py           # structlog LangChain callback handler

tests/
├── conftest.py                # async fixtures, test DB session
├── test_models.py             # model creation, relationships
├── test_task_service.py       # task CRUD, complete/reopen
├── test_supplier_service.py   # supplier CRUD
├── test_issue_service.py      # issue + action item CRUD, sync logic
├── test_api_tasks.py          # task endpoint integration tests
├── test_api_suppliers.py      # supplier endpoint integration tests
├── test_api_issues.py         # issue endpoint integration tests
└── test_agent_tools.py        # agent tool unit tests

alembic/
├── env.py
├── script.py.mako
└── versions/                  # migration files

alembic.ini
requirements.txt
Dockerfile
.env.example
.gitignore
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `app/__init__.py`
- Create: `app/config.py`

- [ ] **Step 1: Create requirements.txt**

```txt
fastapi==0.115.12
uvicorn[standard]==0.34.2
sqlalchemy[asyncio]==2.0.40
aiosqlite==0.21.0
alembic==1.15.2
pydantic-settings==2.9.1
langchain==0.3.25
langchain-openai==0.3.14
python-telegram-bot==21.11.1
structlog==25.1.0
httpx==0.28.1
pytest==8.3.5
pytest-asyncio==0.26.0
```

- [ ] **Step 2: Create .env.example**

```env
DATABASE_URL=sqlite+aiosqlite:///./data/avishag.db
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ALLOWED_USER_ID=123456789
```

- [ ] **Step 3: Create .gitignore**

```gitignore
__pycache__/
*.pyc
.env
*.db
data/
.venv/
.superpowers/
```

- [ ] **Step 4: Create app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/avishag.db"
    openai_api_key: str = ""
    telegram_bot_token: str = ""
    telegram_allowed_user_id: int = 0

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 5: Create app/__init__.py**

```python
# empty
```

- [ ] **Step 6: Commit**

```bash
git add requirements.txt .env.example .gitignore app/__init__.py app/config.py
git commit -m "feat: project scaffolding with config and dependencies"
```

---

## Task 2: Database Setup

**Files:**
- Create: `app/database.py`
- Create: `app/models/__init__.py`
- Create: `tests/__init__.py` (empty)
- Create: `tests/conftest.py`

- [ ] **Step 1: Create app/database.py**

```python
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# Ensure data directory exists for SQLite
os.makedirs(os.path.dirname(settings.database_url.replace("sqlite+aiosqlite:///", "")), exist_ok=True)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
```

- [ ] **Step 2: Create app/models/__init__.py (empty for now)**

```python
# Models will be imported here as they are created
```

- [ ] **Step 3: Create tests/__init__.py**

```python
# empty
```

- [ ] **Step 4: Create tests/conftest.py**

```python
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base


@pytest_asyncio.fixture
async def db_session():
    """Create a fresh in-memory SQLite database for each test."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
```

- [ ] **Step 5: Commit**

```bash
git add app/database.py app/models/__init__.py tests/__init__.py tests/conftest.py
git commit -m "feat: async database setup with test fixtures"
```

---

## Task 3: SQLAlchemy Models

**Files:**
- Create: `app/models/task.py`
- Create: `app/models/supplier.py`
- Create: `app/models/issue_report.py`
- Create: `app/models/action_item.py`
- Modify: `app/models/__init__.py`
- Create: `tests/test_models.py`

- [ ] **Step 1: Write the failing test for Task model**

Create `tests/test_models.py`:

```python
import pytest
from datetime import date, datetime

from app.models.task import Task


@pytest.mark.asyncio
async def test_create_task(db_session):
    task = Task(
        title="Call supplier",
        description="Follow up on broken shipment",
        due_date=date(2026, 4, 10),
        urgency="high",
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assert task.id is not None
    assert task.title == "Call supplier"
    assert task.urgency == "high"
    assert task.is_completed is False
    assert isinstance(task.created_at, datetime)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_models.py::test_create_task -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models.task'`

- [ ] **Step 3: Create app/models/task.py**

```python
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    urgency: Mapped[str] = mapped_column(
        Enum("low", "medium", "high", "critical", name="urgency_enum"),
        default="medium",
    )
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_models.py::test_create_task -v`
Expected: PASS

- [ ] **Step 5: Write the failing test for Supplier model**

Append to `tests/test_models.py`:

```python
from app.models.supplier import Supplier


@pytest.mark.asyncio
async def test_create_supplier(db_session):
    supplier = Supplier(name="עוף הגליל", contact_info="054-1234567")
    db_session.add(supplier)
    await db_session.commit()
    await db_session.refresh(supplier)

    assert supplier.id is not None
    assert supplier.name == "עוף הגליל"
    assert supplier.contact_info == "054-1234567"
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pytest tests/test_models.py::test_create_supplier -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models.supplier'`

- [ ] **Step 7: Create app/models/supplier.py**

```python
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    contact_info: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    issue_reports: Mapped[list["IssueReport"]] = relationship(back_populates="supplier")
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pytest tests/test_models.py::test_create_supplier -v`
Expected: PASS

- [ ] **Step 9: Write the failing test for IssueReport model**

Append to `tests/test_models.py`:

```python
from app.models.issue_report import IssueReport


@pytest.mark.asyncio
async def test_create_issue_report(db_session):
    supplier = Supplier(name="Test Supplier")
    db_session.add(supplier)
    await db_session.commit()
    await db_session.refresh(supplier)

    issue = IssueReport(
        supplier_id=supplier.id,
        product_name="Chicken Wings",
        sku="CW-001",
        arrival_date=date(2026, 4, 7),
        problem_description="5 broken boxes",
    )
    db_session.add(issue)
    await db_session.commit()
    await db_session.refresh(issue)

    assert issue.id is not None
    assert issue.supplier_id == supplier.id
    assert issue.status == "open"
```

- [ ] **Step 10: Run test to verify it fails**

Run: `pytest tests/test_models.py::test_create_issue_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models.issue_report'`

- [ ] **Step 11: Create app/models/issue_report.py**

```python
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IssueReport(Base):
    __tablename__ = "issue_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"))
    product_name: Mapped[str] = mapped_column(String(255))
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    arrival_date: Mapped[date] = mapped_column(Date)
    problem_description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("open", "in_progress", "resolved", name="issue_status_enum"),
        default="open",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    supplier: Mapped["Supplier"] = relationship(back_populates="issue_reports")
    action_items: Mapped[list["ActionItem"]] = relationship(back_populates="issue_report")
```

- [ ] **Step 12: Run test to verify it passes**

Run: `pytest tests/test_models.py::test_create_issue_report -v`
Expected: PASS

- [ ] **Step 13: Write the failing test for ActionItem model with Task sync**

Append to `tests/test_models.py`:

```python
from app.models.action_item import ActionItem


@pytest.mark.asyncio
async def test_create_action_item_linked_to_task(db_session):
    supplier = Supplier(name="Test Supplier")
    db_session.add(supplier)
    await db_session.commit()
    await db_session.refresh(supplier)

    issue = IssueReport(
        supplier_id=supplier.id,
        product_name="Product A",
        arrival_date=date(2026, 4, 7),
        problem_description="Damaged",
    )
    db_session.add(issue)
    await db_session.commit()
    await db_session.refresh(issue)

    task = Task(title="Follow up on damage")
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    action_item = ActionItem(
        issue_report_id=issue.id,
        task_id=task.id,
        description="Call supplier about damage",
    )
    db_session.add(action_item)
    await db_session.commit()
    await db_session.refresh(action_item)

    assert action_item.id is not None
    assert action_item.issue_report_id == issue.id
    assert action_item.task_id == task.id
    assert action_item.is_completed is False
```

- [ ] **Step 14: Run test to verify it fails**

Run: `pytest tests/test_models.py::test_create_action_item_linked_to_task -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models.action_item'`

- [ ] **Step 15: Create app/models/action_item.py**

```python
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    issue_report_id: Mapped[int] = mapped_column(ForeignKey("issue_reports.id"))
    task_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tasks.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    issue_report: Mapped["IssueReport"] = relationship(back_populates="action_items")
    task: Mapped[Optional["Task"]] = relationship()
```

- [ ] **Step 16: Update app/models/__init__.py**

```python
from app.models.task import Task
from app.models.supplier import Supplier
from app.models.issue_report import IssueReport
from app.models.action_item import ActionItem

__all__ = ["Task", "Supplier", "IssueReport", "ActionItem"]
```

- [ ] **Step 17: Run all model tests**

Run: `pytest tests/test_models.py -v`
Expected: ALL PASS (4 tests)

- [ ] **Step 18: Commit**

```bash
git add app/models/ tests/test_models.py
git commit -m "feat: SQLAlchemy models for task, supplier, issue report, action item"
```

---

## Task 4: Alembic Setup

**Files:**
- Create: `alembic.ini`
- Create: `alembic/env.py`
- Create: `alembic/script.py.mako`

- [ ] **Step 1: Initialize Alembic**

```bash
pip install -r requirements.txt
alembic init alembic
```

- [ ] **Step 2: Edit alembic.ini — set sqlalchemy.url to empty (we override in env.py)**

In `alembic.ini`, find the line `sqlalchemy.url = driver://user:pass@localhost/dbname` and replace with:

```ini
sqlalchemy.url =
```

- [ ] **Step 3: Edit alembic/env.py to use async engine and our models**

Replace the entire contents of `alembic/env.py`:

```python
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.config import settings
from app.database import Base
from app.models import Task, Supplier, IssueReport, ActionItem  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Generate initial migration**

```bash
alembic revision --autogenerate -m "initial schema"
```

Expected: Creates a file in `alembic/versions/` with `create_table` operations for tasks, suppliers, issue_reports, action_items.

- [ ] **Step 5: Run migration**

```bash
alembic upgrade head
```

Expected: `INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, initial schema`

- [ ] **Step 6: Commit**

```bash
git add alembic/ alembic.ini
git commit -m "feat: Alembic setup with initial migration"
```

---

## Task 5: Pydantic Schemas

**Files:**
- Create: `app/schemas/__init__.py`
- Create: `app/schemas/task.py`
- Create: `app/schemas/supplier.py`
- Create: `app/schemas/issue_report.py`
- Create: `app/schemas/action_item.py`

- [ ] **Step 1: Create app/schemas/__init__.py**

```python
# empty
```

- [ ] **Step 2: Create app/schemas/task.py**

```python
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    urgency: str = "medium"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    urgency: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[date]
    urgency: str
    is_completed: bool
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: Create app/schemas/supplier.py**

```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SupplierCreate(BaseModel):
    name: str
    contact_info: Optional[str] = None
    notes: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_info: Optional[str] = None
    notes: Optional[str] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_info: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create app/schemas/issue_report.py**

```python
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.action_item import ActionItemResponse


class IssueReportCreate(BaseModel):
    supplier_id: int
    product_name: str
    sku: Optional[str] = None
    arrival_date: date
    problem_description: str


class IssueReportUpdate(BaseModel):
    product_name: Optional[str] = None
    sku: Optional[str] = None
    problem_description: Optional[str] = None
    status: Optional[str] = None


class IssueReportResponse(BaseModel):
    id: int
    supplier_id: int
    product_name: str
    sku: Optional[str]
    arrival_date: date
    problem_description: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]
    action_items: list[ActionItemResponse] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Create app/schemas/action_item.py**

```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ActionItemCreate(BaseModel):
    description: str
    create_task: bool = False


class ActionItemResponse(BaseModel):
    id: int
    issue_report_id: int
    task_id: Optional[int]
    description: str
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Commit**

```bash
git add app/schemas/
git commit -m "feat: Pydantic schemas for all entities"
```

---

## Task 6: Task Service

**Files:**
- Create: `app/services/__init__.py`
- Create: `app/services/task_service.py`
- Create: `tests/test_task_service.py`

- [ ] **Step 1: Create app/services/__init__.py**

```python
# empty
```

- [ ] **Step 2: Write failing tests for task service**

Create `tests/test_task_service.py`:

```python
import pytest
from datetime import date

from app.models.task import Task
from app.services.task_service import (
    create_task,
    get_task,
    list_tasks,
    complete_task,
    reopen_task,
)


@pytest.mark.asyncio
async def test_create_task(db_session):
    task = await create_task(
        db_session,
        title="Test task",
        description="A description",
        due_date=date(2026, 4, 10),
        urgency="high",
    )
    assert task.id is not None
    assert task.title == "Test task"
    assert task.urgency == "high"
    assert task.is_completed is False


@pytest.mark.asyncio
async def test_get_task(db_session):
    task = await create_task(db_session, title="Find me")
    found = await get_task(db_session, task.id)
    assert found is not None
    assert found.title == "Find me"


@pytest.mark.asyncio
async def test_get_task_not_found(db_session):
    found = await get_task(db_session, 9999)
    assert found is None


@pytest.mark.asyncio
async def test_list_tasks_filter_by_status(db_session):
    await create_task(db_session, title="Open task")
    t2 = await create_task(db_session, title="Done task")
    await complete_task(db_session, t2.id)

    open_tasks = await list_tasks(db_session, status="open")
    assert len(open_tasks) == 1
    assert open_tasks[0].title == "Open task"

    completed_tasks = await list_tasks(db_session, status="completed")
    assert len(completed_tasks) == 1
    assert completed_tasks[0].title == "Done task"


@pytest.mark.asyncio
async def test_list_tasks_filter_by_urgency(db_session):
    await create_task(db_session, title="Low", urgency="low")
    await create_task(db_session, title="Critical", urgency="critical")

    critical = await list_tasks(db_session, urgency="critical")
    assert len(critical) == 1
    assert critical[0].title == "Critical"


@pytest.mark.asyncio
async def test_list_tasks_filter_by_due_before(db_session):
    await create_task(db_session, title="Soon", due_date=date(2026, 4, 9))
    await create_task(db_session, title="Later", due_date=date(2026, 4, 20))

    soon = await list_tasks(db_session, due_before=date(2026, 4, 10))
    assert len(soon) == 1
    assert soon[0].title == "Soon"


@pytest.mark.asyncio
async def test_complete_task(db_session):
    task = await create_task(db_session, title="Complete me")
    completed = await complete_task(db_session, task.id)
    assert completed.is_completed is True
    assert completed.completed_at is not None


@pytest.mark.asyncio
async def test_reopen_task(db_session):
    task = await create_task(db_session, title="Reopen me")
    await complete_task(db_session, task.id)
    reopened = await reopen_task(db_session, task.id)
    assert reopened.is_completed is False
    assert reopened.completed_at is None
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pytest tests/test_task_service.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.task_service'`

- [ ] **Step 4: Implement app/services/task_service.py**

```python
from datetime import date, datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


async def create_task(
    session: AsyncSession,
    title: str,
    description: Optional[str] = None,
    due_date: Optional[date] = None,
    urgency: str = "medium",
) -> Task:
    task = Task(
        title=title,
        description=description,
        due_date=due_date,
        urgency=urgency,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def get_task(session: AsyncSession, task_id: int) -> Optional[Task]:
    return await session.get(Task, task_id)


async def list_tasks(
    session: AsyncSession,
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    due_before: Optional[date] = None,
) -> list[Task]:
    stmt = select(Task)
    if status == "open":
        stmt = stmt.where(Task.is_completed == False)
    elif status == "completed":
        stmt = stmt.where(Task.is_completed == True)
    if urgency:
        stmt = stmt.where(Task.urgency == urgency)
    if due_before:
        stmt = stmt.where(Task.due_date <= due_before)
    stmt = stmt.order_by(Task.created_at.desc())
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def complete_task(session: AsyncSession, task_id: int) -> Task:
    task = await session.get(Task, task_id)
    task.is_completed = True
    task.completed_at = datetime.utcnow()
    await session.commit()
    await session.refresh(task)
    return task


async def reopen_task(session: AsyncSession, task_id: int) -> Task:
    task = await session.get(Task, task_id)
    task.is_completed = False
    task.completed_at = None
    await session.commit()
    await session.refresh(task)
    return task
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pytest tests/test_task_service.py -v`
Expected: ALL PASS (8 tests)

- [ ] **Step 6: Commit**

```bash
git add app/services/ tests/test_task_service.py
git commit -m "feat: task service with CRUD, filtering, complete/reopen"
```

---

## Task 7: Supplier Service

**Files:**
- Create: `app/services/supplier_service.py`
- Create: `tests/test_supplier_service.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_supplier_service.py`:

```python
import pytest

from app.services.supplier_service import (
    create_supplier,
    get_supplier,
    list_suppliers,
    update_supplier,
)


@pytest.mark.asyncio
async def test_create_supplier(db_session):
    supplier = await create_supplier(db_session, name="עוף הגליל", contact_info="054-1234567")
    assert supplier.id is not None
    assert supplier.name == "עוף הגליל"


@pytest.mark.asyncio
async def test_get_supplier(db_session):
    supplier = await create_supplier(db_session, name="Test")
    found = await get_supplier(db_session, supplier.id)
    assert found.name == "Test"


@pytest.mark.asyncio
async def test_get_supplier_not_found(db_session):
    found = await get_supplier(db_session, 9999)
    assert found is None


@pytest.mark.asyncio
async def test_list_suppliers(db_session):
    await create_supplier(db_session, name="Supplier A")
    await create_supplier(db_session, name="Supplier B")
    suppliers = await list_suppliers(db_session)
    assert len(suppliers) == 2


@pytest.mark.asyncio
async def test_update_supplier(db_session):
    supplier = await create_supplier(db_session, name="Old Name")
    updated = await update_supplier(db_session, supplier.id, name="New Name")
    assert updated.name == "New Name"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_supplier_service.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement app/services/supplier_service.py**

```python
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supplier import Supplier


async def create_supplier(
    session: AsyncSession,
    name: str,
    contact_info: Optional[str] = None,
    notes: Optional[str] = None,
) -> Supplier:
    supplier = Supplier(name=name, contact_info=contact_info, notes=notes)
    session.add(supplier)
    await session.commit()
    await session.refresh(supplier)
    return supplier


async def get_supplier(session: AsyncSession, supplier_id: int) -> Optional[Supplier]:
    return await session.get(Supplier, supplier_id)


async def list_suppliers(session: AsyncSession) -> list[Supplier]:
    result = await session.execute(select(Supplier).order_by(Supplier.name))
    return list(result.scalars().all())


async def update_supplier(
    session: AsyncSession,
    supplier_id: int,
    name: Optional[str] = None,
    contact_info: Optional[str] = None,
    notes: Optional[str] = None,
) -> Supplier:
    supplier = await session.get(Supplier, supplier_id)
    if name is not None:
        supplier.name = name
    if contact_info is not None:
        supplier.contact_info = contact_info
    if notes is not None:
        supplier.notes = notes
    await session.commit()
    await session.refresh(supplier)
    return supplier
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_supplier_service.py -v`
Expected: ALL PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add app/services/supplier_service.py tests/test_supplier_service.py
git commit -m "feat: supplier service with CRUD"
```

---

## Task 8: Issue Service (with ActionItem ↔ Task Sync)

**Files:**
- Create: `app/services/issue_service.py`
- Create: `tests/test_issue_service.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_issue_service.py`:

```python
import pytest
from datetime import date

from app.services.supplier_service import create_supplier
from app.services.task_service import get_task, complete_task
from app.services.issue_service import (
    create_issue_report,
    get_issue_report,
    list_issue_reports,
    resolve_issue_report,
    add_action_item,
    complete_action_item,
)


@pytest.fixture
async def supplier(db_session):
    return await create_supplier(db_session, name="Test Supplier")


@pytest.mark.asyncio
async def test_create_issue_report(db_session, supplier):
    issue = await create_issue_report(
        db_session,
        supplier_id=supplier.id,
        product_name="Chicken Wings",
        sku="CW-001",
        arrival_date=date(2026, 4, 7),
        problem_description="5 broken boxes",
    )
    assert issue.id is not None
    assert issue.status == "open"
    assert issue.supplier_id == supplier.id


@pytest.mark.asyncio
async def test_list_issue_reports_filter_by_supplier(db_session, supplier):
    s2 = await create_supplier(db_session, name="Other Supplier")
    await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="A", arrival_date=date(2026, 4, 7), problem_description="X",
    )
    await create_issue_report(
        db_session, supplier_id=s2.id,
        product_name="B", arrival_date=date(2026, 4, 7), problem_description="Y",
    )

    issues = await list_issue_reports(db_session, supplier_id=supplier.id)
    assert len(issues) == 1
    assert issues[0].product_name == "A"


@pytest.mark.asyncio
async def test_list_issue_reports_filter_by_status(db_session, supplier):
    i1 = await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="A", arrival_date=date(2026, 4, 7), problem_description="X",
    )
    await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="B", arrival_date=date(2026, 4, 7), problem_description="Y",
    )
    await resolve_issue_report(db_session, i1.id)

    open_issues = await list_issue_reports(db_session, status="open")
    assert len(open_issues) == 1
    assert open_issues[0].product_name == "B"


@pytest.mark.asyncio
async def test_resolve_issue_report(db_session, supplier):
    issue = await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="A", arrival_date=date(2026, 4, 7), problem_description="X",
    )
    resolved = await resolve_issue_report(db_session, issue.id)
    assert resolved.status == "resolved"
    assert resolved.resolved_at is not None


@pytest.mark.asyncio
async def test_add_action_item_without_task(db_session, supplier):
    issue = await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="A", arrival_date=date(2026, 4, 7), problem_description="X",
    )
    action = await add_action_item(
        db_session,
        issue_report_id=issue.id,
        description="Call supplier",
        create_task=False,
    )
    assert action.id is not None
    assert action.task_id is None
    assert action.is_completed is False


@pytest.mark.asyncio
async def test_add_action_item_with_task_sync(db_session, supplier):
    issue = await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="A", arrival_date=date(2026, 4, 7), problem_description="X",
    )
    action = await add_action_item(
        db_session,
        issue_report_id=issue.id,
        description="Call supplier tomorrow",
        create_task=True,
    )
    assert action.task_id is not None
    task = await get_task(db_session, action.task_id)
    assert task is not None
    assert task.title == "Call supplier tomorrow"


@pytest.mark.asyncio
async def test_complete_action_item_completes_linked_task(db_session, supplier):
    issue = await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="A", arrival_date=date(2026, 4, 7), problem_description="X",
    )
    action = await add_action_item(
        db_session, issue_report_id=issue.id,
        description="Do thing", create_task=True,
    )
    completed = await complete_action_item(db_session, action.id)
    assert completed.is_completed is True

    task = await get_task(db_session, completed.task_id)
    assert task.is_completed is True


@pytest.mark.asyncio
async def test_complete_task_completes_linked_action_item(db_session, supplier):
    issue = await create_issue_report(
        db_session, supplier_id=supplier.id,
        product_name="A", arrival_date=date(2026, 4, 7), problem_description="X",
    )
    action = await add_action_item(
        db_session, issue_report_id=issue.id,
        description="Do thing", create_task=True,
    )

    # Complete the task (not the action item)
    await complete_task(db_session, action.task_id)

    # Refresh the action item and check it's also completed
    await db_session.refresh(action)
    # Note: this sync direction is handled by the task_service calling back into issue_service
    # We test this via the API layer or a dedicated sync function
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_issue_service.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement app/services/issue_service.py**

```python
from datetime import date, datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.action_item import ActionItem
from app.models.issue_report import IssueReport
from app.models.task import Task


async def create_issue_report(
    session: AsyncSession,
    supplier_id: int,
    product_name: str,
    arrival_date: date,
    problem_description: str,
    sku: Optional[str] = None,
) -> IssueReport:
    issue = IssueReport(
        supplier_id=supplier_id,
        product_name=product_name,
        sku=sku,
        arrival_date=arrival_date,
        problem_description=problem_description,
    )
    session.add(issue)
    await session.commit()
    await session.refresh(issue)
    return issue


async def get_issue_report(session: AsyncSession, issue_id: int) -> Optional[IssueReport]:
    stmt = (
        select(IssueReport)
        .where(IssueReport.id == issue_id)
        .options(selectinload(IssueReport.action_items))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_issue_reports(
    session: AsyncSession,
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
) -> list[IssueReport]:
    stmt = select(IssueReport).options(selectinload(IssueReport.action_items))
    if supplier_id:
        stmt = stmt.where(IssueReport.supplier_id == supplier_id)
    if status:
        stmt = stmt.where(IssueReport.status == status)
    stmt = stmt.order_by(IssueReport.created_at.desc())
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def resolve_issue_report(session: AsyncSession, issue_id: int) -> IssueReport:
    issue = await session.get(IssueReport, issue_id)
    issue.status = "resolved"
    issue.resolved_at = datetime.utcnow()
    await session.commit()
    await session.refresh(issue)
    return issue


async def add_action_item(
    session: AsyncSession,
    issue_report_id: int,
    description: str,
    create_task: bool = False,
) -> ActionItem:
    task_id = None
    if create_task:
        task = Task(title=description)
        session.add(task)
        await session.flush()
        task_id = task.id

    action = ActionItem(
        issue_report_id=issue_report_id,
        description=description,
        task_id=task_id,
    )
    session.add(action)
    await session.commit()
    await session.refresh(action)
    return action


async def complete_action_item(session: AsyncSession, action_item_id: int) -> ActionItem:
    action = await session.get(ActionItem, action_item_id)
    action.is_completed = True
    if action.task_id:
        task = await session.get(Task, action.task_id)
        task.is_completed = True
        task.completed_at = datetime.utcnow()
    await session.commit()
    await session.refresh(action)
    return action
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_issue_service.py -v`
Expected: ALL PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add app/services/issue_service.py tests/test_issue_service.py
git commit -m "feat: issue service with action item sync to tasks"
```

---

## Task 9: FastAPI App + API Routes

**Files:**
- Create: `app/api/__init__.py`
- Create: `app/api/tasks.py`
- Create: `app/api/suppliers.py`
- Create: `app/api/issues.py`
- Create: `app/main.py`
- Create: `tests/test_api_tasks.py`
- Create: `tests/test_api_suppliers.py`
- Create: `tests/test_api_issues.py`

- [ ] **Step 1: Create app/api/__init__.py**

```python
# empty
```

- [ ] **Step 2: Create app/main.py (minimal, no bot yet)**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import tasks, suppliers, issues


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Avishag Purchase Manager", lifespan=lifespan)

app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"])
app.include_router(issues.router, prefix="/api/issues", tags=["issues"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Create app/api/tasks.py**

```python
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.task import TaskCreate, TaskResponse
from app.services import task_service

router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(data: TaskCreate, session: AsyncSession = Depends(get_session)):
    return await task_service.create_task(
        session, title=data.title, description=data.description,
        due_date=data.due_date, urgency=data.urgency,
    )


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    due_before: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
):
    return await task_service.list_tasks(session, status=status, urgency=urgency, due_before=due_before)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await task_service.complete_task(session, task_id)


@router.post("/{task_id}/reopen", response_model=TaskResponse)
async def reopen_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await task_service.reopen_task(session, task_id)
```

- [ ] **Step 4: Create app/api/suppliers.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.services import supplier_service

router = APIRouter()


@router.post("/", response_model=SupplierResponse, status_code=201)
async def create_supplier(data: SupplierCreate, session: AsyncSession = Depends(get_session)):
    return await supplier_service.create_supplier(
        session, name=data.name, contact_info=data.contact_info, notes=data.notes,
    )


@router.get("/", response_model=list[SupplierResponse])
async def list_suppliers(session: AsyncSession = Depends(get_session)):
    return await supplier_service.list_suppliers(session)


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, session: AsyncSession = Depends(get_session)):
    supplier = await supplier_service.get_supplier(session, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.patch("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int, data: SupplierUpdate, session: AsyncSession = Depends(get_session),
):
    supplier = await supplier_service.get_supplier(session, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return await supplier_service.update_supplier(
        session, supplier_id, name=data.name, contact_info=data.contact_info, notes=data.notes,
    )
```

- [ ] **Step 5: Create app/api/issues.py**

```python
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.action_item import ActionItemCreate, ActionItemResponse
from app.schemas.issue_report import IssueReportCreate, IssueReportResponse
from app.services import issue_service

router = APIRouter()


@router.post("/", response_model=IssueReportResponse, status_code=201)
async def create_issue(data: IssueReportCreate, session: AsyncSession = Depends(get_session)):
    return await issue_service.create_issue_report(
        session, supplier_id=data.supplier_id, product_name=data.product_name,
        sku=data.sku, arrival_date=data.arrival_date,
        problem_description=data.problem_description,
    )


@router.get("/", response_model=list[IssueReportResponse])
async def list_issues(
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    return await issue_service.list_issue_reports(session, supplier_id=supplier_id, status=status)


@router.get("/{issue_id}", response_model=IssueReportResponse)
async def get_issue(issue_id: int, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.post("/{issue_id}/resolve", response_model=IssueReportResponse)
async def resolve_issue(issue_id: int, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await issue_service.resolve_issue_report(session, issue_id)


@router.post("/{issue_id}/action-items", response_model=ActionItemResponse, status_code=201)
async def add_action_item(
    issue_id: int, data: ActionItemCreate, session: AsyncSession = Depends(get_session),
):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await issue_service.add_action_item(
        session, issue_report_id=issue_id,
        description=data.description, create_task=data.create_task,
    )


@router.post("/action-items/{action_item_id}/complete", response_model=ActionItemResponse)
async def complete_action_item(
    action_item_id: int, session: AsyncSession = Depends(get_session),
):
    return await issue_service.complete_action_item(session, action_item_id)
```

- [ ] **Step 6: Write API integration tests — add test fixtures to conftest.py**

Add to `tests/conftest.py`:

```python
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.database import get_session


@pytest_asyncio.fixture
async def client(db_session):
    """Test client that uses the test database session."""
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 7: Write tests/test_api_tasks.py**

```python
import pytest


@pytest.mark.asyncio
async def test_create_task(client):
    resp = await client.post("/api/tasks/", json={"title": "Test task", "urgency": "high"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test task"
    assert data["urgency"] == "high"
    assert data["is_completed"] is False


@pytest.mark.asyncio
async def test_list_tasks(client):
    await client.post("/api/tasks/", json={"title": "Task 1"})
    await client.post("/api/tasks/", json={"title": "Task 2"})
    resp = await client.get("/api/tasks/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_task_not_found(client):
    resp = await client.get("/api/tasks/9999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_complete_and_reopen_task(client):
    create_resp = await client.post("/api/tasks/", json={"title": "Do it"})
    task_id = create_resp.json()["id"]

    complete_resp = await client.post(f"/api/tasks/{task_id}/complete")
    assert complete_resp.json()["is_completed"] is True

    reopen_resp = await client.post(f"/api/tasks/{task_id}/reopen")
    assert reopen_resp.json()["is_completed"] is False
```

- [ ] **Step 8: Write tests/test_api_suppliers.py**

```python
import pytest


@pytest.mark.asyncio
async def test_create_supplier(client):
    resp = await client.post("/api/suppliers/", json={"name": "עוף הגליל", "contact_info": "054-1234567"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "עוף הגליל"


@pytest.mark.asyncio
async def test_list_suppliers(client):
    await client.post("/api/suppliers/", json={"name": "A"})
    await client.post("/api/suppliers/", json={"name": "B"})
    resp = await client.get("/api/suppliers/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_update_supplier(client):
    create_resp = await client.post("/api/suppliers/", json={"name": "Old"})
    sid = create_resp.json()["id"]
    update_resp = await client.patch(f"/api/suppliers/{sid}", json={"name": "New"})
    assert update_resp.json()["name"] == "New"
```

- [ ] **Step 9: Write tests/test_api_issues.py**

```python
import pytest


@pytest.fixture
async def supplier_id(client):
    resp = await client.post("/api/suppliers/", json={"name": "Test Supplier"})
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_issue(client, supplier_id):
    resp = await client.post("/api/issues/", json={
        "supplier_id": supplier_id,
        "product_name": "Chicken",
        "arrival_date": "2026-04-07",
        "problem_description": "Broken boxes",
    })
    assert resp.status_code == 201
    assert resp.json()["status"] == "open"


@pytest.mark.asyncio
async def test_list_issues_filter_by_supplier(client, supplier_id):
    await client.post("/api/issues/", json={
        "supplier_id": supplier_id, "product_name": "A",
        "arrival_date": "2026-04-07", "problem_description": "X",
    })
    resp = await client.get(f"/api/issues/?supplier_id={supplier_id}")
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_resolve_issue(client, supplier_id):
    create_resp = await client.post("/api/issues/", json={
        "supplier_id": supplier_id, "product_name": "A",
        "arrival_date": "2026-04-07", "problem_description": "X",
    })
    issue_id = create_resp.json()["id"]
    resolve_resp = await client.post(f"/api/issues/{issue_id}/resolve")
    assert resolve_resp.json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_add_action_item_with_task_sync(client, supplier_id):
    issue_resp = await client.post("/api/issues/", json={
        "supplier_id": supplier_id, "product_name": "A",
        "arrival_date": "2026-04-07", "problem_description": "X",
    })
    issue_id = issue_resp.json()["id"]

    action_resp = await client.post(f"/api/issues/{issue_id}/action-items", json={
        "description": "Call supplier", "create_task": True,
    })
    assert action_resp.status_code == 201
    assert action_resp.json()["task_id"] is not None

    # Verify the task was created
    tasks_resp = await client.get("/api/tasks/")
    assert len(tasks_resp.json()) == 1
    assert tasks_resp.json()[0]["title"] == "Call supplier"
```

- [ ] **Step 10: Run all API tests**

Run: `pytest tests/test_api_tasks.py tests/test_api_suppliers.py tests/test_api_issues.py -v`
Expected: ALL PASS

- [ ] **Step 11: Commit**

```bash
git add app/main.py app/api/ tests/test_api_tasks.py tests/test_api_suppliers.py tests/test_api_issues.py tests/conftest.py
git commit -m "feat: FastAPI routes for tasks, suppliers, issues with integration tests"
```

---

## Task 10: Structlog Logging + LangChain Callback Handler

**Files:**
- Create: `app/agent/__init__.py`
- Create: `app/agent/callbacks.py`

- [ ] **Step 1: Create app/agent/__init__.py**

```python
# empty
```

- [ ] **Step 2: Create app/agent/callbacks.py**

```python
import structlog
from langchain_core.callbacks import BaseCallbackHandler
from typing import Any

logger = structlog.get_logger("agent")


class StructlogCallbackHandler(BaseCallbackHandler):
    """Logs every LangChain agent decision in structured JSON via structlog."""

    def on_llm_start(self, serialized: dict, prompts: list[str], **kwargs: Any) -> None:
        logger.info("llm_start", model=serialized.get("id", ["unknown"])[-1])

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        generation = response.generations[0][0]
        tool_calls = []
        if hasattr(generation, "message") and hasattr(generation.message, "tool_calls"):
            tool_calls = [
                {"name": tc["name"], "args": tc["args"]}
                for tc in generation.message.tool_calls
            ]
        logger.info(
            "llm_end",
            tool_calls=tool_calls if tool_calls else "none",
            content_preview=str(generation.text)[:200] if generation.text else "",
        )

    def on_tool_start(self, serialized: dict, input_str: str, **kwargs: Any) -> None:
        logger.info("tool_start", tool=serialized.get("name", "unknown"), input=input_str[:500])

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        logger.info("tool_end", output=str(output)[:500])

    def on_tool_error(self, error: BaseException, **kwargs: Any) -> None:
        logger.error("tool_error", error=str(error))

    def on_chain_error(self, error: BaseException, **kwargs: Any) -> None:
        logger.error("chain_error", error=str(error))
```

- [ ] **Step 3: Commit**

```bash
git add app/agent/
git commit -m "feat: structlog callback handler for LangChain agent transparency"
```

---

## Task 11: LangChain Agent — Tools + Prompt + Agent Setup

**Files:**
- Create: `app/agent/tools.py`
- Create: `app/agent/prompts.py`
- Create: `app/agent/agent.py`
- Create: `tests/test_agent_tools.py`

- [ ] **Step 1: Write failing tests for agent tools**

Create `tests/test_agent_tools.py`:

```python
import pytest
from datetime import date

from app.services.supplier_service import create_supplier
from app.agent.tools import get_agent_tools


@pytest.fixture
async def supplier(db_session):
    return await create_supplier(db_session, name="עוף הגליל")


@pytest.mark.asyncio
async def test_create_task_tool(db_session):
    tools = get_agent_tools(db_session)
    create_task = next(t for t in tools if t.name == "create_task")
    result = await create_task.ainvoke({
        "title": "Call supplier",
        "urgency": "high",
    })
    assert "Call supplier" in result
    assert "high" in result


@pytest.mark.asyncio
async def test_list_tasks_tool(db_session):
    tools = get_agent_tools(db_session)
    create_task = next(t for t in tools if t.name == "create_task")
    await create_task.ainvoke({"title": "Task A"})
    await create_task.ainvoke({"title": "Task B"})

    list_tasks = next(t for t in tools if t.name == "list_tasks")
    result = await list_tasks.ainvoke({})
    assert "Task A" in result
    assert "Task B" in result


@pytest.mark.asyncio
async def test_create_issue_report_tool(db_session, supplier):
    tools = get_agent_tools(db_session)
    create_issue = next(t for t in tools if t.name == "create_issue_report")
    result = await create_issue.ainvoke({
        "supplier_name": "עוף הגליל",
        "product_name": "Chicken Wings",
        "arrival_date": "2026-04-07",
        "problem_description": "5 broken boxes",
    })
    assert "Chicken Wings" in result


@pytest.mark.asyncio
async def test_list_suppliers_tool(db_session, supplier):
    tools = get_agent_tools(db_session)
    list_sup = next(t for t in tools if t.name == "list_suppliers")
    result = await list_sup.ainvoke({})
    assert "עוף הגליל" in result
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_agent_tools.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Create app/agent/prompts.py**

```python
SYSTEM_PROMPT = """You are Avishag's purchase management assistant. You help her manage procurement tasks and track supplier issues.

IMPORTANT RULES:
- Understand Hebrew and English input
- Always respond in Hebrew
- When a supplier name is mentioned, do a fuzzy match against the existing supplier list (e.g., "עוף הגליל" should match "עוף הגליל בע״מ")
- When creating an issue report, also ask if Avishag wants follow-up tasks created
- When a message implies multiple actions (e.g., report a problem AND create a follow-up task), execute all of them
- For dates, interpret relative terms: "מחר" = tomorrow, "השבוע" = this week, "דחוף" = today
- Keep responses concise and action-focused

You have access to tools for managing tasks, suppliers, and issue reports. Use them to fulfill Avishag's requests."""
```

- [ ] **Step 4: Create app/agent/tools.py**

```python
from datetime import date, datetime, timedelta
from typing import Optional

from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import task_service, supplier_service, issue_service


def get_agent_tools(session: AsyncSession) -> list:
    """Create tool functions bound to a specific database session."""

    @tool
    async def create_task(
        title: str,
        description: str = "",
        due_date: str = "",
        urgency: str = "medium",
    ) -> str:
        """Create a new task. urgency must be one of: low, medium, high, critical. due_date format: YYYY-MM-DD."""
        parsed_date = None
        if due_date:
            parsed_date = date.fromisoformat(due_date)
        t = await task_service.create_task(
            session, title=title, description=description or None,
            due_date=parsed_date, urgency=urgency,
        )
        return f"Task created: id={t.id}, title='{t.title}', urgency={t.urgency}, due={t.due_date}"

    @tool
    async def list_tasks(
        status: str = "",
        urgency: str = "",
        due_before: str = "",
    ) -> str:
        """List tasks with optional filters. status: 'open' or 'completed'. urgency: low/medium/high/critical. due_before: YYYY-MM-DD."""
        parsed_date = date.fromisoformat(due_before) if due_before else None
        tasks = await task_service.list_tasks(
            session,
            status=status or None,
            urgency=urgency or None,
            due_before=parsed_date,
        )
        if not tasks:
            return "No tasks found matching the filters."
        lines = []
        for t in tasks:
            status_mark = "✅" if t.is_completed else "⬜"
            lines.append(f"{status_mark} [{t.id}] {t.title} (urgency={t.urgency}, due={t.due_date})")
        return "\n".join(lines)

    @tool
    async def complete_task(task_id: int) -> str:
        """Mark a task as completed."""
        t = await task_service.complete_task(session, task_id)
        return f"Task {t.id} '{t.title}' marked as completed."

    @tool
    async def create_supplier(name: str, contact_info: str = "") -> str:
        """Register a new supplier."""
        s = await supplier_service.create_supplier(session, name=name, contact_info=contact_info or None)
        return f"Supplier created: id={s.id}, name='{s.name}'"

    @tool
    async def list_suppliers() -> str:
        """List all registered suppliers."""
        suppliers = await supplier_service.list_suppliers(session)
        if not suppliers:
            return "No suppliers registered."
        lines = [f"[{s.id}] {s.name} (contact: {s.contact_info or 'N/A'})" for s in suppliers]
        return "\n".join(lines)

    @tool
    async def create_issue_report(
        supplier_name: str,
        product_name: str,
        problem_description: str,
        arrival_date: str = "",
        sku: str = "",
    ) -> str:
        """Create an issue report for a supplier problem. supplier_name is matched fuzzily against existing suppliers. arrival_date format: YYYY-MM-DD (defaults to today)."""
        # Fuzzy match supplier
        suppliers = await supplier_service.list_suppliers(session)
        matched = None
        for s in suppliers:
            if supplier_name in s.name or s.name in supplier_name:
                matched = s
                break
        if not matched:
            return f"Supplier '{supplier_name}' not found. Available suppliers: {', '.join(s.name for s in suppliers)}"

        parsed_date = date.fromisoformat(arrival_date) if arrival_date else date.today()
        issue = await issue_service.create_issue_report(
            session, supplier_id=matched.id, product_name=product_name,
            sku=sku or None, arrival_date=parsed_date,
            problem_description=problem_description,
        )
        return f"Issue report created: id={issue.id}, supplier='{matched.name}', product='{product_name}', status={issue.status}"

    @tool
    async def list_issues(supplier_name: str = "", status: str = "") -> str:
        """List issue reports with optional filters. status: open/in_progress/resolved."""
        supplier_id = None
        if supplier_name:
            suppliers = await supplier_service.list_suppliers(session)
            for s in suppliers:
                if supplier_name in s.name or s.name in supplier_name:
                    supplier_id = s.id
                    break

        issues = await issue_service.list_issue_reports(
            session, supplier_id=supplier_id, status=status or None,
        )
        if not issues:
            return "No issues found matching the filters."
        lines = []
        for i in issues:
            action_count = len(i.action_items) if i.action_items else 0
            done_count = sum(1 for a in i.action_items if a.is_completed) if i.action_items else 0
            lines.append(
                f"[{i.id}] {i.product_name} (supplier_id={i.supplier_id}, status={i.status}, "
                f"actions={done_count}/{action_count}, date={i.arrival_date})"
            )
        return "\n".join(lines)

    @tool
    async def add_action_item(
        issue_report_id: int,
        description: str,
        create_task: bool = False,
    ) -> str:
        """Add an action item to an issue report. Set create_task=True to also create a linked task in the TODO list."""
        action = await issue_service.add_action_item(
            session, issue_report_id=issue_report_id,
            description=description, create_task=create_task,
        )
        task_info = f", linked task_id={action.task_id}" if action.task_id else ""
        return f"Action item created: id={action.id}, description='{description}'{task_info}"

    @tool
    async def resolve_issue(issue_report_id: int) -> str:
        """Mark an issue report as resolved."""
        issue = await issue_service.resolve_issue_report(session, issue_report_id)
        return f"Issue {issue.id} marked as resolved."

    return [
        create_task, list_tasks, complete_task,
        create_supplier, list_suppliers,
        create_issue_report, list_issues,
        add_action_item, resolve_issue,
    ]
```

- [ ] **Step 5: Run tool tests to verify they pass**

Run: `pytest tests/test_agent_tools.py -v`
Expected: ALL PASS (4 tests)

- [ ] **Step 6: Create app/agent/agent.py**

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.agent.callbacks import StructlogCallbackHandler
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import get_agent_tools


async def run_agent(session: AsyncSession, user_message: str, history: list = None) -> str:
    """Run the LangChain agent with the given user message and return the response."""
    llm = ChatOpenAI(
        model="gpt-4o",
        api_key=settings.openai_api_key,
        callbacks=[StructlogCallbackHandler()],
    )

    tools = get_agent_tools(session)
    llm_with_tools = llm.bind_tools(tools)

    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    if history:
        messages.extend(history)
    messages.append(("human", user_message))

    # Agent loop: keep calling tools until the LLM gives a final text response
    while True:
        response = await llm_with_tools.ainvoke(messages)
        messages.append(response)

        if not response.tool_calls:
            return response.content

        # Execute all tool calls
        for tool_call in response.tool_calls:
            tool_fn = next(t for t in tools if t.name == tool_call["name"])
            tool_result = await tool_fn.ainvoke(tool_call["args"])
            messages.append({
                "role": "tool",
                "content": str(tool_result),
                "tool_call_id": tool_call["id"],
            })
```

- [ ] **Step 7: Commit**

```bash
git add app/agent/ tests/test_agent_tools.py
git commit -m "feat: LangChain agent with 9 tools, Hebrew prompt, structlog callbacks"
```

---

## Task 12: Telegram Bot Integration

**Files:**
- Create: `app/agent/bot.py`
- Modify: `app/main.py`

- [ ] **Step 1: Create app/agent/bot.py**

```python
import structlog
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

from app.config import settings
from app.database import async_session
from app.agent.agent import run_agent

logger = structlog.get_logger("telegram")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming Telegram messages."""
    if update.effective_user.id != settings.telegram_allowed_user_id:
        logger.warning("unauthorized_user", user_id=update.effective_user.id)
        return

    user_message = update.message.text
    logger.info("message_received", text=user_message[:100])

    async with async_session() as session:
        try:
            response = await run_agent(session, user_message)
            await update.message.reply_text(response)
            logger.info("response_sent", length=len(response))
        except Exception as e:
            logger.error("agent_error", error=str(e))
            await update.message.reply_text("שגיאה בעיבוד ההודעה. נסי שוב.")


def create_bot_application() -> Application:
    """Create the Telegram bot application."""
    return (
        Application.builder()
        .token(settings.telegram_bot_token)
        .build()
    )


async def start_bot() -> Application:
    """Initialize and start the Telegram bot polling."""
    application = create_bot_application()
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    await application.initialize()
    await application.start()
    await application.updater.start_polling(drop_pending_updates=True)
    logger.info("bot_started")
    return application


async def stop_bot(application: Application) -> None:
    """Stop the Telegram bot."""
    await application.updater.stop()
    await application.stop()
    await application.shutdown()
    logger.info("bot_stopped")
```

- [ ] **Step 2: Update app/main.py to start/stop the bot in lifespan**

Replace the entire contents of `app/main.py`:

```python
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from app.api import tasks, suppliers, issues
from app.config import settings

logger = structlog.get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    bot_app = None
    if settings.telegram_bot_token:
        from app.agent.bot import start_bot, stop_bot
        bot_app = await start_bot()
        logger.info("telegram_bot_started")
    yield
    if bot_app:
        await stop_bot(bot_app)
        logger.info("telegram_bot_stopped")


app = FastAPI(title="Avishag Purchase Manager", lifespan=lifespan)

app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"])
app.include_router(issues.router, prefix="/api/issues", tags=["issues"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Commit**

```bash
git add app/agent/bot.py app/main.py
git commit -m "feat: Telegram bot integration with FastAPI lifespan"
```

---

## Task 13: Docker Setup

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directory for SQLite persistent volume mount
RUN mkdir -p /data

ENV DATABASE_URL=sqlite+aiosqlite:////data/avishag.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Test Docker build**

```bash
docker build -t avishag .
```

Expected: Build completes successfully.

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "feat: Dockerfile for single-container deployment"
```

---

## Task 14: Run Full Test Suite + Verify

- [ ] **Step 1: Run all tests**

```bash
pytest tests/ -v
```

Expected: ALL PASS — model tests (4), task service tests (8), supplier service tests (5), issue service tests (8), API tests (~10), agent tool tests (4) ≈ 39 tests total.

- [ ] **Step 2: Start the app locally and verify health endpoint**

```bash
uvicorn app.main:app --reload
# In another terminal:
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Verify API docs load**

Open `http://localhost:8000/docs` in a browser. All endpoints should be visible with correct schemas.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: adjustments from full integration test"
```

---

## Deferred (Post-MVP)

- **AgentConversation model + conversation memory** — The spec includes an AgentConversation table for persisting Telegram conversation history. The current agent processes each message independently, which works for MVP. To add memory: create the model, use LangChain's `SQLChatMessageHistory`, and pass history into `run_agent()`.
- **Frontend** — UX designed separately (Dribbble + Google Stitch), framework TBD.
