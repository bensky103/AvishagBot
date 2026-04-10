from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IssueReport(Base):
    __tablename__ = "issue_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"))
    product_name: Mapped[str] = mapped_column(String(255))
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    arrival_date: Mapped[date] = mapped_column(Date)
    problem_description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("open", "in_progress", "resolved", name="issue_status_enum"),
        default="open",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    supplier: Mapped["Supplier"] = relationship(back_populates="issue_reports")
    action_items: Mapped[list["ActionItem"]] = relationship(back_populates="issue_report")
