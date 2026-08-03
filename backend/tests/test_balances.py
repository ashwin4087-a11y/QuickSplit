from decimal import Decimal

import pytest
from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.user import User
from app.services.balance import compute_group_balances


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


def test_compute_group_balances_with_expenses_and_splits(db_session):
    owner = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    member_two = User(full_name="Kamalesh", email="kamalesh@example.com", password_hash="hash")
    member_three = User(full_name="Alice", email="alice@example.com", password_hash="hash")
    db_session.add_all([owner, member_two, member_three])
    db_session.flush()

    group = Group(name="Weekend Trip", description="Test", owner_id=owner.id)
    db_session.add(group)
    db_session.flush()

    db_session.add_all(
        [
            GroupMember(group_id=group.id, user_id=owner.id),
            GroupMember(group_id=group.id, user_id=member_two.id),
            GroupMember(group_id=group.id, user_id=member_three.id),
        ]
    )

    dinner = Expense(group_id=group.id, title="Dinner", description=None, amount=Decimal("1500.00"), paid_by=owner.id)
    db_session.add(dinner)
    db_session.flush()

    db_session.add_all(
        [
            ExpenseSplit(expense_id=dinner.id, user_id=owner.id, amount_owed=Decimal("500.00")),
            ExpenseSplit(expense_id=dinner.id, user_id=member_two.id, amount_owed=Decimal("500.00")),
            ExpenseSplit(expense_id=dinner.id, user_id=member_three.id, amount_owed=Decimal("500.00")),
        ]
    )
    db_session.flush()

    # Call with group owner as the authenticating user
    balances = compute_group_balances(db_session, owner, group.id)

    assert len(balances) == 3
    # Check deterministic order by user_id ascending
    assert balances[0]["user_id"] < balances[1]["user_id"] < balances[2]["user_id"]

    balances_dict = {b["user_id"]: b for b in balances}

    assert balances_dict[owner.id]["paid"] == Decimal("1500.00")
    assert balances_dict[owner.id]["owed"] == Decimal("500.00")
    assert balances_dict[owner.id]["balance"] == Decimal("1000.00")

    assert balances_dict[member_two.id]["paid"] == Decimal("0.00")
    assert balances_dict[member_two.id]["owed"] == Decimal("500.00")
    assert balances_dict[member_two.id]["balance"] == Decimal("-500.00")

    assert balances_dict[member_three.id]["paid"] == Decimal("0.00")
    assert balances_dict[member_three.id]["owed"] == Decimal("500.00")
    assert balances_dict[member_three.id]["balance"] == Decimal("-500.00")

    total_balance = sum((b["balance"] for b in balances), Decimal("0.00"))
    assert total_balance == Decimal("0.00")

    for b in balances:
        assert b["balance"] == b["paid"] - b["owed"]


def test_compute_group_balances_unauthorized_user(db_session):
    owner = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    unauthorized_user = User(full_name="Bob", email="bob@example.com", password_hash="hash")
    db_session.add_all([owner, unauthorized_user])
    db_session.flush()

    group = Group(name="Secret Group", description="Test", owner_id=owner.id)
    db_session.add(group)
    db_session.flush()

    db_session.add(GroupMember(group_id=group.id, user_id=owner.id))
    db_session.flush()

    with pytest.raises(HTTPException) as exc_info:
        compute_group_balances(db_session, unauthorized_user, group.id)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "not a member" in exc_info.value.detail


def test_compute_group_balances_missing_group(db_session):
    owner = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    db_session.add(owner)
    db_session.flush()

    with pytest.raises(HTTPException) as exc_info:
        compute_group_balances(db_session, owner, 9999)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert "Group not found" in exc_info.value.detail


def test_compute_group_balances_expense_without_splits(db_session):
    owner = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    db_session.add(owner)
    db_session.flush()

    group = Group(name="Weekend Trip", description="Test", owner_id=owner.id)
    db_session.add(group)
    db_session.flush()

    db_session.add(GroupMember(group_id=group.id, user_id=owner.id))

    # Add expense but don't add splits (invalid scenario)
    dinner = Expense(group_id=group.id, title="Dinner", description=None, amount=Decimal("1500.00"), paid_by=owner.id)
    db_session.add(dinner)
    db_session.flush()

    balances = compute_group_balances(db_session, owner, group.id)

    assert len(balances) == 1
    # Payer's paid amount should not be modified because the expense was ignored
    assert balances[0]["paid"] == Decimal("0.00")
    assert balances[0]["owed"] == Decimal("0.00")
    assert balances[0]["balance"] == Decimal("0.00")
