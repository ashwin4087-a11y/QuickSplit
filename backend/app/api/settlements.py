from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.settlement import SettlementCreate, SettlementResponse
from app.schemas.settlement_suggestion import SettlementSuggestionResponse
from app.services.settlement import (
    create_settlement as svc_create_settlement,
    list_settlements as svc_list_settlements,
    complete_settlement as svc_complete_settlement,
)
from app.services.settlement_suggestion import compute_group_settlements

router = APIRouter(prefix="/groups/{group_id}/settlements", tags=["settlements"])


@router.get("/suggestions", response_model=List[SettlementSuggestionResponse], status_code=status.HTTP_200_OK)
def get_settlement_suggestions(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_group_settlements(db, current_user, group_id)


@router.post("", response_model=SettlementResponse, status_code=status.HTTP_201_CREATED)
def create_settlement(
    group_id: int,
    settlement_in: SettlementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc_create_settlement(db, current_user, group_id, settlement_in)


@router.get("", response_model=List[SettlementResponse], status_code=status.HTTP_200_OK)
def list_settlements(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc_list_settlements(db, current_user, group_id)


# Separate router for settlement-level actions (not group-scoped)
settlement_payments_router = APIRouter(prefix="/settlements", tags=["settlements"])


@settlement_payments_router.patch("/{settlement_id}/complete", response_model=SettlementResponse, status_code=status.HTTP_200_OK)
def complete_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc_complete_settlement(db, current_user, settlement_id)
