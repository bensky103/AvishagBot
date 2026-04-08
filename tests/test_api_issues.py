import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def supplier_id(client):
    resp = await client.post("/api/suppliers/", json={"name": "Test Supplier"})
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_issue(client, supplier_id):
    resp = await client.post("/api/issues/", json={
        "supplier_id": supplier_id,
        "product_name": "Chicken",
        "arrival_date": "2026-04-07",
        "problem_description": "Broken boxes",
    })
    assert resp.status_code == 201
    assert resp.json()["status"] == "open"


@pytest.mark.asyncio
async def test_list_issues_filter_by_supplier(client, supplier_id):
    await client.post("/api/issues/", json={
        "supplier_id": supplier_id, "product_name": "A",
        "arrival_date": "2026-04-07", "problem_description": "X",
    })
    resp = await client.get(f"/api/issues/?supplier_id={supplier_id}")
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_resolve_issue(client, supplier_id):
    create_resp = await client.post("/api/issues/", json={
        "supplier_id": supplier_id, "product_name": "A",
        "arrival_date": "2026-04-07", "problem_description": "X",
    })
    issue_id = create_resp.json()["id"]
    resolve_resp = await client.post(f"/api/issues/{issue_id}/resolve")
    assert resolve_resp.json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_add_action_item_with_task_sync(client, supplier_id):
    issue_resp = await client.post("/api/issues/", json={
        "supplier_id": supplier_id, "product_name": "A",
        "arrival_date": "2026-04-07", "problem_description": "X",
    })
    issue_id = issue_resp.json()["id"]

    action_resp = await client.post(f"/api/issues/{issue_id}/action-items", json={
        "description": "Call supplier", "create_task": True,
    })
    assert action_resp.status_code == 201
    assert action_resp.json()["task_id"] is not None

    tasks_resp = await client.get("/api/tasks/")
    assert len(tasks_resp.json()) == 1
    assert tasks_resp.json()[0]["title"] == "Call supplier"
