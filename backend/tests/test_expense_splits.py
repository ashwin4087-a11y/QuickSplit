from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.expense_split import ExpenseSplitCreate, ExpenseSplitCreateRequest
from app.services.expense_split import create_expense_splits, delete_expense_splits_service, update_expense_splits


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _create_expense_context(db_session):
    owner = User(full_name="Owner", email="owner@example.com", password_hash="hash")
    member_two = User(full_name="Member Two", email="member2@example.com", password_hash="hash")
    member_three = User(full_name="Member Three", email="member3@example.com", password_hash="hash")
    db_session.add_all([owner, member_two, member_three])
    db_session.flush()

    group = Group(name="Trip", description="Test group", owner_id=owner.id)
    db_session.add(group)
    db_session.flush()

    db_session.add_all(
        [
            GroupMember(group_id=group.id, user_id=owner.id),
            GroupMember(group_id=group.id, user_id=member_two.id),
            GroupMember(group_id=group.id, user_id=member_three.id),
        ]
    )

    expense = Expense(group_id=group.id, title="Dinner", description=None, amount=Decimal("1500"), paid_by=owner.id)
    db_session.add(expense)
    db_session.flush()
    return owner, member_two, member_three, expense


def test_create_expense_splits_succeeds(db_session):
    owner, member_two, member_three, expense = _create_expense_context(db_session)
    payload = ExpenseSplitCreateRequest(
        splits=[
            ExpenseSplitCreate(user_id=owner.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=member_two.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=member_three.id, amount_owed=Decimal("500")),
        ]
    )

    splits = create_expense_splits(db_session, current_user=owner, expense_id=expense.id, splits_in=payload)

    assert len(splits) == 3
    assert sum((split.amount_owed for split in splits), Decimal("0")) == Decimal("1500")


def test_create_expense_splits_rejects_duplicate_users(db_session):
    owner, member_two, member_three, expense = _create_expense_context(db_session)
    payload = ExpenseSplitCreateRequest(
        splits=[
            ExpenseSplitCreate(user_id=owner.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=owner.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=member_three.id, amount_owed=Decimal("500")),
        ]
    )

    with pytest.raises(HTTPException):
        create_expense_splits(db_session, current_user=owner, expense_id=expense.id, splits_in=payload)


def test_update_expense_splits_replaces_existing_splits(db_session):
    owner, member_two, member_three, expense = _create_expense_context(db_session)
    initial_payload = ExpenseSplitCreateRequest(
        splits=[
            ExpenseSplitCreate(user_id=owner.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=member_two.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=member_three.id, amount_owed=Decimal("500")),
        ]
    )
    create_expense_splits(db_session, current_user=owner, expense_id=expense.id, splits_in=initial_payload)

    updated_payload = ExpenseSplitCreateRequest(
        splits=[
            ExpenseSplitCreate(user_id=owner.id, amount_owed=Decimal("750")),
            ExpenseSplitCreate(user_id=member_two.id, amount_owed=Decimal("750")),
        ]
    )

    updated = update_expense_splits(db_session, current_user=owner, expense_id=expense.id, splits_in=updated_payload)

    assert len(updated) == 2
    assert sum((split.amount_owed for split in updated), Decimal("0")) == Decimal("1500")


def test_delete_expense_splits_removes_all_splits(db_session):
    owner, member_two, member_three, expense = _create_expense_context(db_session)
    payload = ExpenseSplitCreateRequest(
        splits=[
            ExpenseSplitCreate(user_id=owner.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=member_two.id, amount_owed=Decimal("500")),
            ExpenseSplitCreate(user_id=member_three.id, amount_owed=Decimal("500")),
        ]
    )
    create_expense_splits(db_session, current_user=owner, expense_id=expense.id, splits_in=payload)

    delete_expense_splits_service(db_session, current_user=owner, expense_id=expense.id)

    assert db_session.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense.id).count() == 0
