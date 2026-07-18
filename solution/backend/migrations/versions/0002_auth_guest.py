"""Make email optional, enforce one role per user, and rotate refresh hashes."""

import sqlalchemy as sa
from alembic import op

revision = "0002_auth_guest"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Keep the earliest assignment when migrating databases that had multiple roles.
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        bind.execute(
            sa.text(
                "DELETE FROM auth_user_roles WHERE rowid NOT IN (SELECT MIN(rowid) FROM auth_user_roles GROUP BY user_id)"
            )
        )
    inspector = sa.inspect(bind)
    email = next(
        column for column in inspector.get_columns("auth_users") if column["name"] == "email"
    )
    if not email["nullable"]:
        with op.batch_alter_table("auth_users") as batch:
            batch.alter_column("email", existing_type=sa.String(length=255), nullable=True)
    role_names = {item["name"] for item in inspector.get_indexes("auth_user_roles")} | {
        item["name"] for item in inspector.get_unique_constraints("auth_user_roles")
    }
    if "uq_auth_user_roles_user" not in role_names:
        op.create_index("uq_auth_user_roles_user", "auth_user_roles", ["user_id"], unique=True)
    session_names = {item["name"] for item in inspector.get_indexes("auth_sessions")} | {
        item["name"] for item in inspector.get_unique_constraints("auth_sessions")
    }
    if "ix_auth_sessions_refresh_token_hash" not in session_names:
        op.create_index(
            "ix_auth_sessions_refresh_token_hash",
            "auth_sessions",
            ["refresh_token_hash"],
            unique=True,
        )


def downgrade() -> None:
    op.drop_index("ix_auth_sessions_refresh_token_hash", table_name="auth_sessions")
    op.drop_index("uq_auth_user_roles_user", table_name="auth_user_roles")
