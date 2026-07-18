# Backend Database Schema

Database production là PostgreSQL, quản lý bằng SQLAlchemy/Alembic. SQLite chỉ dùng cho test. Các cột thời gian dùng `TIMESTAMP WITH TIME ZONE` trên PostgreSQL (`DateTime(timezone=True)` trong model); ID hiện lưu UUID dưới dạng `VARCHAR(36)`. Nội dung parsed document, clause/chunk text, embedding, vector index và graph node/edge không được lưu trong Backend.

## 1. Auth

### `auth_users`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Định danh user |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE, INDEX | Tên đăng nhập, chuẩn hóa lowercase |
| `email` | VARCHAR(255) | NULL, UNIQUE, INDEX | Email tùy chọn; PostgreSQL cho phép nhiều NULL |
| `password_hash` | TEXT | NOT NULL | Bcrypt hash, không lưu plain text/MD5 |
| `full_name` | VARCHAR(255) | NOT NULL | Họ tên hiển thị |
| `status` | VARCHAR(30) | NOT NULL, INDEX, default `ACTIVE` | `ACTIVE`, `LOCKED` |
| `department_id` | VARCHAR(36) | NULL | Phòng ban của nhân viên |
| `last_login_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm đăng nhập gần nhất |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |
| `deleted_at` | TIMESTAMP WITH TIME ZONE | NULL | Soft delete |

### `auth_roles`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Role ID |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | `customer`, `bank_employee`, `knowledge_manager`, `system_admin` |
| `name` | VARCHAR(100) | NOT NULL | Tên role |
| `description` | TEXT | NULL | Mô tả role |

### `auth_permissions`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Permission ID |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | Mã dạng `resource.action` |
| `name` | VARCHAR(150) | NOT NULL | Tên hiển thị |
| `resource` | VARCHAR(80) | NOT NULL | Tài nguyên được bảo vệ |
| `action` | VARCHAR(80) | NOT NULL | Hành động được phép |

### `auth_user_roles`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `user_id` | VARCHAR(36) | PK, FK → `auth_users.id`, UNIQUE | User; unique để mỗi user chỉ có một role |
| `role_id` | VARCHAR(36) | PK, FK → `auth_roles.id` | Role duy nhất hiện tại |
| `assigned_by` | VARCHAR(36) | NULL | Admin gán role |
| `assigned_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm gán |

