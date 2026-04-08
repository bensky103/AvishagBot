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
