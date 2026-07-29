from pydantic import BaseModel, ConfigDict, EmailStr


class MemberAdd(BaseModel):
    email: EmailStr


class MemberResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)
