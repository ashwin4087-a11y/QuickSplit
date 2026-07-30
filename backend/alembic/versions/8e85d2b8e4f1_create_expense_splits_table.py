"""create expense_splits table

Revision ID: 8e85d2b8e4f1
Revises: b7c6d4e8f9a0
Create Date: 2026-07-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '8e85d2b8e4f1'
down_revision: Union[str, Sequence[str], None] = 'b7c6d4e8f9a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'expense_splits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('expense_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount_owed', sa.Numeric(12, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('expense_id', 'user_id', name='uq_expense_splits_expense_user'),
    )
    op.create_index(op.f('ix_expense_splits_expense_id'), 'expense_splits', ['expense_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_expense_splits_expense_id'), table_name='expense_splits')
    op.drop_table('expense_splits')
