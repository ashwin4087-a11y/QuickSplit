from typing import List

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.group import GroupMember
from app.models.user import User


def get_group_member(db: Session, group_id: int, user_id: int) -> GroupMember | None:
    stmt = (
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .where(GroupMember.user_id == user_id)
    )
    return db.scalar(stmt)


def list_group_members(db: Session, group_id: int) -> List[User]:
    stmt = (
        select(User)
        .join(GroupMember, GroupMember.user_id == User.id)
        .where(GroupMember.group_id == group_id)
    )
    return db.scalars(stmt).all()


def add_group_member(db: Session, *, group_id: int, user_id: int) -> GroupMember:
    membership = GroupMember(group_id=group_id, user_id=user_id)
    db.add(membership)
    db.flush()
    return membership


def remove_group_member(db: Session, group_id: int, user_id: int) -> None:
    stmt = (
        delete(GroupMember)
        .where(GroupMember.group_id == group_id)
        .where(GroupMember.user_id == user_id)
    )
    db.execute(stmt)
