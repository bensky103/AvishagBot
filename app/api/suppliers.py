from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.services import supplier_service

router = APIRouter()


@router.post("/", response_model=SupplierResponse, status_code=201)
async def create_supplier(data: SupplierCreate, session: AsyncSession = Depends(get_session)):
    return await supplier_service.create_supplier(
        session, name=data.name, contact_info=data.contact_info, notes=data.notes,
    )


@router.get("/", response_model=list[SupplierResponse])
async def list_suppliers(session: AsyncSession = Depends(get_session)):
    return await supplier_service.list_suppliers(session)


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, session: AsyncSession = Depends(get_session)):
    supplier = await supplier_service.get_supplier(session, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.patch("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int, data: SupplierUpdate, session: AsyncSession = Depends(get_session),
):
    supplier = await supplier_service.get_supplier(session, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return await supplier_service.update_supplier(
        session, supplier_id, name=data.name, contact_info=data.contact_info, notes=data.notes,
    )
