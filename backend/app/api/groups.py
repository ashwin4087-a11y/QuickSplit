from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.group import GroupCreate, GroupResponse
from app.services.group import create_group as svc_create_group, list_groups as svc_list_groups, get_group as svc_get_group

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_in: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = svc_create_group(db, current_user, group_in)
    return group


@router.get("/", response_model=List[GroupResponse], status_code=status.HTTP_200_OK)
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    groups = svc_list_groups(db, current_user)
    return groups


@router.get("/{group_id}", response_model=GroupResponse, status_code=status.HTTP_200_OK)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = svc_get_group(db, current_user, group_id)
    return group
