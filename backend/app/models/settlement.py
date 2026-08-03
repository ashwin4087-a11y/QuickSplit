from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Settlement(Base):
    """SQLAlchemy ORM model for settlement payments between group members."""

    __tablename__ = "settlements"
    __table_args__ = (
        Index("ix_settlements_group_id", "group_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    payer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    settled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    group = relationship("Group", back_populates="settlements", lazy="joined")
    payer = relationship("User", foreign_keys=[payer_id], back_populates="settlements_paid", lazy="joined")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="settlements_received", lazy="joined")
