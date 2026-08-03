from decimal import Decimal
from pydantic import ValidationError
import pytest
from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.settlement import SettlementCreate
from app.services.settlement import (
    create_settlement,
    list_settlements,
    complete_settlement,
)


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


def _setup_group_with_members(db_session, num_members=2):
    """Helper to create a group with the specified number of members."""
    users = []
    for i in range(num_members):
        user = User(
            full_name=f"User {i + 1}",
            email=f"user{i + 1}@example.com",
            password_hash="hash",
        )
        users.append(user)
    db_session.add_all(users)
    db_session.flush()

    group = Group(name="Test Group", description="Test", owner_id=users[0].id)
    db_session.add(group)
    db_session.flush()

    for user in users:
        db_session.add(GroupMember(group_id=group.id, user_id=user.id))
    db_session.flush()

    return group, users


# ─── Create settlement ───────────────────────────────────────────────

def test_create_settlement_happy_path(db_session):
    group, users = _setup_group_with_members(db_session)
    payer, receiver = users[0], users[1]

    settlement_in = SettlementCreate(
        payer_id=payer.id,
        receiver_id=receiver.id,
        amount=Decimal("500.00"),
    )
    settlement = create_settlement(db_session, payer, group.id, settlement_in)

    assert settlement.id is not None
    assert settlement.group_id == group.id
    assert settlement.payer_id == payer.id
    assert settlement.receiver_id == receiver.id
    assert settlement.amount == Decimal("500.00")
    assert settlement.status == "PENDING"
    assert settlement.settled_at is None


# ─── List settlements ────────────────────────────────────────────────

def test_list_settlements(db_session):
    group, users = _setup_group_with_members(db_session, num_members=3)

    # Create two settlements
    s1 = SettlementCreate(payer_id=users[0].id, receiver_id=users[1].id, amount=Decimal("200.00"))
    s2 = SettlementCreate(payer_id=users[2].id, receiver_id=users[0].id, amount=Decimal("300.00"))

    create_settlement(db_session, users[0], group.id, s1)
    create_settlement(db_session, users[2], group.id, s2)

    settlements = list_settlements(db_session, users[0], group.id)
    assert len(settlements) == 2


# ─── Complete settlement ─────────────────────────────────────────────

def test_complete_settlement_happy_path(db_session):
    group, users = _setup_group_with_members(db_session)

    settlement_in = SettlementCreate(
        payer_id=users[0].id,
        receiver_id=users[1].id,
        amount=Decimal("750.00"),
    )
    settlement = create_settlement(db_session, users[0], group.id, settlement_in)
    assert settlement.status == "PENDING"

    completed = complete_settlement(db_session, users[0], settlement.id)
    assert completed.status == "COMPLETED"
    assert completed.settled_at is not None


# ─── Unauthorized access ─────────────────────────────────────────────

def test_create_settlement_unauthorized_user(db_session):
    group, users = _setup_group_with_members(db_session)

    # Create an outsider who is not a group member
    outsider = User(full_name="Outsider", email="outsider@example.com", password_hash="hash")
    db_session.add(outsider)
    db_session.flush()

    settlement_in = SettlementCreate(
        payer_id=users[0].id,
        receiver_id=users[1].id,
        amount=Decimal("100.00"),
    )

    with pytest.raises(HTTPException) as exc_info:
        create_settlement(db_session, outsider, group.id, settlement_in)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


def test_list_settlements_unauthorized_user(db_session):
    group, users = _setup_group_with_members(db_session)

    outsider = User(full_name="Outsider", email="outsider@example.com", password_hash="hash")
    db_session.add(outsider)
    db_session.flush()

    with pytest.raises(HTTPException) as exc_info:
        list_settlements(db_session, outsider, group.id)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


def test_complete_settlement_unauthorized_user(db_session):
    group, users = _setup_group_with_members(db_session)

    settlement_in = SettlementCreate(
        payer_id=users[0].id,
        receiver_id=users[1].id,
        amount=Decimal("100.00"),
    )
    settlement = create_settlement(db_session, users[0], group.id, settlement_in)

    outsider = User(full_name="Outsider", email="outsider@example.com", password_hash="hash")
    db_session.add(outsider)
    db_session.flush()

    with pytest.raises(HTTPException) as exc_info:
        complete_settlement(db_session, outsider, settlement.id)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


