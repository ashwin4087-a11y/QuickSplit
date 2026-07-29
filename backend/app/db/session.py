"""SQLAlchemy engine and database session management."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session as DBSession
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=DBSession,
    autocommit=False,
    autoflush=False,
    future=True,
)


def get_db() -> Generator[DBSession, None, None]:
    """Yield a database session and close it after request processing."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
