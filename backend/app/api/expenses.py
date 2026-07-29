from typing import List, Tuple

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.services.expense import (
    create_expense as svc_create_expense,
    list_expenses as svc_list_expenses,
    get_expense as svc_get_expense,
    update_expense as svc_update_expense,
    delete_expense as svc_delete_expense,
)

router = APIRouter(prefix="/groups/{group_id}/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    group_id: int,
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = svc_create_expense(db, current_user, group_id, expense_in)
    return expense


@router.get("", response_model=List[ExpenseResponse], status_code=status.HTTP_200_OK)
def list_expenses(
    group_id: int,
    offset: int = 0,
    limit: int = 100,
    include_total: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = svc_list_expenses(db, current_user, group_id, offset=offset, limit=limit, include_total=include_total)
    if include_total:
        items, total = result
        # return items only; frontend can fetch total via separate endpoint later
        # For now, we return items. If desired, alter response model to include total.
        return items
    return result


@router.get("/{expense_id}", response_model=ExpenseResponse, status_code=status.HTTP_200_OK)
def get_expense(
    group_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = svc_get_expense(db, current_user, group_id, expense_id)
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse, status_code=status.HTTP_200_OK)
def update_expense(
    group_id: int,
    expense_id: int,
    expense_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = svc_update_expense(db, current_user, group_id, expense_id, expense_in)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    group_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc_delete_expense(db, current_user, group_id, expense_id)
