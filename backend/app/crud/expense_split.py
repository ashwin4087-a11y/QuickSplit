from decimal import Decimal
from typing import List

from sqlalchemy import delete, select, func
from sqlalchemy.orm import Session

from app.models.expense_split import ExpenseSplit


def create_expense_split(db: Session, *, expense_id: int, user_id: int, amount_owed: Decimal) -> ExpenseSplit:
    split = ExpenseSplit(expense_id=expense_id, user_id=user_id, amount_owed=amount_owed)
    db.add(split)
    db.flush()
    return split


def list_expense_splits(db: Session, expense_id: int) -> List[ExpenseSplit]:
    stmt = select(ExpenseSplit).where(ExpenseSplit.expense_id == expense_id).order_by(ExpenseSplit.created_at.asc())
    return db.scalars(stmt).all()


def delete_expense_splits(db: Session, expense_id: int) -> None:
    stmt = delete(ExpenseSplit).where(ExpenseSplit.expense_id == expense_id)
    db.execute(stmt)
from decimal import Decimal
from typing import List

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.expense_split import ExpenseSplit


def create_expense_split(db: Session, *, expense_id: int, user_id: int, amount_owed: Decimal) -> ExpenseSplit:
    split = ExpenseSplit(expense_id=expense_id, user_id=user_id, amount_owed=amount_owed)
    db.add(split)
    db.flush()
    return split


def list_expense_splits(db: Session, expense_id: int) -> List[ExpenseSplit]:
    stmt = select(ExpenseSplit).where(ExpenseSplit.expense_id == expense_id).order_by(ExpenseSplit.created_at.asc())
    return db.scalars(stmt).all()


def delete_expense_splits(db: Session, expense_id: int) -> None:
    stmt = delete(ExpenseSplit).where(ExpenseSplit.expense_id == expense_id)
    db.execute(stmt)
