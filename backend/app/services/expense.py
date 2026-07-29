from decimal import Decimal
from typing import List, Tuple
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.expense import (
    create_expense as crud_create_expense,
    get_group_expense as crud_get_group_expense,
    list_expenses_for_group as crud_list_expenses_for_group,
    count_expenses_for_group as crud_count_expenses_for_group,
    update_expense as crud_update_expense,
    delete_expense as crud_delete_expense,
)
from app.crud.group import get_group_by_id_for_member, get_group_by_id
from app.crud.member import get_group_member
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate

logger = logging.getLogger(__name__)


def _ensure_group_and_membership(db: Session, group_id: int, user_id: int):
    # Distinguish between missing group (404) and unauthorized membership (403)
    group = get_group_by_id(db, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    member_check = get_group_by_id_for_member(db, group_id, user_id)
    if member_check is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the group")

    return group


def create_expense(db: Session, current_user: User, group_id: int, expense_in: ExpenseCreate) -> Expense:
    # Ensure current_user is a member
    _ensure_group_and_membership(db, group_id, current_user.id)

    # Validate payer is a member
    payer_member = get_group_member(db, group_id, expense_in.paid_by)
    if payer_member is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payer must be a member of the group")

    if expense_in.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than 0")

    try:
        expense = crud_create_expense(
            db,
            group_id=group_id,
            title=expense_in.title,
            description=expense_in.description,
            amount=expense_in.amount,
            paid_by=expense_in.paid_by,
        )
        db.commit()
        db.refresh(expense)
        logger.info("Expense created: %s by user %s", expense.id, current_user.id)
        return expense
    except Exception:
        db.rollback()
        raise


def list_expenses(db: Session, current_user: User, group_id: int, offset: int = 0, limit: int = 100, include_total: bool = False) -> List[Expense] | Tuple[List[Expense], int]:
    _ensure_group_and_membership(db, group_id, current_user.id)
    items = crud_list_expenses_for_group(db, group_id, offset=offset, limit=limit)
    if include_total:
        total = crud_count_expenses_for_group(db, group_id)
        return items, total
    return items


def get_expense(db: Session, current_user: User, group_id: int, expense_id: int) -> Expense:
    _ensure_group_and_membership(db, group_id, current_user.id)
    expense = crud_get_group_expense(db, group_id, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


def update_expense(db: Session, current_user: User, group_id: int, expense_id: int, expense_in: ExpenseUpdate) -> Expense:
    _ensure_group_and_membership(db, group_id, current_user.id)
    expense = crud_get_group_expense(db, group_id, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    # If paid_by provided, ensure payer is member
    if expense_in.paid_by is not None:
        if get_group_member(db, group_id, expense_in.paid_by) is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payer must be a member of the group")

    if expense_in.amount is not None and expense_in.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than 0")

    changes = {k: v for k, v in expense_in.model_dump().items() if v is not None}

    try:
        updated = crud_update_expense(db, expense, changes)
        db.commit()
        db.refresh(updated)
        logger.info("Expense updated: %s by user %s", updated.id, current_user.id)
        return updated
    except Exception:
        db.rollback()
        raise


def delete_expense(db: Session, current_user: User, group_id: int, expense_id: int) -> None:
    _ensure_group_and_membership(db, group_id, current_user.id)
    expense = crud_get_group_expense(db, group_id, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    try:
        crud_delete_expense(db, expense_id)
        db.commit()
        logger.info("Expense deleted: %s by user %s", expense_id, current_user.id)
    except Exception:
        db.rollback()
        raise
