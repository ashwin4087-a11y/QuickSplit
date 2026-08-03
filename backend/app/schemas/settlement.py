from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SettlementCreate(BaseModel):
    """Request schema for creating a settlement payment."""
    payer_id: int
    receiver_id: int
    amount: Decimal = Field(gt=0, examples=["500.00"])


class SettlementResponse(BaseModel):
    """Response schema for settlement payment records."""
    id: int
    group_id: int
    payer_id: int
    receiver_id: int
    amount: Decimal
    status: str
    created_at: datetime
    settled_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
