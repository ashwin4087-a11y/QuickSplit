from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

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
