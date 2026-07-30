from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class ExpenseSplit(Base, TimestampMixin):
    """Represents the portion of an expense owed by a specific user."""

    __tablename__ = "expense_splits"
    __table_args__ = (
        Index("ix_expense_splits_expense_id", "expense_id"),
        UniqueConstraint("expense_id", "user_id", name="uq_expense_splits_expense_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    expense_id: Mapped[int] = mapped_column(ForeignKey("expenses.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount_owed: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    expense = relationship("Expense", back_populates="splits", lazy="joined")
    user = relationship("User", lazy="joined")
