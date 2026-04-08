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
    return await get_issue_report(session, issue.id)


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
    return await get_issue_report(session, issue_id)


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
