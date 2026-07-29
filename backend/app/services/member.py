from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.group import get_group_by_id_for_member
from app.crud.member import (
    add_group_member as crud_add_group_member,
    get_group_member as crud_get_group_member,
    list_group_members as crud_list_group_members,
    remove_group_member as crud_remove_group_member,
)
from app.crud.user import get_user_by_email
from app.models.group import Group
from app.models.user import User
from app.schemas.member import MemberAdd


def add_member(db: Session, current_user: User, group_id: int, member_in: MemberAdd) -> User:
    group = get_group_by_id_for_member(db, group_id, current_user.id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    if group.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group owner can add members")

    user = get_user_by_email(db, member_in.email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Owner is already a member")

    if crud_get_group_member(db, group_id, user.id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")

    try:
        crud_add_group_member(db, group_id=group_id, user_id=user.id)
        db.commit()
        return user
    except Exception:
        db.rollback()
        raise


def list_members(db: Session, current_user: User, group_id: int) -> List[User]:
    group = get_group_by_id_for_member(db, group_id, current_user.id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    return crud_list_group_members(db, group_id)


def remove_member(db: Session, current_user: User, group_id: int, user_id: int) -> None:
    group = get_group_by_id_for_member(db, group_id, current_user.id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    if group.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group owner can remove members")

    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot remove themselves")

    if crud_get_group_member(db, group_id, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    try:
        crud_remove_group_member(db, group_id, user_id)
        db.commit()
    except Exception:
        db.rollback()
        raise
