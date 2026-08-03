"""QuickSplit FastAPI application entry point."""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.auth import router as auth_router
from app.api.groups import router as groups_router
from app.api.members import router as members_router
from app.api.expenses import router as expenses_router
from app.api.expense_splits import router as expense_splits_router
from app.api.balances import router as balances_router
from app.api.settlements import router as settlements_router
from app.api.settlements import settlement_payments_router
from app.core.config import get_settings
from app.db.session import get_db

settings = get_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup: QuickSplit backend is starting up.")
    yield
    logger.info("Application shutdown: QuickSplit backend is shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} {response.status_code} {process_time:.2f}ms"
    )
    return response


app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(members_router)
app.include_router(expenses_router)
app.include_router(expense_splits_router)
app.include_router(balances_router)
app.include_router(settlements_router)
app.include_router(settlement_payments_router)


@app.get("/")
def root() -> dict[str, str]:
    """Return basic application metadata."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    """Return application health status."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected"}