### `auth_role_permissions`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `role_id` | VARCHAR(36) | PK, FK → `auth_roles.id` | Role |
| `permission_id` | VARCHAR(36) | PK, FK → `auth_permissions.id` | Permission được cấp |
| `granted_by` | VARCHAR(36) | NULL | Người cấp |
| `granted_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cấp |

### `auth_sessions`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Session ID |
| `user_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Chủ session |
| `refresh_token_hash` | TEXT | NOT NULL, UNIQUE, INDEX | SHA-256 hash của refresh token |
| `device_info` | TEXT | NULL | Thông tin thiết bị |
| `ip_address` | VARCHAR(80) | NULL | IP đăng nhập |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Hạn refresh token |
| `revoked_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm revoke/rotation |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `last_used_at` | TIMESTAMP WITH TIME ZONE | NULL | Lần dùng gần nhất |

## 2. Knowledge và tài liệu

### `knowledge_documents`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Document ID |
| `document_code` | VARCHAR(120) | NOT NULL, UNIQUE, INDEX | Số hiệu văn bản |
| `title` | VARCHAR(500) | NOT NULL | Tên văn bản |
| `document_type` | VARCHAR(100) | NOT NULL | Loại văn bản |
| `issuing_unit` | VARCHAR(255) | NULL | Đơn vị ban hành |
| `business_domain` | VARCHAR(255) | NULL | Lĩnh vực nghiệp vụ |
| `application_scope` | TEXT | NULL | Phạm vi áp dụng |
| `access_scope` | VARCHAR(30) | NOT NULL, default `INTERNAL` | `PUBLIC` hoặc `INTERNAL` |
| `issued_at` | TIMESTAMP WITH TIME ZONE | NULL | Ngày ban hành |
| `effective_from` | TIMESTAMP WITH TIME ZONE | NULL | Bắt đầu hiệu lực |
| `effective_to` | TIMESTAMP WITH TIME ZONE | NULL | Hết hiệu lực |
| `effective_status` | VARCHAR(40) | NOT NULL | Trạng thái hiệu lực |
| `lifecycle_status` | VARCHAR(40) | NOT NULL | Vòng đời tài liệu |
| `processing_status` | VARCHAR(40) | NOT NULL | Trạng thái OCR/ingestion |
| `index_status` | VARCHAR(40) | NOT NULL | Trạng thái index AI |
| `current_version_id` | VARCHAR(36) | NULL | Version hiện hành |
| `owner_user_id` | VARCHAR(36) | NULL | Người phụ trách |
| `created_by` | VARCHAR(36) | NOT NULL | Người tạo |
| `updated_by` | VARCHAR(36) | NOT NULL | Người cập nhật |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |
| `deleted_at` | TIMESTAMP WITH TIME ZONE | NULL | Soft delete |

### `knowledge_document_versions`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Version ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK → documents, INDEX | Tài liệu gốc |
| `version_number` | INTEGER | NOT NULL | Số thứ tự version |
| `version_label` | VARCHAR(100) | NOT NULL | Nhãn version |
| `effective_from` | TIMESTAMP WITH TIME ZONE | NULL | Ngày bắt đầu hiệu lực |
| `effective_to` | TIMESTAMP WITH TIME ZONE | NULL | Ngày kết thúc hiệu lực |
| `status` | VARCHAR(40) | NOT NULL | Trạng thái version |
| `change_summary` | TEXT | NULL | Tóm tắt thay đổi, không phải parsed content |
| `change_document_code` | VARCHAR(120) | NULL | Văn bản làm thay đổi |
| `created_by` | VARCHAR(36) | NOT NULL | Người tạo version |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `knowledge_document_files`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | File record ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Tài liệu |
| `version_id` | VARCHAR(36) | NULL | Version của file |
| `original_file_name` | VARCHAR(500) | NOT NULL | Tên file người dùng upload |
| `storage_provider` | VARCHAR(30) | NOT NULL, default `local` | `local` hoặc `r2` |
| `storage_bucket` | VARCHAR(255) | NULL | R2 bucket, không trả trực tiếp cho FE |
| `storage_key` | TEXT | NOT NULL, UNIQUE | Key truy cập adapter; không phải binary |
| `mime_type` | VARCHAR(150) | NOT NULL | MIME đã validate |
| `file_extension` | VARCHAR(20) | NOT NULL | Phần mở rộng |
| `file_size` | INTEGER | NOT NULL | Kích thước byte |
| `checksum_sha256` | VARCHAR(64) | NOT NULL | Kiểm tra toàn vẹn |
| `uploaded_by` | VARCHAR(36) | NOT NULL | Người upload |
| `uploaded_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm upload |
| `is_current` | BOOLEAN | NOT NULL, default TRUE | File hiện hành của version |
| `deleted_at` | TIMESTAMP WITH TIME ZONE | NULL | Soft delete |

### `knowledge_document_keywords`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `document_id` | VARCHAR(36) | PK, FK → documents | Tài liệu |
| `keyword` | VARCHAR(150) | PK | Từ khóa; cùng document không trùng |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm thêm |

### `knowledge_document_access`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | ACL record ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Tài liệu được cấp quyền |
| `subject_type` | VARCHAR(30) | NOT NULL | Loại subject: user/role/department |
| `subject_id` | VARCHAR(100) | NOT NULL, INDEX | ID subject |
| `access_level` | VARCHAR(30) | NOT NULL | Mức truy cập |
| `granted_by` | VARCHAR(36) | NOT NULL | Người cấp |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cấp |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NULL | Hạn ACL |

## 3. AI reference (chỉ ID và trạng thái)

### `ai_ref_documents`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Backend reference ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK, UNIQUE | Document Backend |
| `ai_document_id` | VARCHAR(255) | NOT NULL, UNIQUE | Document ID tại AI |
| `ai_collection` | VARCHAR(255) | NULL | Collection/index AI |
| `sync_status` | VARCHAR(40) | NOT NULL | PENDING/SYNCED/FAILED |
| `last_synced_at` | TIMESTAMP WITH TIME ZONE | NULL | Lần sync cuối |
| `last_sync_error` | TEXT | NULL | Lỗi sync, không chứa source text |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |

