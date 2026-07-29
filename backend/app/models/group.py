from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class Group(Base, TimestampMixin):
    """SQLAlchemy ORM model for groups."""

    __tablename__ = "groups"
    __table_args__ = (
        Index("ix_groups_owner_id", "owner_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="owned_groups", lazy="joined")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    """Association table for users belonging to groups."""

    __tablename__ = "group_members"
    __table_args__ = (
        Index("ix_group_members_user_id", "user_id"),
    )

    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="memberships", lazy="joined")
    group = relationship("Group", back_populates="members")
