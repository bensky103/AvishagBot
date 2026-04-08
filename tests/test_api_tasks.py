import pytest


@pytest.mark.asyncio
async def test_create_task(client):
    resp = await client.post("/api/tasks/", json={"title": "Test task", "urgency": "high"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test task"
    assert data["urgency"] == "high"
    assert data["is_completed"] is False


@pytest.mark.asyncio
async def test_list_tasks(client):
    await client.post("/api/tasks/", json={"title": "Task 1"})
    await client.post("/api/tasks/", json={"title": "Task 2"})
    resp = await client.get("/api/tasks/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_task_not_found(client):
    resp = await client.get("/api/tasks/9999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_complete_and_reopen_task(client):
    create_resp = await client.post("/api/tasks/", json={"title": "Do it"})
    task_id = create_resp.json()["id"]

    complete_resp = await client.post(f"/api/tasks/{task_id}/complete")
    assert complete_resp.json()["is_completed"] is True

    reopen_resp = await client.post(f"/api/tasks/{task_id}/reopen")
    assert reopen_resp.json()["is_completed"] is False
