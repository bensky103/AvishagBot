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
