from decimal import Decimal
from typing import List, Tuple

from app.services.balance import compute_group_balances


def compute_group_settlements(db, group_id: int) -> List[dict]:
    balances = compute_group_balances(db, group_id)

    creditors: List[Tuple[int, Decimal]] = []
    debtors: List[Tuple[int, Decimal]] = []

    for member_id, values in balances.items():
        balance = values["balance"]
        if balance > 0:
            creditors.append((member_id, balance))
        elif balance < 0:
            debtors.append((member_id, -balance))

    creditors.sort(key=lambda item: item[1], reverse=True)
    debtors.sort(key=lambda item: item[1], reverse=True)

    settlements: List[dict] = []
    creditor_index = 0
    debtor_index = 0

    while creditor_index < len(creditors) and debtor_index < len(debtors):
        creditor_id, creditor_amount = creditors[creditor_index]
        debtor_id, debtor_amount = debtors[debtor_index]

        amount = min(creditor_amount, debtor_amount)
        if amount <= 0:
            break

        settlements.append({
            "from_user_id": debtor_id,
            "to_user_id": creditor_id,
            "amount": amount,
        })

        creditors[creditor_index] = (creditor_id, creditor_amount - amount)
        debtors[debtor_index] = (debtor_id, debtor_amount - amount)

        if creditors[creditor_index][1] == 0:
            creditor_index += 1
        if debtors[debtor_index][1] == 0:
            debtor_index += 1

    return settlements
