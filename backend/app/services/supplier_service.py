from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supplier import Supplier


async def create_supplier(
    session: AsyncSession,
    name: str,
    contact_info: Optional[str] = None,
    notes: Optional[str] = None,
) -> Supplier:
    supplier = Supplier(name=name, contact_info=contact_info, notes=notes)
    session.add(supplier)
    await session.commit()
    await session.refresh(supplier)
    return supplier


async def get_supplier(session: AsyncSession, supplier_id: int) -> Optional[Supplier]:
    return await session.get(Supplier, supplier_id)


async def list_suppliers(session: AsyncSession) -> list[Supplier]:
    result = await session.execute(select(Supplier).order_by(Supplier.name))
    return list(result.scalars().all())


async def update_supplier(
    session: AsyncSession,
    supplier_id: int,
    name: Optional[str] = None,
    contact_info: Optional[str] = None,
    notes: Optional[str] = None,
) -> Supplier:
    supplier = await session.get(Supplier, supplier_id)
    if name is not None:
        supplier.name = name
    if contact_info is not None:
        supplier.contact_info = contact_info
    if notes is not None:
        supplier.notes = notes
    await session.commit()
    await session.refresh(supplier)
    return supplier
