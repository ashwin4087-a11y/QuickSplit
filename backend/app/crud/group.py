from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.group import Group, GroupMember


def create_group(db: Session, *, name: str, description: str | None, owner_id: int) -> Group:
    group = Group(name=name, description=description, owner_id=owner_id)
    db.add(group)
    db.flush()
    return group


def add_group_member(db: Session, *, group_id: int, user_id: int) -> GroupMember:
    membership = GroupMember(group_id=group_id, user_id=user_id)
    db.add(membership)
    db.flush()
    return membership


def get_group_by_id(db: Session, group_id: int) -> Group | None:
    stmt = select(Group).where(Group.id == group_id)
    return db.scalar(stmt)


def get_group_by_id_for_member(db: Session, group_id: int, user_id: int) -> Group | None:
    stmt = (
        select(Group)
        .join(Group.members)
        .where(Group.id == group_id)
        .where(GroupMember.user_id == user_id)
    )
    return db.scalar(stmt)


def list_groups_for_user(db: Session, user_id: int) -> List[Group]:
    stmt = (
        select(Group)
        .join(Group.members)
        .where(GroupMember.user_id == user_id)
    )
    return db.scalars(stmt).all()
