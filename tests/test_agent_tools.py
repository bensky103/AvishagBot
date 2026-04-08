import pytest
import pytest_asyncio
from datetime import date

from app.services.supplier_service import create_supplier
from app.agent.tools import get_agent_tools


@pytest_asyncio.fixture
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
