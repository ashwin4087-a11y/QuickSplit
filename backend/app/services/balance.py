from decimal import Decimal
from typing import List
import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud.expense import list_expenses_for_group
from app.crud.expense_split import list_expense_splits_for_expenses
from app.crud.group import get_group_by_id, get_group_by_id_for_member
from app.crud.member import list_group_members
from app.models.user import User

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


def compute_group_balances(db: Session, current_user: User, group_id: int) -> List[dict]:
    # Ensure current user is authorized to access the group
    _ensure_group_and_membership(db, group_id, current_user.id)

    # 1. Fetch current group members
    members = list_group_members(db, group_id)

    # 2. Fetch all expenses for this group
    expenses = list_expenses_for_group(db, group_id)

    # 3. Batch fetch all splits for these expenses to prevent N+1 queries
    expense_ids = [expense.id for expense in expenses]
    splits = list_expense_splits_for_expenses(db, expense_ids)

    # Group splits by their parent expense_id
    from collections import defaultdict
    splits_by_expense = defaultdict(list)
    for split in splits:
        splits_by_expense[split.expense_id].append(split)

    # 4. Identify all user IDs involved (members, expense payers, split debtors)
    # This ensures historical/past members are not ignored if they have financial history
    all_user_ids = {m.id for m in members}
    for expense in expenses:
        all_user_ids.add(expense.paid_by)
    for split in splits:
        all_user_ids.add(split.user_id)

    # Fetch User records for all involved IDs to populate names and emails
    involved_users = db.scalars(select(User).where(User.id.in_(all_user_ids))).all()
    users_map = {u.id: u for u in involved_users}

    # 5. Initialize balances mapping
    balances = {
        user_id: {
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "paid": Decimal("0.00"),
            "owed": Decimal("0.00"),
            "balance": Decimal("0.00"),
        }
        for user_id, user in users_map.items()
    }

    # 6. Accumulate paid and owed amounts
    for expense in expenses:
        expense_splits = splits_by_expense.get(expense.id, [])
        if not expense_splits:
            # Documented choice: ignore invalid expenses without splits
            logger.warning(
                "Expense %s paid by user %s has no splits. Treating as invalid and ignoring.",
                expense.id,
                expense.paid_by,
            )
            continue

        if expense.paid_by in balances:
            balances[expense.paid_by]["paid"] += expense.amount

        for split in expense_splits:
            if split.user_id in balances:
                balances[split.user_id]["owed"] += split.amount_owed

    # 7. Compute net balances
    for user_id, values in balances.items():
        values["balance"] = values["paid"] - values["owed"]

    # 8. Sort deterministically by user_id ascending
    result = list(balances.values())
    result.sort(key=lambda x: x["user_id"])

    return result
