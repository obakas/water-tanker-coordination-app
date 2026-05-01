"""add operation alerts table

Revision ID: a1217e241238
Revises: 916132b376a8
Create Date: 2026-05-01 18:19:59.235390

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1217e241238'
down_revision: Union[str, Sequence[str], None] = '916132b376a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "operation_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("alert_type", sa.String(), nullable=True),
        sa.Column("severity", sa.String(), nullable=True),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("entity_type", sa.String(), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_operation_alerts_id"), "operation_alerts", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_operation_alerts_id"), table_name="operation_alerts")
    op.drop_table("operation_alerts")
