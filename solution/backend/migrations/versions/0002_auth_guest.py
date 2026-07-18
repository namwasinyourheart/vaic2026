"""Make email optional, enforce one role per user, and rotate refresh hashes."""
from alembic import op
import sqlalchemy as sa

revision = "0002_auth_guest"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Keep the earliest assignment when migrating databases that had multiple roles.
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        bind.execute(sa.text("DELETE FROM auth_user_roles WHERE rowid NOT IN (SELECT MIN(rowid) FROM auth_user_roles GROUP BY user_id)"))
    with op.batch_alter_table("auth_users") as batch:
        batch.alter_column("email", existing_type=sa.String(length=255), nullable=True)
    op.create_index("uq_auth_user_roles_user", "auth_user_roles", ["user_id"], unique=True)
    op.create_index("ix_auth_sessions_refresh_token_hash", "auth_sessions", ["refresh_token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_auth_sessions_refresh_token_hash", table_name="auth_sessions")
    op.drop_index("uq_auth_user_roles_user", table_name="auth_user_roles")
