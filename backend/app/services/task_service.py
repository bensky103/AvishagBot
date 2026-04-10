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


async def update_task(session: AsyncSession, task_id: int, **kwargs) -> Task:
    task = await session.get(Task, task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")
    for key, value in kwargs.items():
        if value is not None:
            setattr(task, key, value)
    await session.commit()
    await session.refresh(task)
    return task
