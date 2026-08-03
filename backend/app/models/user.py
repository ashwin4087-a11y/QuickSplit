from typing import List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class User(Base, TimestampMixin, SoftDeleteMixin):
    """SQLAlchemy ORM model for application users."""

    __tablename__ = "users"

    # Primary key integer column for the User table.
    id: Mapped[int] = mapped_column(primary_key=True)

    # User's full name, required and limited to 100 characters.
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # User's email address, required, unique, and indexed for faster lookups.
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Hashed password string, required for authentication storage.
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    owned_groups: Mapped[List["Group"]] = relationship("Group", back_populates="owner", cascade="all, delete-orphan")
    memberships: Mapped[List["GroupMember"]] = relationship("GroupMember", back_populates="user", cascade="all, delete-orphan")
    expenses_paid: Mapped[List["Expense"]] = relationship("Expense", back_populates="payer", cascade="all, delete-orphan")
    expense_splits: Mapped[List["ExpenseSplit"]] = relationship("ExpenseSplit", back_populates="user", cascade="all, delete-orphan")
    settlements_paid: Mapped[List["Settlement"]] = relationship("Settlement", foreign_keys="[Settlement.payer_id]", back_populates="payer", cascade="all, delete-orphan")
    settlements_received: Mapped[List["Settlement"]] = relationship("Settlement", foreign_keys="[Settlement.receiver_id]", back_populates="receiver", cascade="all, delete-orphan")
