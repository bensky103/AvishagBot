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
