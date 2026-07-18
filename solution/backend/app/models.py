from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "auth_users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(Text)
    full_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", index=True)
    department_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Role(Base):
    __tablename__ = "auth_roles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class Permission(Base):
    __tablename__ = "auth_permissions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(100), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    resource: Mapped[str] = mapped_column(String(80))
    action: Mapped[str] = mapped_column(String(80))


class UserRole(Base):
    __tablename__ = "auth_user_roles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_auth_user_roles_user"),)
    user_id: Mapped[str] = mapped_column(ForeignKey("auth_users.id"), primary_key=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("auth_roles.id"), primary_key=True)
    assigned_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class RolePermission(Base):
    __tablename__ = "auth_role_permissions"
    role_id: Mapped[str] = mapped_column(ForeignKey("auth_roles.id"), primary_key=True)
    permission_id: Mapped[str] = mapped_column(ForeignKey("auth_permissions.id"), primary_key=True)
    granted_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Session(Base):
    __tablename__ = "auth_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("auth_users.id"), index=True)
    refresh_token_hash: Mapped[str] = mapped_column(Text, unique=True, index=True)
    device_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(80), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Document(Base):
    __tablename__ = "knowledge_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_code: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500))
    document_type: Mapped[str] = mapped_column(String(100))
    issuing_unit: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    application_scope: Mapped[str | None] = mapped_column(Text, nullable=True)
    access_scope: Mapped[str] = mapped_column(String(30), default="INTERNAL")
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_status: Mapped[str] = mapped_column(String(40), default="FUTURE_EFFECTIVE")
    lifecycle_status: Mapped[str] = mapped_column(String(40), default="ACTIVE")
    processing_status: Mapped[str] = mapped_column(String(40), default="QUEUED")
    index_status: Mapped[str] = mapped_column(String(40), default="NOT_INDEXED")
    current_version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    owner_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_by: Mapped[str] = mapped_column(String(36))
    updated_by: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DocumentVersion(Base):
    __tablename__ = "knowledge_document_versions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    version_label: Mapped[str] = mapped_column(String(100))
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="FUTURE_EFFECTIVE")
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    change_document_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_by: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class DocumentFile(Base):
    __tablename__ = "knowledge_document_files"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    original_file_name: Mapped[str] = mapped_column(String(500))
    storage_provider: Mapped[str] = mapped_column(String(30), default="local")
    storage_bucket: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_key: Mapped[str] = mapped_column(Text, unique=True)
    mime_type: Mapped[str] = mapped_column(String(150))
    file_extension: Mapped[str] = mapped_column(String(20))
    file_size: Mapped[int] = mapped_column(Integer)
    checksum_sha256: Mapped[str] = mapped_column(String(64))
    uploaded_by: Mapped[str] = mapped_column(String(36))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DocumentKeyword(Base):
    __tablename__ = "knowledge_document_keywords"
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), primary_key=True)
    keyword: Mapped[str] = mapped_column(String(150), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class DocumentAccess(Base):
    __tablename__ = "knowledge_document_access"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    subject_type: Mapped[str] = mapped_column(String(30))
    subject_id: Mapped[str] = mapped_column(String(100), index=True)
    access_level: Mapped[str] = mapped_column(String(30))
    granted_by: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AIDocumentRef(Base):
    __tablename__ = "ai_ref_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), unique=True)
    ai_document_id: Mapped[str] = mapped_column(String(255), unique=True)
    ai_collection: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sync_status: Mapped[str] = mapped_column(String(40), default="PENDING")
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_sync_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class AIVersionRef(Base):
    __tablename__ = "ai_ref_versions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_version_id: Mapped[str] = mapped_column(
        ForeignKey("knowledge_document_versions.id"), unique=True
    )
    ai_version_id: Mapped[str] = mapped_column(String(255), unique=True)
    sync_status: Mapped[str] = mapped_column(String(40), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class AIRelationRef(Base):
    __tablename__ = "ai_ref_relations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_document_id: Mapped[str] = mapped_column(
        ForeignKey("knowledge_documents.id"), index=True
    )
    target_document_id: Mapped[str] = mapped_column(
        ForeignKey("knowledge_documents.id"), index=True
    )
    ai_relation_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    relation_type: Mapped[str] = mapped_column(String(50))
    sync_status: Mapped[str] = mapped_column(String(40), default="PENDING")
    created_by: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class AIChunkRef(Base):
    __tablename__ = "ai_ref_chunks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    ai_chunk_id: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AIJobRef(Base):
    __tablename__ = "ai_ref_jobs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    job_id: Mapped[str] = mapped_column(String(36), unique=True)
    ai_job_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="QUEUED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AIClauseRef(Base):
    __tablename__ = "ai_ref_clauses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    document_version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ai_clause_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    clause_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    effective_status: Mapped[str] = mapped_column(String(40), default="EFFECTIVE")
    sync_status: Mapped[str] = mapped_column(String(40), default="SYNCED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class AIConflictRef(Base):
    __tablename__ = "ai_ref_conflicts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    left_document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    right_document_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ai_conflict_id: Mapped[str] = mapped_column(String(255), unique=True)
    conflict_type: Mapped[str] = mapped_column(String(60))
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    review_status: Mapped[str] = mapped_column(String(30), default="PENDING_REVIEW")
    resolution_status: Mapped[str] = mapped_column(String(30), default="UNRESOLVED")
    preferred_ai_clause_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sync_status: Mapped[str] = mapped_column(String(40), default="SYNCED")
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Conversation(Base):
    __tablename__ = "conversation_conversations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("auth_users.id"), index=True)
    title: Mapped[str] = mapped_column(String(500), default="Cuộc trò chuyện mới")
    scope: Mapped[str] = mapped_column(String(30), default="PUBLIC")
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Message(Base):
    __tablename__ = "conversation_messages"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversation_conversations.id"), index=True
    )
    parent_message_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="COMPLETED")
    ai_request_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)