# ─── Invalid group ────────────────────────────────────────────────────

def test_create_settlement_invalid_group(db_session):
    user = User(full_name="User 1", email="user1@example.com", password_hash="hash")
    db_session.add(user)
    db_session.flush()

    settlement_in = SettlementCreate(
        payer_id=user.id,
        receiver_id=user.id,
        amount=Decimal("100.00"),
    )

    with pytest.raises(HTTPException) as exc_info:
        create_settlement(db_session, user, 9999, settlement_in)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# ─── Invalid amount ──────────────────────────────────────────────────


def test_create_settlement_zero_amount(db_session):
    group, users = _setup_group_with_members(db_session)

    with pytest.raises(ValidationError):
        SettlementCreate(
            payer_id=users[0].id,
            receiver_id=users[1].id,
            amount=Decimal("0.00"),
        )


def test_create_settlement_negative_amount(db_session):
    group, users = _setup_group_with_members(db_session)

    with pytest.raises(ValidationError):
        SettlementCreate(
            payer_id=users[0].id,
            receiver_id=users[1].id,
            amount=Decimal("-50.00"),
        )


# ─── Duplicate completion ────────────────────────────────────────────

def test_complete_settlement_already_completed(db_session):
    group, users = _setup_group_with_members(db_session)

    settlement_in = SettlementCreate(
        payer_id=users[0].id,
        receiver_id=users[1].id,
        amount=Decimal("250.00"),
    )
    settlement = create_settlement(db_session, users[0], group.id, settlement_in)

    # Complete once
    complete_settlement(db_session, users[0], settlement.id)

    # Try to complete again
    with pytest.raises(HTTPException) as exc_info:
        complete_settlement(db_session, users[0], settlement.id)

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert "already completed" in exc_info.value.detail


# ─── Payer == Receiver ────────────────────────────────────────────────

def test_create_settlement_payer_equals_receiver(db_session):
    group, users = _setup_group_with_members(db_session)

    settlement_in = SettlementCreate(
        payer_id=users[0].id,
        receiver_id=users[0].id,
        amount=Decimal("100.00"),
    )

    with pytest.raises(HTTPException) as exc_info:
        create_settlement(db_session, users[0], group.id, settlement_in)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "different users" in exc_info.value.detail


# ─── Non-member settlement ───────────────────────────────────────────

def test_create_settlement_payer_not_member(db_session):
    group, users = _setup_group_with_members(db_session)

    non_member = User(full_name="Non Member", email="nonmember@example.com", password_hash="hash")
    db_session.add(non_member)
    db_session.flush()

    settlement_in = SettlementCreate(
        payer_id=non_member.id,
        receiver_id=users[1].id,
        amount=Decimal("100.00"),
    )

    with pytest.raises(HTTPException) as exc_info:
        create_settlement(db_session, users[0], group.id, settlement_in)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Payer is not a member" in exc_info.value.detail


def test_create_settlement_receiver_not_member(db_session):
    group, users = _setup_group_with_members(db_session)

    non_member = User(full_name="Non Member", email="nonmember@example.com", password_hash="hash")
    db_session.add(non_member)
    db_session.flush()

    settlement_in = SettlementCreate(
        payer_id=users[0].id,
        receiver_id=non_member.id,
        amount=Decimal("100.00"),
    )

    with pytest.raises(HTTPException) as exc_info:
        create_settlement(db_session, users[0], group.id, settlement_in)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Receiver is not a member" in exc_info.value.detail


# ─── Settlement not found ────────────────────────────────────────────

def test_complete_settlement_not_found(db_session):
    user = User(full_name="User 1", email="user1@example.com", password_hash="hash")
    db_session.add(user)
    db_session.flush()

    with pytest.raises(HTTPException) as exc_info:
        complete_settlement(db_session, user, 9999)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
