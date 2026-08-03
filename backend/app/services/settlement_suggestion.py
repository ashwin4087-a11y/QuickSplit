from decimal import Decimal
from typing import List

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.settlement_suggestion import SettlementSuggestionResponse
from app.services.balance import compute_group_balances


def compute_group_settlements(
    db: Session, current_user: User, group_id: int
) -> List[SettlementSuggestionResponse]:
    # 1. Fetch balances using the Balance service (which performs authorization)
    balances = compute_group_balances(db, current_user, group_id)

    creditors = []
    debtors = []

    # 2. Separate into creditors and debtors comparing against Decimal("0.00")
    for member_balance in balances:
        val = member_balance["balance"]
        if val > Decimal("0.00"):
            creditors.append({
                "user_id": member_balance["user_id"],
                "full_name": member_balance["full_name"],
                "balance": val,
            })
        elif val < Decimal("0.00"):
            debtors.append({
                "user_id": member_balance["user_id"],
                "full_name": member_balance["full_name"],
                "balance": -val,  # Keep positive absolute value for pointer comparison
            })

    # 3. Sort deterministically:
    # Creditors: descending by balance, ascending by user_id
    creditors.sort(key=lambda x: (-x["balance"], x["user_id"]))
    # Debtors: descending by absolute debt, ascending by user_id
    debtors.sort(key=lambda x: (-x["balance"], x["user_id"]))

    suggestions: List[SettlementSuggestionResponse] = []
    creditor_index = 0
    debtor_index = 0

    # 4. Greedy match largest creditor with largest debtor
    while creditor_index < len(creditors) and debtor_index < len(debtors):
        creditor = creditors[creditor_index]
        debtor = debtors[debtor_index]

        amount = min(creditor["balance"], debtor["balance"])
        if amount <= Decimal("0.00"):
            break

        suggestions.append(
            SettlementSuggestionResponse(
                from_user_id=debtor["user_id"],
                from_user_name=debtor["full_name"],
                to_user_id=creditor["user_id"],
                to_user_name=creditor["full_name"],
                amount=amount,
            )
        )

        creditor["balance"] -= amount
        debtor["balance"] -= amount

        # Increment pointers if balance matches Decimal("0.00")
        if creditor["balance"] == Decimal("0.00"):
            creditor_index += 1
        if debtor["balance"] == Decimal("0.00"):
            debtor_index += 1

    return suggestions
