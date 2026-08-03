from datetime import datetime, timezone
from decimal import Decimal
from typing import List
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.member import get_group_member
from app.crud.settlement import (
    create_settlement as crud_create_settlement,
    get_settlement_by_id as crud_get_settlement_by_id,
    list_settlements_for_group as crud_list_settlements_for_group,
    update_settlement_status as crud_update_settlement_status,
)
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.settlement import SettlementCreate
from app.services.balance import _ensure_group_and_membership

logger = logging.getLogger(__name__)


def create_settlement(
    db: Session, current_user: User, group_id: int, settlement_in: SettlementCreate
) -> Settlement:
    # Ensure current user is authorized to access the group
    _ensure_group_and_membership(db, group_id, current_user.id)

    # Validate payer != receiver
    if settlement_in.payer_id == settlement_in.receiver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payer and receiver must be different users",
        )

    # Validate amount > 0
    if settlement_in.amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0",
        )

    # Validate payer is a group member
    if get_group_member(db, group_id, settlement_in.payer_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payer is not a member of the group",
        )

    # Validate receiver is a group member
    if get_group_member(db, group_id, settlement_in.receiver_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receiver is not a member of the group",
        )

    try:
        settlement = crud_create_settlement(
            db,
            group_id=group_id,
            payer_id=settlement_in.payer_id,
            receiver_id=settlement_in.receiver_id,
            amount=settlement_in.amount,
        )
        db.commit()
        db.refresh(settlement)
        logger.info("Settlement created: %s by user %s", settlement.id, current_user.id)
        return settlement
    except Exception:
        db.rollback()
        raise


def list_settlements(
    db: Session, current_user: User, group_id: int
) -> List[Settlement]:
    _ensure_group_and_membership(db, group_id, current_user.id)
    return crud_list_settlements_for_group(db, group_id)


def complete_settlement(
    db: Session, current_user: User, settlement_id: int
) -> Settlement:
    settlement = crud_get_settlement_by_id(db, settlement_id)
    if settlement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settlement not found",
        )

    # Ensure current user is a member of the settlement's group
    _ensure_group_and_membership(db, settlement.group_id, current_user.id)

    # Cannot complete an already-completed settlement
    if settlement.status == "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Settlement is already completed",
        )

    try:
        updated = crud_update_settlement_status(
            db,
            settlement,
            status="COMPLETED",
            settled_at=datetime.now(timezone.utc),
        )
        db.commit()
        db.refresh(updated)
        logger.info("Settlement completed: %s by user %s", updated.id, current_user.id)
        return updated
    except Exception:
        db.rollback()
        raise
