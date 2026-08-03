from datetime import datetime
from decimal import Decimal
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class SettlementItem(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: Decimal = Field(gt=0)


class SettlementResponse(BaseModel):
    settlements: List[SettlementItem]

    model_config = ConfigDict(from_attributes=True)
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SettlementCreate(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: Decimal = Field(gt=0)


class SettlementResponse(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: Decimal
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
