"""Rename role codes to the public ROLE_* contract."""

from alembic import op
import sqlalchemy as sa

revision = "0005_role_code_names"
down_revision = "0004_password_policy"
branch_labels = None
depends_on = None


ROLE_CODES = {
    "customer": "ROLE_CUSTOMER",
    "bank_employee": "ROLE_STAFF",
    "knowledge_manager": "ROLE_COMPLIANCE",
    "system_admin": "ROLE_ADMIN",
}


def upgrade() -> None:
    connection = op.get_bind()
    for old_code, new_code in ROLE_CODES.items():
        connection.execute(sa.text("UPDATE auth_roles SET code = :new WHERE code = :old"), {"new": new_code, "old": old_code})
    if _has_table("audit_logs"):
        for old_code, new_code in ROLE_CODES.items():
            connection.execute(sa.text("UPDATE audit_logs SET actor_role = :new WHERE actor_role = :old"), {"new": new_code, "old": old_code})


def downgrade() -> None:
    connection = op.get_bind()
    for old_code, new_code in ROLE_CODES.items():
        connection.execute(sa.text("UPDATE auth_roles SET code = :new WHERE code = :old"), {"new": old_code, "old": new_code})


def _has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()
