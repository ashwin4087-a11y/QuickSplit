from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.group import (
    create_group as crud_create_group,
    add_group_member as crud_add_group_member,
    get_group_by_id_for_member as crud_get_group_by_id_for_member,
    list_groups_for_user as crud_list_groups_for_user,
)
from app.models.group import Group
from app.models.user import User
from app.schemas.group import GroupCreate


def create_group(db: Session, current_user: User, group_in: GroupCreate) -> Group:
    try:
        group = crud_create_group(db, name=group_in.name, description=group_in.description, owner_id=current_user.id)
        crud_add_group_member(db, group_id=group.id, user_id=current_user.id)
        db.commit()
        db.refresh(group)
        return group
    except Exception:
        db.rollback()
        raise


def get_group(db: Session, current_user: User, group_id: int) -> Group:
    group = crud_get_group_by_id_for_member(db, group_id, current_user.id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    return group


def list_groups(db: Session, current_user: User) -> List[Group]:
    return crud_list_groups_for_user(db, current_user.id)
