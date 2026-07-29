from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.crud.user import get_user_by_id

settings = get_settings()

pwd_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Hash a plain-text password with the recommended Argon2 hasher."""

    return pwd_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plain-text password against a stored password hash."""

    return pwd_hasher.verify(password, password_hash)


def create_access_token(subject: str) -> str:
    """Create a JWT access token for a given subject."""
    expiry = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "exp": expiry,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_access_token(token: str) -> dict[str, Any]:
    """Verify a JWT and return its payload."""

    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


_bearer_scheme = HTTPBearer(auto_error=False)


def _unauthenticated(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that returns the authenticated User.

    Raises 401 for missing/invalid/expired tokens and when the user is not found.
    """

    if credentials is None or not credentials.credentials:
        raise _unauthenticated()

    token = credentials.credentials
    try:
        payload = verify_access_token(token)
    except jwt.ExpiredSignatureError:
        raise _unauthenticated()
    except jwt.InvalidTokenError:
        raise _unauthenticated()

    sub = payload.get("sub")
    if sub is None:
        raise _unauthenticated()

    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise _unauthenticated()

    user = get_user_by_id(db, user_id)
    if user is None:
        raise _unauthenticated()

    return user
