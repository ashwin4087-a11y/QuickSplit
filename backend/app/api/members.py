from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.member import MemberAdd, MemberResponse
from app.services.member import add_member as svc_add_member, list_members as svc_list_members, remove_member as svc_remove_member

router = APIRouter(prefix="/groups/{group_id}/members", tags=["members"])


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(
    group_id: int,
    member_in: MemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemberResponse:
    user = svc_add_member(db, current_user, group_id, member_in)
    return MemberResponse.model_validate(user)


@router.get("", response_model=List[MemberResponse], status_code=status.HTTP_200_OK)
def list_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[MemberResponse]:
    users = svc_list_members(db, current_user, group_id)
    return [MemberResponse.model_validate(user) for user in users]


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    svc_remove_member(db, current_user, group_id, user_id)
