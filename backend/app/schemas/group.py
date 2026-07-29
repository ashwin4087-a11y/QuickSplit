from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GroupCreate(BaseModel):
    """Request schema for creating a group.

    The request must not include `owner_id` or any membership fields.
    """

    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None


class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
