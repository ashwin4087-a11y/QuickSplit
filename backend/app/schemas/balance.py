from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBalanceResponse(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    paid: Decimal
    owed: Decimal
    balance: Decimal

    model_config = ConfigDict(from_attributes=True)
