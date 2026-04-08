import pytest
import pytest_asyncio
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


@pytest_asyncio.fixture
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
