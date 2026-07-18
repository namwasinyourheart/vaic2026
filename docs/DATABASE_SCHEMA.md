# Backend database schema

PostgreSQL là database triển khai, dùng SQLAlchemy/Alembic; SQLite chỉ là backend test. Tất cả ID là UUID string (`VARCHAR(36)`), thời gian là `DATETIME` UTC, text dài là `TEXT`.

> Không bảng nào dưới đây chứa parsed document text, chunk text, embedding hoặc graph node/edge.

## Auth

### `auth_users`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | VARCHAR(36) | PK | User ID |
| username | VARCHAR(100) | UNIQUE, INDEX, NOT NULL | Tên đăng nhập lowercase |
| email | VARCHAR(255) | UNIQUE, NULL | Email tùy chọn; nhiều NULL được phép |
| password_hash | TEXT | NOT NULL | Bcrypt hash |
| full_name | VARCHAR(255) | NOT NULL | Họ tên |
| status | VARCHAR(30) | INDEX, default ACTIVE | ACTIVE/LOCKED |
| department_id | VARCHAR(36) | NULL | Phòng ban |
| last_login_at | DATETIME | NULL | Lần login gần nhất |
| created_at/updated_at | DATETIME | NOT NULL | Audit thời gian |
| deleted_at | DATETIME | NULL | Soft delete |

### `auth_roles`

`id` PK, `code` VARCHAR(50) UNIQUE (`customer`, `bank_employee`, `knowledge_manager`, `system_admin`), `name` VARCHAR(100), `description` TEXT NULL.

### `auth_permissions`

`id` PK, `code` VARCHAR(100) UNIQUE, `name` VARCHAR(150), `resource` VARCHAR(80), `action` VARCHAR(80). Ví dụ: `document.upload`, `document.reindex`, `audit_log.read`.

### `auth_user_roles`

`user_id` PK/FK → users, `role_id` PK/FK → roles, `assigned_by` NULL, `assigned_at`. Có unique constraint trên `user_id`, nên một user chỉ có một role.

### `auth_role_permissions`

`role_id` PK/FK, `permission_id` PK/FK, `granted_by`, `granted_at`. Một role có nhiều permission.

### `auth_sessions`

`id` PK, `user_id` FK/index, `refresh_token_hash` TEXT UNIQUE/index, `device_info`, `ip_address`, `expires_at`, `revoked_at`, `created_at`, `last_used_at`. Chỉ hash refresh token được lưu.

## Knowledge/document

### `knowledge_documents`

`id`, `document_code` UNIQUE/index, `title`, `document_type`, `issuing_unit`, `business_domain`, `application_scope`, `access_scope` (PUBLIC/INTERNAL), `issued_at`, `effective_from`, `effective_to`, `effective_status`, `lifecycle_status`, `processing_status`, `index_status`, `current_version_id`, `owner_user_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`.

### `knowledge_document_versions`

`id`, `document_id` FK/index, `version_number`, `version_label`, `effective_from`, `effective_to`, `status`, `change_summary`, `change_document_code`, `created_by`, `created_at`.

### `knowledge_document_files`

`id`, `document_id` FK/index, `version_id`, `original_file_name`, `storage_provider`, `storage_bucket`, `storage_key` UNIQUE, `mime_type`, `file_extension`, `file_size`, `checksum_sha256`, `uploaded_by`, `uploaded_at`, `is_current`, `deleted_at`. Binary nằm storage adapter, không nằm SQLite.

### `knowledge_document_keywords`

Composite PK `(document_id, keyword)`, `created_at`; phục vụ lọc/tìm metadata.

### `knowledge_document_access`

`id`, `document_id`, `subject_type`, `subject_id`, `access_level`, `granted_by`, `created_at`, `expires_at`; cấp quyền chi tiết khi cần.

## AI references

### `ai_ref_documents`

`id`, `document_id` UNIQUE, `ai_document_id` UNIQUE, `ai_collection`, `sync_status`, `last_synced_at`, `last_sync_error`, `created_at`, `updated_at`.

### `ai_ref_versions`

`id`, `document_version_id` UNIQUE, `ai_version_id` UNIQUE, `sync_status`, `created_at`, `updated_at`.

### `ai_ref_relations`

`id`, `source_document_id`, `target_document_id`, `ai_relation_id`, `relation_type`, `sync_status`, `created_by`, `created_at`, `updated_at`.

### `ai_ref_chunks`

`id`, `document_id`, `ai_chunk_id` UNIQUE, `created_at`. Chỉ ID, không có content.

### `ai_ref_jobs`

`id`, `job_id` UNIQUE, `ai_job_id`, `status`, `created_at`.

## Conversation

### `conversation_conversations`

