from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ExpenseSplitCreate(BaseModel):
    user_id: int
    amount_owed: Decimal = Field(gt=0)


class ExpenseSplitCreateRequest(BaseModel):
    splits: List[ExpenseSplitCreate]


class ExpenseSplitResponse(BaseModel):
    id: int
    expense_id: int
    user_id: int
    amount_owed: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
