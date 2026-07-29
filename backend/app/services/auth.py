from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.crud.user import create_user, get_user_by_email
from app.models.user import User
from app.schemas.user import UserCreate


def register_user(db: Session, user_in: UserCreate) -> User:
    """Register a new user."""

    if get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    return create_user(
        db=db,
        full_name=user_in.full_name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
    )


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    """Authenticate a user by verifying their credentials."""

    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def login_user(db: Session, email: str, password: str) -> str:
    """Authenticate credentials and return a JWT access token."""

    user = authenticate_user(db, email, password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return create_access_token(subject=str(user.id))
