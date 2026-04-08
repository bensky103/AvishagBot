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
