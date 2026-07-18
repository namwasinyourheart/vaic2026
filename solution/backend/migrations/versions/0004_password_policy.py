"""Add first-login password change policy."""

import sqlalchemy as sa
from alembic import op

revision = "0004_password_policy"
down_revision = "0003_ai_governance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("auth_users")}
    if "must_change_password" not in columns:
        op.add_column(
            "auth_users",
            sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.alter_column("auth_users", "must_change_password", server_default=None)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("auth_users")}
    if "must_change_password" in columns:
        op.drop_column("auth_users", "must_change_password")