class MessageFeedback(Base):
    __tablename__ = "conversation_message_feedback"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    message_id: Mapped[str] = mapped_column(ForeignKey("conversation_messages.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("auth_users.id"))
    feedback_type: Mapped[str] = mapped_column(String(30))
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class SourceGroup(Base):
    __tablename__ = "conversation_source_groups"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversation_conversations.id"), index=True
    )
    user_message_id: Mapped[str] = mapped_column(ForeignKey("conversation_messages.id"))
    assistant_message_id: Mapped[str] = mapped_column(ForeignKey("conversation_messages.id"))
    ai_source_group_id: Mapped[str] = mapped_column(String(255))
    question_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class SourceRef(Base):
    __tablename__ = "conversation_source_refs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_group_id: Mapped[str] = mapped_column(
        ForeignKey("conversation_source_groups.id"), index=True
    )
    ai_chunk_id: Mapped[str] = mapped_column(String(255), index=True)
    rank: Mapped[int] = mapped_column(Integer, default=1)
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    access_status: Mapped[str] = mapped_column(String(30), default="AVAILABLE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class RetrievalGraphRef(Base):
    __tablename__ = "conversation_retrieval_graph_refs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    assistant_message_id: Mapped[str] = mapped_column(
        ForeignKey("conversation_messages.id"), index=True
    )
    ai_graph_id: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ProcessingJob(Base):
    __tablename__ = "workflow_processing_jobs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    document_file_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ai_job_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_type: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(40), default="QUEUED")
    current_step: Mapped[str | None] = mapped_column(String(100), nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    requested_by: Mapped[str] = mapped_column(ForeignKey("auth_users.id"))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class ReindexJob(Base):
    __tablename__ = "workflow_reindex_jobs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    requested_by: Mapped[str] = mapped_column(ForeignKey("auth_users.id"))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="QUEUED")
    total_documents: Mapped[int] = mapped_column(Integer, default=0)
    completed_documents: Mapped[int] = mapped_column(Integer, default=0)
    failed_documents: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ReindexJobDocument(Base):
    __tablename__ = "workflow_reindex_job_documents"
    job_id: Mapped[str] = mapped_column(ForeignKey("workflow_reindex_jobs.id"), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), primary_key=True)
    ai_job_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="QUEUED")
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MetadataReview(Base):
    __tablename__ = "workflow_metadata_reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    document_version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("auth_users.id"))
    status: Mapped[str] = mapped_column(String(30))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class RelationReview(Base):
    __tablename__ = "workflow_relation_reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    ai_relation_ref_id: Mapped[str] = mapped_column(ForeignKey("ai_ref_relations.id"), index=True)
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("auth_users.id"))
    decision: Mapped[str] = mapped_column(String(30))
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ImpactAnalysis(Base):
    __tablename__ = "workflow_impact_analyses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    target_document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    ai_analysis_id: Mapped[str] = mapped_column(String(255), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="PENDING_REVIEW")
    effect_count: Mapped[int] = mapped_column(Integer, default=0)
    approved_effect_count: Mapped[int] = mapped_column(Integer, default=0)
    requested_by: Mapped[str] = mapped_column(ForeignKey("auth_users.id"))
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    request_id: Mapped[str] = mapped_column(String(36), index=True)
    actor_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(100))
    resource_type: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    result: Mapped[str] = mapped_column(String(30))
    before_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    after_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(80), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
