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
