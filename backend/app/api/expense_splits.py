from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.expense_split import ExpenseSplitCreateRequest, ExpenseSplitResponse
from app.services.expense_split import (
    create_expense_splits as svc_create_expense_splits,
    delete_expense_splits_service as svc_delete_expense_splits,
    list_expense_splits_service as svc_list_expense_splits,
    update_expense_splits as svc_update_expense_splits,
)

router = APIRouter(prefix="/expenses/{expense_id}/splits", tags=["expense_splits"])


@router.post("", response_model=List[ExpenseSplitResponse], status_code=status.HTTP_201_CREATED)
def create_expense_splits(
    expense_id: int,
    splits_in: ExpenseSplitCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc_create_expense_splits(db, current_user, expense_id, splits_in)


@router.get("", response_model=List[ExpenseSplitResponse], status_code=status.HTTP_200_OK)
def list_expense_splits(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc_list_expense_splits(db, current_user, expense_id)


@router.put("", response_model=List[ExpenseSplitResponse], status_code=status.HTTP_200_OK)
def update_expense_splits(
    expense_id: int,
    splits_in: ExpenseSplitCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc_update_expense_splits(db, current_user, expense_id, splits_in)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_splits(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc_delete_expense_splits(db, current_user, expense_id)
