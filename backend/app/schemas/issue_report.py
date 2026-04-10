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
