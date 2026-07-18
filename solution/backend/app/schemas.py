from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    email: str | None = None
    full_name: str
    status: str
    role: str
    must_change_password: bool = False


class LoginRequest(BaseModel):
    username: str
    password: str = Field(min_length=1)


class CustomerRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    email: str | None = None
    full_name: str = Field(min_length=1, max_length=255)


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    document_code: str
    title: str
    document_type: str
    issuing_unit: str | None = None
    business_domain: str | None = None
    access_scope: str
    effective_status: str
    processing_status: str
    index_status: str
    created_at: datetime
    updated_at: datetime


class DocumentCreate(BaseModel):
    document_code: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=500)
    document_type: str = Field(min_length=1, max_length=100)
    issuing_unit: str | None = None
    business_domain: str | None = None
    application_scope: str | None = None
    access_scope: str = "INTERNAL"
    effective_status: str = "FUTURE_EFFECTIVE"
    issued_at: datetime | None = None
    effective_from: datetime | None = None
    effective_to: datetime | None = None
    keywords: list[str] = Field(default_factory=list)


class DocumentUpdate(BaseModel):
    title: str | None = None
    document_type: str | None = None
    issuing_unit: str | None = None
    business_domain: str | None = None
    application_scope: str | None = None
    access_scope: str | None = None
    effective_status: str | None = None
    effective_to: datetime | None = None


class ConversationCreate(BaseModel):
    title: str = "Cuộc trò chuyện mới"
    scope: str = "PUBLIC"


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    scope: str
    status: str
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    conversation_id: str
    role: str
    content: str
    status: str
    created_at: datetime


class FeedbackCreate(BaseModel):
    feedback_type: str
    comment: str | None = None


class ReindexRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class BulkReindexRequest(ReindexRequest):
    document_ids: list[str] = Field(min_length=1)


class ExpireRequest(BaseModel):
    effective_to: datetime
    reason: str = Field(min_length=1, max_length=1000)


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=120)
    email: str | None = None
    password: str = Field(default="vaic@2026", min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    role: str
    department_id: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    role: str | None = None
    status: str | None = None


class PasswordResetRequest(BaseModel):
    password: str = Field(default="vaic@2026", min_length=8, max_length=128)


class SourceRefOut(BaseModel):
    id: str
    ai_chunk_id: str
    rank: int
    relevance_score: float | None
    access_status: str


class SourceGroupOut(BaseModel):
    id: str
    ai_source_group_id: str
    question: str | None
    chunks: list[SourceRefOut]
