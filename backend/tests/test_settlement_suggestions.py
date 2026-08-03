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
from app.services.settlement_suggestion import compute_group_settlements


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


def test_empty_group(db_session):
    owner = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    member_two = User(full_name="Kamalesh", email="kamalesh@example.com", password_hash="hash")
    db_session.add_all([owner, member_two])
    db_session.flush()

    group = Group(name="Empty Group", description="Test", owner_id=owner.id)
    db_session.add(group)
    db_session.flush()

    db_session.add_all(
        [
            GroupMember(group_id=group.id, user_id=owner.id),
            GroupMember(group_id=group.id, user_id=member_two.id),
        ]
    )
    db_session.flush()

    suggestions = compute_group_settlements(db_session, owner, group.id)
    assert len(suggestions) == 0


def test_single_member_group(db_session):
    owner = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    db_session.add(owner)
    db_session.flush()

    group = Group(name="Solo Group", description="Test", owner_id=owner.id)
    db_session.add(group)
    db_session.flush()

    db_session.add(GroupMember(group_id=group.id, user_id=owner.id))
    db_session.flush()

    suggestions = compute_group_settlements(db_session, owner, group.id)
    assert len(suggestions) == 0


def test_settled_group(db_session):
    owner = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    member_two = User(full_name="Kamalesh", email="kamalesh@example.com", password_hash="hash")
    db_session.add_all([owner, member_two])
    db_session.flush()

    group = Group(name="Settled Group", description="Test", owner_id=owner.id)
    db_session.add(group)
    db_session.flush()

    db_session.add_all(
        [
            GroupMember(group_id=group.id, user_id=owner.id),
            GroupMember(group_id=group.id, user_id=member_two.id),
        ]
    )
    db_session.flush()

    # Expense 1 paid by Raja, split equally
    exp1 = Expense(group_id=group.id, title="Lunch", description=None, amount=Decimal("100.00"), paid_by=owner.id)
    db_session.add(exp1)
    db_session.flush()
    db_session.add_all([
        ExpenseSplit(expense_id=exp1.id, user_id=owner.id, amount_owed=Decimal("50.00")),
        ExpenseSplit(expense_id=exp1.id, user_id=member_two.id, amount_owed=Decimal("50.00")),
    ])

    # Expense 2 paid by Kamalesh, split equally (mutual settlement)
    exp2 = Expense(group_id=group.id, title="Dinner", description=None, amount=Decimal("100.00"), paid_by=member_two.id)
    db_session.add(exp2)
    db_session.flush()
    db_session.add_all([
        ExpenseSplit(expense_id=exp2.id, user_id=owner.id, amount_owed=Decimal("50.00")),
        ExpenseSplit(expense_id=exp2.id, user_id=member_two.id, amount_owed=Decimal("50.00")),
    ])
    db_session.flush()

    suggestions = compute_group_settlements(db_session, owner, group.id)
    assert len(suggestions) == 0


