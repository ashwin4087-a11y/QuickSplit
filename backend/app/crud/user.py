from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    """Return a user by email if one exists."""

    statement = select(User).where(User.email == email)
    return db.scalar(statement)


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Return a user by id if one exists."""

    statement = select(User).where(User.id == user_id)
    return db.scalar(statement)


def create_user(db: Session, *, full_name: str, email: str, password_hash: str) -> User:
    """Persist a new user with a prepared password hash."""

    user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
