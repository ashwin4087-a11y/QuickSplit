"""QuickSplit FastAPI application entry point."""

from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

app.include_router(auth_router)


@app.get("/")
def root() -> dict[str, str]:
    """Return basic application metadata."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health() -> dict[str, str]:
    """Return application health status."""
    return {"status": "healthy"}