def test_multiple_creditors_debtors_deterministic(db_session):
    # Setup 4 users
    u1 = User(full_name="User A", email="a@example.com", password_hash="hash")
    u2 = User(full_name="User B", email="b@example.com", password_hash="hash")
    u3 = User(full_name="User C", email="c@example.com", password_hash="hash")
    u4 = User(full_name="User D", email="d@example.com", password_hash="hash")
    db_session.add_all([u1, u2, u3, u4])
    db_session.flush()

    group = Group(name="Trip", owner_id=u1.id)
    db_session.add(group)
    db_session.flush()

    db_session.add_all([
        GroupMember(group_id=group.id, user_id=u1.id),
        GroupMember(group_id=group.id, user_id=u2.id),
        GroupMember(group_id=group.id, user_id=u3.id),
        GroupMember(group_id=group.id, user_id=u4.id),
    ])
    db_session.flush()

    # u1 pays 300, splits:
    # u2: 100
    # u3: 100
    # u4: 100
    exp = Expense(group_id=group.id, title="Stay", amount=Decimal("300.00"), paid_by=u1.id)
    db_session.add(exp)
    db_session.flush()
    db_session.add_all([
        ExpenseSplit(expense_id=exp.id, user_id=u2.id, amount_owed=Decimal("100.00")),
        ExpenseSplit(expense_id=exp.id, user_id=u3.id, amount_owed=Decimal("100.00")),
        ExpenseSplit(expense_id=exp.id, user_id=u4.id, amount_owed=Decimal("100.00")),
    ])

    # u2 pays 150, splits:
    # u3: 150
    exp2 = Expense(group_id=group.id, title="Dinner", amount=Decimal("150.00"), paid_by=u2.id)
    db_session.add(exp2)
    db_session.flush()
    db_session.add_all([
        ExpenseSplit(expense_id=exp2.id, user_id=u3.id, amount_owed=Decimal("150.00")),
    ])
    db_session.flush()

    # Creditors: [u1 (+300), u2 (+50)]
    # Debtors: [u3 (-250), u4 (-100)]
    suggestions = compute_group_settlements(db_session, u1, group.id)

    assert len(suggestions) == 3
    assert list(map(lambda x: (x.from_user_id, x.to_user_id, x.amount), suggestions)) == [
        (u3.id, u1.id, Decimal("250.00")),
        (u4.id, u1.id, Decimal("50.00")),
        (u4.id, u2.id, Decimal("50.00")),
    ]


def test_decimal_precision(db_session):
    u1 = User(full_name="User A", email="a@example.com", password_hash="hash")
    u2 = User(full_name="User B", email="b@example.com", password_hash="hash")
    u3 = User(full_name="User C", email="c@example.com", password_hash="hash")
    db_session.add_all([u1, u2, u3])
    db_session.flush()

    group = Group(name="Trip", owner_id=u1.id)
    db_session.add(group)
    db_session.flush()

    db_session.add_all([
        GroupMember(group_id=group.id, user_id=u1.id),
        GroupMember(group_id=group.id, user_id=u2.id),
        GroupMember(group_id=group.id, user_id=u3.id),
    ])
    db_session.flush()

    # Split 100.03 amongst 3 users
    exp = Expense(group_id=group.id, title="Lunch", amount=Decimal("100.03"), paid_by=u1.id)
    db_session.add(exp)
    db_session.flush()
    db_session.add_all([
        ExpenseSplit(expense_id=exp.id, user_id=u1.id, amount_owed=Decimal("33.35")),
        ExpenseSplit(expense_id=exp.id, user_id=u2.id, amount_owed=Decimal("33.34")),
        ExpenseSplit(expense_id=exp.id, user_id=u3.id, amount_owed=Decimal("33.34")),
    ])
    db_session.flush()

    suggestions = compute_group_settlements(db_session, u1, group.id)

    assert len(suggestions) == 2
    assert suggestions[0].from_user_id == u2.id
    assert suggestions[0].to_user_id == u1.id
    assert suggestions[0].amount == Decimal("33.34")

    assert suggestions[1].from_user_id == u3.id
    assert suggestions[1].to_user_id == u1.id
    assert suggestions[1].amount == Decimal("33.34")


def test_unauthorized_user(db_session):
    u1 = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    unauthorized_user = User(full_name="Bob", email="bob@example.com", password_hash="hash")
    db_session.add_all([u1, unauthorized_user])
    db_session.flush()

    group = Group(name="Secret Group", owner_id=u1.id)
    db_session.add(group)
    db_session.flush()

    db_session.add(GroupMember(group_id=group.id, user_id=u1.id))
    db_session.flush()

    with pytest.raises(HTTPException) as exc_info:
        compute_group_settlements(db_session, unauthorized_user, group.id)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


def test_missing_group(db_session):
    u1 = User(full_name="Raja", email="raja@example.com", password_hash="hash")
    db_session.add(u1)
    db_session.flush()

    with pytest.raises(HTTPException) as exc_info:
        compute_group_settlements(db_session, u1, 9999)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
