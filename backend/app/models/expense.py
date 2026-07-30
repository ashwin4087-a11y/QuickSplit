from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class Expense(Base, TimestampMixin):
    """SQLAlchemy ORM model for group expenses."""

    __tablename__ = "expenses"
    __table_args__ = (
        Index("ix_expenses_group_id", "group_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    paid_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    payer = relationship("User", back_populates="expenses_paid", lazy="joined")
    group = relationship("Group", back_populates="expenses", lazy="joined")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")
