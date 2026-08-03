from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.balance import UserBalanceResponse
from app.services.balance import compute_group_balances

router = APIRouter(prefix="/groups/{group_id}/balances", tags=["balances"])


@router.get("", response_model=List[UserBalanceResponse], status_code=status.HTTP_200_OK)
def get_group_balances(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_group_balances(db, current_user, group_id)
