from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.settlement_suggestion import SettlementSuggestionResponse
from app.services.settlement_suggestion import compute_group_settlements

router = APIRouter(prefix="/groups/{group_id}/settlements", tags=["settlements"])


@router.get("/suggestions", response_model=List[SettlementSuggestionResponse], status_code=status.HTTP_200_OK)
def get_settlement_suggestions(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_group_settlements(db, current_user, group_id)
