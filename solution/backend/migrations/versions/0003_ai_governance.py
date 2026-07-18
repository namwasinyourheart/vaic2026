"""Add AI clause, conflict and governance workflow references."""
from alembic import op
import sqlalchemy as sa

revision = "0003_ai_governance"
down_revision = "0002_auth_guest"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("ai_ref_clauses", sa.Column("id", sa.String(36), primary_key=True), sa.Column("document_id", sa.String(36), sa.ForeignKey("knowledge_documents.id"), nullable=False), sa.Column("document_version_id", sa.String(36)), sa.Column("ai_clause_id", sa.String(255), nullable=False, unique=True), sa.Column("clause_path", sa.String(500)), sa.Column("effective_status", sa.String(40), nullable=False), sa.Column("sync_status", sa.String(40), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_ai_ref_clauses_document_id", "ai_ref_clauses", ["document_id"])
    op.create_table("ai_ref_conflicts", sa.Column("id", sa.String(36), primary_key=True), sa.Column("left_document_id", sa.String(36), sa.ForeignKey("knowledge_documents.id"), nullable=False), sa.Column("right_document_id", sa.String(36)), sa.Column("ai_conflict_id", sa.String(255), nullable=False, unique=True), sa.Column("conflict_type", sa.String(60), nullable=False), sa.Column("severity", sa.String(20), nullable=False), sa.Column("review_status", sa.String(30), nullable=False), sa.Column("resolution_status", sa.String(30), nullable=False), sa.Column("preferred_ai_clause_id", sa.String(255)), sa.Column("sync_status", sa.String(40), nullable=False), sa.Column("reviewed_by", sa.String(36)), sa.Column("reviewed_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_ai_ref_conflicts_left_document_id", "ai_ref_conflicts", ["left_document_id"])
    op.create_table("workflow_relation_reviews", sa.Column("id", sa.String(36), primary_key=True), sa.Column("ai_relation_ref_id", sa.String(36), sa.ForeignKey("ai_ref_relations.id"), nullable=False), sa.Column("reviewer_id", sa.String(36), sa.ForeignKey("auth_users.id"), nullable=False), sa.Column("decision", sa.String(30), nullable=False), sa.Column("reason", sa.Text()), sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_workflow_relation_reviews_ref", "workflow_relation_reviews", ["ai_relation_ref_id"])
    op.create_table("workflow_impact_analyses", sa.Column("id", sa.String(36), primary_key=True), sa.Column("source_document_id", sa.String(36), sa.ForeignKey("knowledge_documents.id"), nullable=False), sa.Column("target_document_id", sa.String(36), sa.ForeignKey("knowledge_documents.id"), nullable=False), sa.Column("ai_analysis_id", sa.String(255), nullable=False, unique=True), sa.Column("status", sa.String(30), nullable=False), sa.Column("effect_count", sa.Integer(), nullable=False), sa.Column("approved_effect_count", sa.Integer(), nullable=False), sa.Column("requested_by", sa.String(36), sa.ForeignKey("auth_users.id"), nullable=False), sa.Column("reviewed_by", sa.String(36)), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("completed_at", sa.DateTime(timezone=True)), sa.Column("reviewed_at", sa.DateTime(timezone=True)))


def downgrade() -> None:
    op.drop_table("workflow_impact_analyses")
    op.drop_index("ix_workflow_relation_reviews_ref", table_name="workflow_relation_reviews")
    op.drop_table("workflow_relation_reviews")
    op.drop_index("ix_ai_ref_conflicts_left_document_id", table_name="ai_ref_conflicts")
    op.drop_table("ai_ref_conflicts")
    op.drop_index("ix_ai_ref_clauses_document_id", table_name="ai_ref_clauses")
    op.drop_table("ai_ref_clauses")
