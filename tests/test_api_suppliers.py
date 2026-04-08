import pytest


@pytest.mark.asyncio
async def test_create_supplier(client):
    resp = await client.post("/api/suppliers/", json={"name": "עוף הגליל", "contact_info": "054-1234567"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "עוף הגליל"


@pytest.mark.asyncio
async def test_list_suppliers(client):
    await client.post("/api/suppliers/", json={"name": "A"})
    await client.post("/api/suppliers/", json={"name": "B"})
    resp = await client.get("/api/suppliers/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_update_supplier(client):
    create_resp = await client.post("/api/suppliers/", json={"name": "Old"})
    sid = create_resp.json()["id"]
    update_resp = await client.patch(f"/api/suppliers/{sid}", json={"name": "New"})
    assert update_resp.json()["name"] == "New"
