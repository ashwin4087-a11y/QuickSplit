from typing import List, Tuple

from sqlalchemy import delete, select, func
from sqlalchemy.orm import Session

from app.models.expense import Expense


def create_expense(db: Session, *, group_id: int, title: str, description: str | None, amount, paid_by: int) -> Expense:
    expense = Expense(group_id=group_id, title=title, description=description, amount=amount, paid_by=paid_by)
    db.add(expense)
    db.flush()
    return expense


def get_expense_by_id(db: Session, expense_id: int) -> Expense | None:
    stmt = select(Expense).where(Expense.id == expense_id)
    return db.scalar(stmt)


def get_group_expense(db: Session, group_id: int, expense_id: int) -> Expense | None:
    stmt = select(Expense).where(Expense.id == expense_id).where(Expense.group_id == group_id)
    return db.scalar(stmt)


def list_expenses_for_group(db: Session, group_id: int, offset: int = 0, limit: int = 100) -> List[Expense]:
    stmt = (
        select(Expense)
        .where(Expense.group_id == group_id)
        .order_by(Expense.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(stmt).all()


def count_expenses_for_group(db: Session, group_id: int) -> int:
    stmt = select(func.count()).select_from(Expense).where(Expense.group_id == group_id)
    return int(db.scalar(stmt) or 0)


def update_expense(db: Session, expense: Expense, changes: dict) -> Expense:
    allowed = {"title", "description", "amount", "paid_by"}
    for key, value in changes.items():
        if key in allowed:
            setattr(expense, key, value)
    db.flush()
    return expense


def delete_expense(db: Session, expense_id: int) -> None:
    stmt = delete(Expense).where(Expense.id == expense_id)
    db.execute(stmt)
