from decimal import Decimal
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    amount: Decimal = Field(gt=0)
    paid_by: int


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    amount: Optional[Decimal] = Field(gt=0)
    paid_by: Optional[int]


class ExpenseResponse(BaseModel):
    id: int
    group_id: int
    title: str
    description: Optional[str]
    amount: Decimal
    paid_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