### `ai_ref_versions`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Reference ID |
| `document_version_id` | VARCHAR(36) | NOT NULL, FK, UNIQUE | Version Backend |
| `ai_version_id` | VARCHAR(255) | NOT NULL, UNIQUE | Version ID tại AI |
| `sync_status` | VARCHAR(40) | NOT NULL | Trạng thái đồng bộ |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |

### `ai_ref_relations`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Relation reference ID |
| `source_document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Document nguồn |
| `target_document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Document đích |
| `ai_relation_id` | VARCHAR(255) | NULL | Relation ID tại AI |
| `relation_type` | VARCHAR(50) | NOT NULL | REFERENCES/AMENDS/REPLACES/... |
| `sync_status` | VARCHAR(40) | NOT NULL | Trạng thái đồng bộ |
| `created_by` | VARCHAR(36) | NOT NULL | Người tạo |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |

### `ai_ref_chunks`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Reference ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Document sở hữu chunk |
| `ai_chunk_id` | VARCHAR(255) | NOT NULL, UNIQUE | Chunk ID tại AI; không lưu content |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `ai_ref_jobs`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Reference ID |
| `job_id` | VARCHAR(36) | NOT NULL, UNIQUE | Workflow job Backend |
| `ai_job_id` | VARCHAR(255) | NULL | Job ID tại AI |
| `status` | VARCHAR(40) | NOT NULL | QUEUED/PROCESSING/COMPLETED/FAILED |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `ai_ref_clauses`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Reference ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Document sở hữu clause |
| `document_version_id` | VARCHAR(36) | NULL | Version sở hữu clause |
| `ai_clause_id` | VARCHAR(255) | NOT NULL, UNIQUE, INDEX | Clause ID tại AI |
| `clause_path` | VARCHAR(500) | NULL | Đường dẫn Điều/Khoản, không phải nội dung |
| `effective_status` | VARCHAR(40) | NOT NULL | Trạng thái hiệu lực |
| `sync_status` | VARCHAR(40) | NOT NULL | Trạng thái đồng bộ |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |

### `ai_ref_conflicts`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Conflict reference ID |
| `left_document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Document bên trái |
| `right_document_id` | VARCHAR(36) | NULL | Document bên phải |
| `ai_conflict_id` | VARCHAR(255) | NOT NULL, UNIQUE | Conflict ID tại AI |
| `conflict_type` | VARCHAR(60) | NOT NULL | Loại xung đột |
| `severity` | VARCHAR(20) | NOT NULL, default MEDIUM | Mức độ |
| `review_status` | VARCHAR(30) | NOT NULL, default PENDING_REVIEW | Trạng thái review |
| `resolution_status` | VARCHAR(30) | NOT NULL, default UNRESOLVED | Trạng thái xử lý |
| `preferred_ai_clause_id` | VARCHAR(255) | NULL | Clause được ưu tiên |
| `sync_status` | VARCHAR(40) | NOT NULL, default SYNCED | Đồng bộ AI |
| `reviewed_by` | VARCHAR(36) | NULL | Người review |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm review |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |

## 4. Conversation

### `conversation_conversations`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Conversation ID |
| `owner_user_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Chủ hội thoại |
| `title` | VARCHAR(500) | NOT NULL, default | Tên hội thoại |
| `scope` | VARCHAR(30) | NOT NULL, default PUBLIC | PUBLIC hoặc INTERNAL |
| `status` | VARCHAR(30) | NOT NULL, default ACTIVE | Trạng thái hội thoại |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |
| `deleted_at` | TIMESTAMP WITH TIME ZONE | NULL | Soft delete |