`id`, `owner_user_id` FK/index, `title`, `scope`, `status`, `created_at`, `updated_at`, `deleted_at`.

### `conversation_messages`

`id`, `conversation_id` FK/index, `parent_message_id`, `role`, `content`, `status`, `ai_request_id`, `created_at`, `completed_at`, `error_code`. Chỉ lưu câu hỏi/câu trả lời, không lưu source text.

### `conversation_message_feedback`

`id`, `message_id`, `user_id`, `feedback_type`, `comment`, `created_at`.

### `conversation_source_groups`

`id`, `conversation_id`, `user_message_id`, `assistant_message_id`, `ai_source_group_id`, `question_snapshot`, `chunk_count`, `created_at`.

### `conversation_source_refs`

`id`, `source_group_id`, `ai_chunk_id`, `rank`, `relevance_score`, `access_status`, `created_at`. Không có `chunk_content`, `snippet_text`, `full_text`.

### `conversation_retrieval_graph_refs`

`id`, `assistant_message_id`, `ai_graph_id`, `created_at`.

## Workflow

### `workflow_processing_jobs`

`id`, `document_id`, `document_file_id`, `ai_job_id`, `job_type`, `status`, `current_step`, `progress_percent`, `requested_by`, `started_at`, `completed_at`, `error_code`, `error_message`, `created_at`, `updated_at`.

### `workflow_reindex_jobs`

`id`, `requested_by`, `reason`, `status`, `total_documents`, `completed_documents`, `failed_documents`, `started_at`, `completed_at`, `created_at`.

### `workflow_reindex_job_documents`

Composite PK `(job_id, document_id)`, `ai_job_id`, `status`, `error_code`, `created_at`, `completed_at`.

### `workflow_metadata_reviews`

`id`, `document_id`, `document_version_id`, `reviewer_id`, `status`, `note`, `reviewed_at`, `created_at`.

## Audit

### `audit_logs`

`id`, `request_id`, `actor_user_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `result`, `before_json`, `after_json`, `error_code`, `error_message`, `ip_address`, `user_agent`, `created_at`.

Audit không được chứa password, file binary, parsed text, source/chunk text hoặc embedding.

## Index/relationship chính

- User: username/email unique; user-role unique theo `user_id`.
- Document: document code unique; storage key unique; AI document/version/chunk IDs unique.
- Conversation/message/source: FK theo ownership; endpoint luôn kiểm tra `owner_user_id`.
- Session: refresh hash unique để rotation/revoke chính xác.

## Schema cần bổ sung cho relation/conflict review

Các bảng dưới đây chưa có trong model hiện tại, nhưng cần có để Backend quản lý workflow duyệt mà vẫn không lưu AI content.

### `ai_ref_clauses`

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| id | VARCHAR(36) PK | Backend ref ID |
| document_id | VARCHAR(36) FK | Document Backend |
| document_version_id | VARCHAR(36) NULL | Version Backend |
| ai_clause_id | VARCHAR(255) UNIQUE | Clause ID AI |
| clause_path | VARCHAR(500) NULL | Đường dẫn ngắn; không phải content |
| effective_status | VARCHAR(40) | Trạng thái hiệu lực đồng bộ |
| sync_status | VARCHAR(40) | PENDING/SYNCED/FAILED |
| created_at/updated_at | DATETIME | Audit time |

### `ai_ref_conflicts`

`id`, `left_document_id`, `right_document_id`, `ai_conflict_id` UNIQUE, `conflict_type`, `severity`, `review_status`, `resolution_status`, `preferred_ai_clause_id`, `sync_status`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`. Không lưu evidence text.

### `workflow_relation_reviews`

`id`, `ai_relation_ref_id`, `reviewer_id`, `decision`, `reason`, `before_type`, `after_type`, `reviewed_at`, `created_at`.

### `workflow_conflict_reviews`

`id`, `ai_conflict_ref_id`, `reviewer_id`, `decision`, `resolution_status`, `preferred_ai_clause_id`, `reason`, `reviewed_at`, `created_at`.

### `workflow_impact_analyses`

`id`, `source_document_id`, `target_document_id`, `ai_analysis_id` UNIQUE, `status`, `effect_count`, `approved_effect_count`, `requested_by`, `reviewed_by`, `created_at`, `completed_at`, `reviewed_at`, `error_code`, `error_message`.

### `workflow_metadata_suggestions`

`id`, `document_id`, `ai_suggestion_id`, `field_name`, `suggested_value_json`, `confidence`, `review_status`, `reviewed_by`, `reviewed_at`, `created_at`. Không lưu parsed document body.

Việc thêm các bảng này phải đi kèm Alembic migration riêng; không sửa migration đã áp dụng.
