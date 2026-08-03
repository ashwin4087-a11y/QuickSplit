from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class SettlementSuggestionResponse(BaseModel):
    from_user_id: int
    from_user_name: str
    to_user_id: int
    to_user_name: str
    amount: Decimal = Field(gt=Decimal("0.00"))

    model_config = ConfigDict(from_attributes=True)