### `conversation_messages`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Message ID |
| `conversation_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Hội thoại |
| `parent_message_id` | VARCHAR(36) | NULL | Message cha khi cần thread |
| `role` | VARCHAR(20) | NOT NULL | user hoặc assistant |
| `content` | TEXT | NOT NULL | Câu hỏi/câu trả lời; không phải source text |
| `status` | VARCHAR(30) | NOT NULL, default COMPLETED | Trạng thái xử lý |
| `ai_request_id` | VARCHAR(255) | NULL | Request ID tại AI |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm hoàn tất |
| `error_code` | VARCHAR(100) | NULL | Mã lỗi nếu thất bại |

### `conversation_message_feedback`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Feedback ID |
| `message_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Message được đánh giá |
| `user_id` | VARCHAR(36) | NOT NULL, FK | Người đánh giá |
| `feedback_type` | VARCHAR(30) | NOT NULL | Loại feedback |
| `comment` | TEXT | NULL | Nhận xét |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `conversation_source_groups`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Group reference ID |
| `conversation_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Hội thoại account |
| `user_message_id` | VARCHAR(36) | NOT NULL, FK | Câu hỏi tương ứng |
| `assistant_message_id` | VARCHAR(36) | NOT NULL, FK | Câu trả lời tương ứng |
| `ai_source_group_id` | VARCHAR(255) | NOT NULL | Source group ID tại AI |
| `question_snapshot` | TEXT | NULL | Snapshot câu hỏi để hiển thị/tra cứu |
| `chunk_count` | INTEGER | NOT NULL, default 0 | Số chunk tham chiếu |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `conversation_source_refs`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Source ref ID |
| `source_group_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Source group |
| `ai_chunk_id` | VARCHAR(255) | NOT NULL, INDEX | Chunk ID tại AI |
| `rank` | INTEGER | NOT NULL, default 1 | Thứ hạng retrieval |
| `relevance_score` | FLOAT | NULL | Điểm liên quan |
| `access_status` | VARCHAR(30) | NOT NULL, default AVAILABLE | Khả năng lấy source |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `conversation_retrieval_graph_refs`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Graph ref ID |
| `assistant_message_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Câu trả lời chứa graph |
| `ai_graph_id` | VARCHAR(255) | NOT NULL | Graph ID tại AI |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

Guest không tạo các bảng conversation/source trên; lịch sử Guest chỉ nằm trong `localStorage` của trình duyệt.

## 5. Workflow

### `workflow_processing_jobs`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Processing job ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Tài liệu xử lý |
| `document_file_id` | VARCHAR(36) | NULL | File đầu vào |
| `ai_job_id` | VARCHAR(255) | NULL | Job ID tại AI |
| `job_type` | VARCHAR(50) | NOT NULL | INGEST/REINDEX/... |
| `status` | VARCHAR(40) | NOT NULL, default QUEUED | Trạng thái job |
| `current_step` | VARCHAR(100) | NULL | Bước hiện tại |
| `progress_percent` | INTEGER | NOT NULL, default 0 | Tiến độ 0–100 |
| `requested_by` | VARCHAR(36) | NOT NULL, FK | Người yêu cầu |
| `started_at` | TIMESTAMP WITH TIME ZONE | NULL | Bắt đầu xử lý |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Hoàn tất |
| `error_code` | VARCHAR(100) | NULL | Mã lỗi |
| `error_message` | TEXT | NULL | Mô tả lỗi, không chứa source text |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm cập nhật |

### `workflow_reindex_jobs`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Batch re-index ID |
| `requested_by` | VARCHAR(36) | NOT NULL, FK | Người yêu cầu |
| `reason` | TEXT | NOT NULL | Lý do re-index |
| `status` | VARCHAR(40) | NOT NULL, default QUEUED | Trạng thái batch |
| `total_documents` | INTEGER | NOT NULL, default 0 | Tổng số tài liệu |
| `completed_documents` | INTEGER | NOT NULL, default 0 | Đã hoàn thành |
| `failed_documents` | INTEGER | NOT NULL, default 0 | Bị lỗi |
| `started_at` | TIMESTAMP WITH TIME ZONE | NULL | Bắt đầu |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Hoàn tất |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `workflow_reindex_job_documents`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `job_id` | VARCHAR(36) | PK, FK → reindex_jobs | Batch job |
| `document_id` | VARCHAR(36) | PK, FK → documents | Tài liệu trong batch |
| `ai_job_id` | VARCHAR(255) | NULL | Job tương ứng tại AI |
| `status` | VARCHAR(40) | NOT NULL, default QUEUED | Trạng thái tài liệu |
| `error_code` | VARCHAR(100) | NULL | Mã lỗi |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm thêm |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm hoàn tất |

### `workflow_metadata_reviews`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Review ID |
| `document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Tài liệu |
| `document_version_id` | VARCHAR(36) | NULL | Version được review |
| `reviewer_id` | VARCHAR(36) | NOT NULL, FK | Người review |
| `status` | VARCHAR(30) | NOT NULL | PENDING/APPROVED/REJECTED |
| `note` | TEXT | NULL | Ghi chú |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm review |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `workflow_relation_reviews`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Relation review ID |
| `ai_relation_ref_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Relation cần review |
| `reviewer_id` | VARCHAR(36) | NOT NULL, FK | Người review |
| `decision` | VARCHAR(30) | NOT NULL | APPROVED/REJECTED/CORRECTED |
| `reason` | TEXT | NULL | Lý do |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm review |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `workflow_impact_analyses`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Impact analysis ID |
| `source_document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Document thay đổi |
| `target_document_id` | VARCHAR(36) | NOT NULL, FK, INDEX | Document bị ảnh hưởng |
| `ai_analysis_id` | VARCHAR(255) | NOT NULL, UNIQUE | Analysis ID tại AI |
| `status` | VARCHAR(30) | NOT NULL, default PENDING_REVIEW | Trạng thái review |
| `effect_count` | INTEGER | NOT NULL, default 0 | Tổng effect |
| `approved_effect_count` | INTEGER | NOT NULL, default 0 | Effect đã duyệt |
| `requested_by` | VARCHAR(36) | NOT NULL, FK | Người yêu cầu |
| `reviewed_by` | VARCHAR(36) | NULL | Người review |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | AI hoàn tất |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | NULL | Review hoàn tất |

