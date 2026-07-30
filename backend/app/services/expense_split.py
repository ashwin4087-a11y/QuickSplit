from decimal import Decimal
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.expense import get_expense_by_id
from app.crud.expense_split import create_expense_split, delete_expense_splits, list_expense_splits
from app.crud.group import get_group_by_id_for_member
from app.crud.member import get_group_member
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense_split import ExpenseSplitCreateRequest, ExpenseSplitResponse


def _ensure_expense_exists(db: Session, expense_id: int) -> Expense:
    expense = get_expense_by_id(db, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


def _validate_splits(db: Session, group_id: int, splits_in: ExpenseSplitCreateRequest) -> None:
    if not splits_in.splits:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one split is required")

    seen_user_ids = set()
    total_amount = Decimal("0")

    for split in splits_in.splits:
        if split.amount_owed <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Each amount owed must be greater than 0")

        if split.user_id in seen_user_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate users are not allowed")
        seen_user_ids.add(split.user_id)

        membership = get_group_member(db, group_id, split.user_id)
        if membership is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Each user must belong to the group")

        total_amount += split.amount_owed

    if total_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Total split amount must be greater than 0")


def _validate_split_total(expense: Expense, splits_in: ExpenseSplitCreateRequest) -> None:
    total_amount = sum((split.amount_owed for split in splits_in.splits), Decimal("0"))
    if total_amount != expense.amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Total split amount must equal the expense amount")


def create_expense_splits(db: Session, current_user: User, expense_id: int, splits_in: ExpenseSplitCreateRequest) -> List[ExpenseSplitResponse]:
    expense = _ensure_expense_exists(db, expense_id)

    if not get_group_by_id_for_member(db, expense.group_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the group")

    _validate_splits(db, expense.group_id, splits_in)
    _validate_split_total(expense, splits_in)

    try:
        delete_expense_splits(db, expense_id)
        created_splits = []
        for split in splits_in.splits:
            created_splits.append(create_expense_split(db, expense_id=expense_id, user_id=split.user_id, amount_owed=split.amount_owed))
        db.commit()
        return [ExpenseSplitResponse.model_validate(split) for split in created_splits]
    except Exception:
        db.rollback()
        raise


def update_expense_splits(db: Session, current_user: User, expense_id: int, splits_in: ExpenseSplitCreateRequest) -> List[ExpenseSplitResponse]:
    return create_expense_splits(db, current_user, expense_id, splits_in)


def delete_expense_splits_service(db: Session, current_user: User, expense_id: int) -> None:
    expense = _ensure_expense_exists(db, expense_id)
    if not get_group_by_id_for_member(db, expense.group_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the group")

    try:
        delete_expense_splits(db, expense_id)
        db.commit()
    except Exception:
        db.rollback()
        raise


def list_expense_splits_service(db: Session, current_user: User, expense_id: int) -> List[ExpenseSplitResponse]:
    expense = _ensure_expense_exists(db, expense_id)
    if not get_group_by_id_for_member(db, expense.group_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the group")

    splits = list_expense_splits(db, expense_id)
    return [ExpenseSplitResponse.model_validate(split) for split in splits]
