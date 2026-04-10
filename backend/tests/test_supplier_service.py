import pytest

from app.services.supplier_service import (
    create_supplier,
    get_supplier,
    list_suppliers,
    update_supplier,
)


@pytest.mark.asyncio
async def test_create_supplier(db_session):
    supplier = await create_supplier(db_session, name="עוף הגליל", contact_info="054-1234567")
    assert supplier.id is not None
    assert supplier.name == "עוף הגליל"


@pytest.mark.asyncio
async def test_get_supplier(db_session):
    supplier = await create_supplier(db_session, name="Test")
    found = await get_supplier(db_session, supplier.id)
    assert found.name == "Test"


@pytest.mark.asyncio
async def test_get_supplier_not_found(db_session):
    found = await get_supplier(db_session, 9999)
    assert found is None


@pytest.mark.asyncio
async def test_list_suppliers(db_session):
    await create_supplier(db_session, name="Supplier A")
    await create_supplier(db_session, name="Supplier B")
    suppliers = await list_suppliers(db_session)
    assert len(suppliers) == 2


@pytest.mark.asyncio
async def test_update_supplier(db_session):
    supplier = await create_supplier(db_session, name="Old Name")
    updated = await update_supplier(db_session, supplier.id, name="New Name")
    assert updated.name == "New Name"
