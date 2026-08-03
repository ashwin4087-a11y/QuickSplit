from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.settlement import Settlement


def create_settlement(
    db: Session, *, group_id: int, payer_id: int, receiver_id: int, amount: Decimal
) -> Settlement:
    settlement = Settlement(
        group_id=group_id,
        payer_id=payer_id,
        receiver_id=receiver_id,
        amount=amount,
        status="PENDING",
    )
    db.add(settlement)
    db.flush()
    return settlement


def get_settlement_by_id(db: Session, settlement_id: int) -> Settlement | None:
    stmt = select(Settlement).where(Settlement.id == settlement_id)
    return db.scalar(stmt)


def list_settlements_for_group(db: Session, group_id: int) -> List[Settlement]:
    stmt = (
        select(Settlement)
        .where(Settlement.group_id == group_id)
        .order_by(Settlement.created_at.desc())
    )
    return db.scalars(stmt).all()


def update_settlement_status(
    db: Session, settlement: Settlement, *, status: str, settled_at: Optional[datetime] = None
) -> Settlement:
    settlement.status = status
    if settled_at is not None:
        settlement.settled_at = settled_at
    db.flush()
    return settlement