## 6. Audit

### `audit_logs`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Audit ID |
| `request_id` | VARCHAR(36) | NOT NULL, INDEX | Correlation/request ID |
| `actor_user_id` | VARCHAR(36) | NULL | User thực hiện; Guest có thể NULL |
| `actor_role` | VARCHAR(50) | NULL | Role tại thời điểm action |
| `action` | VARCHAR(100) | NOT NULL | API/action được thực hiện |
| `resource_type` | VARCHAR(100) | NOT NULL | Loại resource |
| `resource_id` | VARCHAR(36) | NULL | Resource liên quan |
| `result` | VARCHAR(30) | NOT NULL | SUCCESS/FAILED |
| `before_json` | JSON/JSONB | NULL | Snapshot trước thay đổi, không chứa text nhạy cảm |
| `after_json` | JSON/JSONB | NULL | Snapshot sau thay đổi, không chứa text nhạy cảm |
| `error_code` | VARCHAR(100) | NULL | Mã lỗi |
| `error_message` | TEXT | NULL | Lỗi chuẩn hóa |
| `ip_address` | VARCHAR(80) | NULL | IP request |
| `user_agent` | TEXT | NULL | User agent |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm ghi audit |

## 7. Bảng chưa triển khai

Các bảng sau chưa có trong SQLAlchemy model/migration hiện tại; nếu bổ sung phải tạo Alembic migration mới.

### `workflow_conflict_reviews`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Review ID |
| `ai_conflict_ref_id` | VARCHAR(36) | FK | Conflict cần review |
| `reviewer_id` | VARCHAR(36) | FK | Người review |
| `decision` | VARCHAR(30) | NOT NULL | APPROVED/REJECTED |
| `resolution_status` | VARCHAR(30) | NOT NULL | Trạng thái xử lý |
| `preferred_ai_clause_id` | VARCHAR(255) | NULL | Clause ưu tiên |
| `reason` | TEXT | NULL | Lý do |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm review |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

### `workflow_metadata_suggestions`

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | VARCHAR(36) | PK | Suggestion ID |
| `document_id` | VARCHAR(36) | FK | Tài liệu |
| `ai_suggestion_id` | VARCHAR(255) | UNIQUE | Suggestion ID AI |
| `field_name` | VARCHAR(100) | NOT NULL | Metadata field được gợi ý |
| `suggested_value_json` | JSON/JSONB | NOT NULL | Giá trị metadata, không chứa parsed body |
| `confidence` | FLOAT | NULL | Độ tin cậy |
| `review_status` | VARCHAR(30) | NOT NULL | PENDING/APPROVED/REJECTED |
| `reviewed_by` | VARCHAR(36) | NULL | Người review |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | NULL | Thời điểm review |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Thời điểm tạo |

## 8. Quy tắc dữ liệu

- Guest không tạo record trong các bảng `conversation_*`; lịch sử nằm tại browser `localStorage`.
- Backend chỉ lưu message account, metadata tài liệu, file reference, workflow và external ID AI.
- Không lưu password plain text/MD5, binary file, parsed text, source/chunk content, embedding hoặc graph content.
- File download luôn qua Backend để kiểm tra permission và ghi audit; `storage_key` không trả trực tiếp cho Frontend.
