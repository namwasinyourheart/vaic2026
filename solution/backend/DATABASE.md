# Mô tả cơ sở dữ liệu Backend

## 1. Tổng quan

Backend hiện dùng SQLite qua SQLAlchemy 2.x và Alembic. Cơ sở dữ liệu quản lý:

- tài khoản, phiên đăng nhập, vai trò và quyền;
- metadata, phiên bản và vị trí lưu file gốc của tài liệu;
- hội thoại và nội dung câu hỏi/câu trả lời;
- ID tham chiếu sang AI/RAG Service;
- trạng thái ingestion, re-index, review metadata;
- nhật ký audit.

SQLite không hỗ trợ database schema như PostgreSQL nên tên bảng dùng prefix:

| Prefix | Miền dữ liệu |
|---|---|
| `auth_` | Xác thực và phân quyền |
| `knowledge_` | Tài liệu và metadata |
| `ai_ref_` | ID tham chiếu tới AI Service |
| `conversation_` | Hội thoại, message, source reference |
| `workflow_` | Ingestion, re-index và review |
| `audit_` | Nhật ký hệ thống |

ID nghiệp vụ dùng UUID dạng chuỗi 36 ký tự. Thời gian được thiết kế theo UTC.

## 2. Ranh giới dữ liệu Backend và AI Service

### Backend lưu

- File gốc thông qua `StorageService`; database chỉ lưu `storage_key` và metadata file.
- Metadata tài liệu, hiệu lực, phiên bản và quyền truy cập.
- Nội dung câu hỏi và câu trả lời trong hội thoại.
- ID của source group, chunk, retrieval graph, AI document và AI job.
- Trạng thái đồng bộ, ingestion, re-index và audit.

### Backend không lưu

- Nội dung tài liệu đã parse hoặc OCR.
- Clause/chunk content, source text hay snippet text.
- Embedding hoặc vector index.
- Node/edge và nội dung knowledge graph.
- Binary file trực tiếp trong SQLite.

Khi người dùng mở một source, Backend kiểm tra quyền sở hữu hội thoại rồi dùng `ai_chunk_id` gọi AI Service. Nội dung trả về chỉ được proxy tới Frontend, không ghi vào SQLite.

## 3. Nhóm xác thực và phân quyền

### `auth_users`

Thông tin tài khoản người dùng.

| Cột | Kiểu | Ràng buộc/ý nghĩa |
|---|---|---|
| `id` | varchar(36) | PK, UUID |
| `username` | varchar(100) | Unique, index |
| `email` | varchar(255) | Unique, index |
| `password_hash` | text | Mật khẩu đã hash, không lưu plain text |
| `full_name` | varchar(255) | Họ tên |
| `status` | varchar(30) | `ACTIVE`, `LOCKED`... |
| `department_id` | varchar(36) | Phòng/ban, hiện chưa có bảng department riêng |
| `last_login_at` | datetime | Đăng nhập gần nhất |
| `created_at`, `updated_at` | datetime | Thời gian tạo/cập nhật |
| `deleted_at` | datetime | Soft delete |

### `auth_roles`

Danh mục bốn vai trò: `ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_COMPLIANCE`, `ROLE_ADMIN`.

Các cột: `id` PK, `code` unique, `name`, `description`.

### `auth_permissions`

Danh mục quyền dạng `resource.action`, ví dụ `document.upload`, `user.lock`.

Các cột: `id` PK, `code` unique, `name`, `resource`, `action`.

### `auth_user_roles`

Bảng nối N-N giữa user và role.

Khóa chính ghép: (`user_id`, `role_id`). Ngoài ra có `assigned_by`, `assigned_at`.

### `auth_role_permissions`

Bảng nối N-N giữa role và permission.

Khóa chính ghép: (`role_id`, `permission_id`). Ngoài ra có `granted_by`, `granted_at`.

### `auth_sessions`

Quản lý refresh token và logout.

| Cột | Ý nghĩa |
|---|---|
| `id` | PK |
| `user_id` | FK → `auth_users.id` |
| `refresh_token_hash` | SHA-256 của refresh token |
| `device_info`, `ip_address` | Thiết bị và IP |
| `expires_at` | Hạn phiên |
| `revoked_at` | Thời điểm logout/revoke |
| `created_at`, `last_used_at` | Thời gian tạo và sử dụng gần nhất |

## 4. Nhóm tài liệu và metadata

### `knowledge_documents`

Bảng nghiệp vụ trung tâm của kho tài liệu.

| Nhóm cột | Các cột |
|---|---|
| Định danh | `id`, `document_code` unique, `title`, `document_type` |
| Phân loại | `issuing_unit`, `business_domain`, `application_scope`, `access_scope` |
| Hiệu lực | `issued_at`, `effective_from`, `effective_to`, `effective_status` |
| Trạng thái | `lifecycle_status`, `processing_status`, `index_status` |
| Liên kết | `current_version_id`, `owner_user_id` |
| Audit nội bộ | `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` |

Giá trị trạng thái thường dùng:

- `effective_status`: `FUTURE_EFFECTIVE`, `EFFECTIVE`, `PARTIALLY_EFFECTIVE`, `EXPIRED`, `SUPERSEDED`;
- `processing_status`: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`;
- `index_status`: `NOT_INDEXED`, `INDEXING`, `INDEXED`, `REINDEX_REQUIRED`, `INDEX_FAILED`;
- `access_scope`: `PUBLIC`, `INTERNAL`.

### `knowledge_document_versions`

Lịch sử phiên bản tài liệu.

Các cột: `id` PK, `document_id` FK, `version_number`, `version_label`, `effective_from`, `effective_to`, `status`, `change_summary`, `change_document_code`, `created_by`, `created_at`.

Quan hệ: một document có nhiều version.

### `knowledge_document_files`

Metadata file gốc; không chứa binary.

| Cột | Ý nghĩa |
|---|---|
| `document_id`, `version_id` | Tài liệu và phiên bản tương ứng |
| `original_file_name` | Tên file người dùng upload |
| `storage_provider` | `local` hoặc `r2` |
| `storage_bucket`, `storage_key` | Vị trí trong storage |
| `mime_type`, `file_extension`, `file_size` | Metadata kỹ thuật |
| `checksum_sha256` | Kiểm tra toàn vẹn/trùng file |
| `uploaded_by`, `uploaded_at` | Người và thời gian upload |
| `is_current` | File hiện hành của tài liệu |
| `deleted_at` | Soft delete |

### `knowledge_document_keywords`

Từ khóa của tài liệu. Khóa chính ghép (`document_id`, `keyword`), kèm `created_at`.

### `knowledge_document_access`

Quyền chi tiết theo user, role hoặc department.

Các cột: `id`, `document_id`, `subject_type`, `subject_id`, `access_level`, `granted_by`, `created_at`, `expires_at`.

## 5. Nhóm tham chiếu AI/RAG

### `ai_ref_documents`

Ánh xạ document Backend sang document AI.

Các cột: `id`, `document_id` unique, `ai_document_id` unique, `ai_collection`, `sync_status`, `last_synced_at`, `last_sync_error`, `created_at`, `updated_at`.

### `ai_ref_versions`

Ánh xạ version Backend sang version AI.

Các cột: `id`, `document_version_id` unique, `ai_version_id` unique, `sync_status`, `created_at`, `updated_at`.

### `ai_ref_relations`

Quan hệ nghiệp vụ giữa hai document và ID quan hệ tương ứng ở AI Service.

Các cột: `id`, `source_document_id`, `target_document_id`, `ai_relation_id`, `relation_type`, `sync_status`, `created_by`, `created_at`, `updated_at`.

### `ai_ref_chunks`

Chỉ lưu ánh xạ `document_id` và `ai_chunk_id`. Không có cột content, snippet hoặc embedding.

### `ai_ref_jobs`

Ánh xạ job Backend sang job AI: `id`, `job_id`, `ai_job_id`, `status`, `created_at`.

## 6. Nhóm hội thoại

### `conversation_conversations`

Thông tin đầu hội thoại: `id`, `owner_user_id` FK, `title`, `scope`, `status`, `created_at`, `updated_at`, `deleted_at`.

Mỗi user chỉ được đọc/sửa/xóa hội thoại thuộc `owner_user_id` của mình.

### `conversation_messages`

Lưu câu hỏi và câu trả lời.

| Cột | Ý nghĩa |
|---|---|
| `id` | PK |
| `conversation_id` | FK → conversation |
| `parent_message_id` | Message cha nếu có |
| `role` | `user` hoặc `assistant` |
| `content` | Nội dung câu hỏi/câu trả lời |
| `status` | Trạng thái xử lý |
| `ai_request_id` | Request ID từ AI Service |
| `created_at`, `completed_at` | Thời gian |
| `error_code` | Mã lỗi nếu thất bại |

### `conversation_message_feedback`

Feedback cho message: `id`, `message_id`, `user_id`, `feedback_type`, `comment`, `created_at`.

### `conversation_source_groups`

Nhóm source của một cặp câu hỏi/câu trả lời.

Các cột: `id`, `conversation_id`, `user_message_id`, `assistant_message_id`, `ai_source_group_id`, `question_snapshot`, `chunk_count`, `created_at`.

`question_snapshot` là câu hỏi của người dùng, không phải nội dung source.

### `conversation_source_refs`

Danh sách chunk ID trong một source group.

Các cột: `id`, `source_group_id`, `ai_chunk_id`, `rank`, `relevance_score`, `access_status`, `created_at`.

Bảng này tuyệt đối không có `chunk_content`, `full_text`, `snippet_text` hoặc `parsed_content`.

### `conversation_retrieval_graph_refs`

Ánh xạ câu trả lời tới graph ở AI Service: `id`, `assistant_message_id`, `ai_graph_id`, `created_at`.

## 7. Nhóm workflow

### `workflow_processing_jobs`

Theo dõi ingestion hoặc re-index đơn lẻ.

Các cột: `id`, `document_id`, `document_file_id`, `ai_job_id`, `job_type`, `status`, `current_step`, `progress_percent`, `requested_by`, `started_at`, `completed_at`, `error_code`, `error_message`, `created_at`, `updated_at`.

### `workflow_reindex_jobs`

Đầu job re-index hàng loạt: `id`, `requested_by`, `reason`, `status`, `total_documents`, `completed_documents`, `failed_documents`, `started_at`, `completed_at`, `created_at`.

### `workflow_reindex_job_documents`

Chi tiết từng document trong job hàng loạt. Khóa chính ghép (`job_id`, `document_id`), cùng `ai_job_id`, `status`, `error_code`, `created_at`, `completed_at`.

### `workflow_metadata_reviews`

Theo dõi việc review metadata: `id`, `document_id`, `document_version_id`, `reviewer_id`, `status`, `note`, `reviewed_at`, `created_at`.

## 8. Audit

### `audit_logs`

Nhật ký request và thay đổi nghiệp vụ.

| Cột | Ý nghĩa |
|---|---|
| `id`, `request_id` | Định danh log/request |
| `actor_user_id`, `actor_role` | Người thực hiện |
| `action` | Hành động hoặc method/path API |
| `resource_type`, `resource_id` | Đối tượng bị tác động |
| `result` | `SUCCESS` hoặc `FAILED` |
| `before_json`, `after_json` | Snapshot metadata trước/sau |
| `error_code`, `error_message` | Thông tin lỗi |
| `ip_address`, `user_agent` | Thông tin request |
| `created_at` | Thời điểm ghi log |

`before_json` và `after_json` không được chứa full document text, source text hoặc chunk content.

## 9. Quan hệ chính

```text
auth_users
├──< auth_user_roles >── auth_roles ──< auth_role_permissions >── auth_permissions
├──< auth_sessions
├──< conversation_conversations ──< conversation_messages
│                                  ├──< conversation_message_feedback
│                                  ├──< conversation_source_groups ──< conversation_source_refs
│                                  └──< conversation_retrieval_graph_refs
└──< workflow jobs / metadata reviews

knowledge_documents
├──< knowledge_document_versions
├──< knowledge_document_files
├──< knowledge_document_keywords
├──< knowledge_document_access
├─── ai_ref_documents
├──< ai_ref_chunks
├──< ai_ref_relations >── knowledge_documents
└──< workflow_processing_jobs / workflow_reindex_job_documents
```

## 10. Lưu ý khi chuyển sang PostgreSQL

- Có thể đổi prefix thành schema thật: `auth`, `knowledge`, `ai_ref`, `conversation`, `workflow`, `audit`.
- Giữ nguyên model nghiệp vụ và chạy migration Alembic.
- Đổi UUID chuỗi sang kiểu `UUID` native nếu cần.
- Bổ sung FK database cho các trường audit như `created_by`, `updated_by`, `owner_user_id` sau khi chốt chính sách soft delete.
- Thêm unique constraint (`document_id`, `version_number`) và index tổng hợp cho các truy vấn audit/source/job lớn.
- File vẫn nằm ở Local/R2 storage; không chuyển binary vào PostgreSQL.

## 11. Data dictionary chi tiết

Quy ước:

- `PK`: primary key; `FK`: foreign key; `UQ`: unique; `IDX`: có index.
- `NULL`: cho phép để trống; `NOT NULL`: bắt buộc có dữ liệu.
- `DATETIME` được thiết kế lưu UTC. Với SQLite, timezone không được đảm bảo mạnh như PostgreSQL.
- Các trường `*_id` không ghi `FK` bên dưới hiện chỉ là liên kết logic trong model, chưa có foreign key constraint tại database.

### 11.1. `auth_users`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID của tài khoản |
| `username` | `VARCHAR(100)` | UQ, IDX, NOT NULL | Tên đăng nhập duy nhất |
| `email` | `VARCHAR(255)` | UQ, IDX, NOT NULL | Email duy nhất |
| `password_hash` | `TEXT` | NOT NULL | Password đã hash bằng bcrypt |
| `full_name` | `VARCHAR(255)` | NOT NULL | Họ và tên hiển thị |
| `status` | `VARCHAR(30)` | IDX, default `ACTIVE` | Trạng thái `ACTIVE`, `LOCKED`... |
| `department_id` | `VARCHAR(36)` | NULL | ID phòng ban; hiện là liên kết logic |
| `last_login_at` | `DATETIME` | NULL | Lần đăng nhập thành công gần nhất |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo tài khoản |
| `updated_at` | `DATETIME` | default UTC now, auto update | Thời điểm cập nhật gần nhất |
| `deleted_at` | `DATETIME` | NULL | Thời điểm soft delete |

### 11.2. `auth_roles`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID vai trò |
| `code` | `VARCHAR(50)` | UQ, NOT NULL | Mã role: `ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_COMPLIANCE`, `ROLE_ADMIN` |
| `name` | `VARCHAR(100)` | NOT NULL | Tên hiển thị của role |
| `description` | `TEXT` | NULL | Mô tả phạm vi role |

### 11.3. `auth_permissions`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID permission |
| `code` | `VARCHAR(100)` | UQ, NOT NULL | Mã quyền dạng `resource.action` |
| `name` | `VARCHAR(150)` | NOT NULL | Tên/mô tả ngắn của quyền |
| `resource` | `VARCHAR(80)` | NOT NULL | Tài nguyên được bảo vệ, ví dụ `document` |
| `action` | `VARCHAR(80)` | NOT NULL | Hành động, ví dụ `upload`, `read` |

### 11.4. `auth_user_roles`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `user_id` | `VARCHAR(36)` | PK, FK → `auth_users.id` | User được gán role |
| `role_id` | `VARCHAR(36)` | PK, FK → `auth_roles.id` | Role được gán |
| `assigned_by` | `VARCHAR(36)` | NULL | ID người thực hiện gán role |
| `assigned_at` | `DATETIME` | default UTC now | Thời điểm gán role |

Khóa chính ghép: (`user_id`, `role_id`).

### 11.5. `auth_role_permissions`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `role_id` | `VARCHAR(36)` | PK, FK → `auth_roles.id` | Role được cấp quyền |
| `permission_id` | `VARCHAR(36)` | PK, FK → `auth_permissions.id` | Permission được cấp |
| `granted_by` | `VARCHAR(36)` | NULL | ID admin cấp quyền |
| `granted_at` | `DATETIME` | default UTC now | Thời điểm cấp quyền |

Khóa chính ghép: (`role_id`, `permission_id`).

### 11.6. `auth_sessions`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID phiên đăng nhập |
| `user_id` | `VARCHAR(36)` | FK → `auth_users.id`, IDX | Chủ sở hữu phiên |
| `refresh_token_hash` | `TEXT` | NOT NULL | SHA-256 của refresh token; không lưu token gốc |
| `device_info` | `TEXT` | NULL | User-Agent/thông tin thiết bị |
| `ip_address` | `VARCHAR(80)` | NULL | IP tạo phiên |
| `expires_at` | `DATETIME` | NOT NULL | Thời điểm refresh token hết hạn |
| `revoked_at` | `DATETIME` | NULL | Thời điểm logout hoặc thu hồi phiên |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo phiên |
| `last_used_at` | `DATETIME` | NULL | Lần refresh token gần nhất |

### 11.7. `knowledge_documents`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID tài liệu |
| `document_code` | `VARCHAR(120)` | UQ, IDX | Số hiệu/mã tài liệu |
| `title` | `VARCHAR(500)` | NOT NULL | Tên tài liệu |
| `document_type` | `VARCHAR(100)` | NOT NULL | Loại văn bản: quy định, quyết định, hướng dẫn... |
| `issuing_unit` | `VARCHAR(255)` | NULL | Đơn vị ban hành |
| `business_domain` | `VARCHAR(255)` | NULL | Lĩnh vực nghiệp vụ |
| `application_scope` | `TEXT` | NULL | Phạm vi/đối tượng áp dụng |
| `access_scope` | `VARCHAR(30)` | default `INTERNAL` | Phạm vi truy cập `PUBLIC`/`INTERNAL` |
| `issued_at` | `DATETIME` | NULL | Ngày ban hành |
| `effective_from` | `DATETIME` | NULL | Ngày bắt đầu hiệu lực |
| `effective_to` | `DATETIME` | NULL | Ngày hết hiệu lực |
| `effective_status` | `VARCHAR(40)` | default `FUTURE_EFFECTIVE` | Trạng thái hiệu lực |
| `lifecycle_status` | `VARCHAR(40)` | default `ACTIVE` | Trạng thái vòng đời bản ghi |
| `processing_status` | `VARCHAR(40)` | default `QUEUED` | Trạng thái parse/ingestion tổng quát |
| `index_status` | `VARCHAR(40)` | default `NOT_INDEXED` | Trạng thái index ở AI Service |
| `current_version_id` | `VARCHAR(36)` | NULL | ID phiên bản hiện hành; liên kết logic |
| `owner_user_id` | `VARCHAR(36)` | NULL | ID người/đơn vị sở hữu; liên kết logic |
| `created_by` | `VARCHAR(36)` | NOT NULL | ID người tạo; liên kết logic |
| `updated_by` | `VARCHAR(36)` | NOT NULL | ID người cập nhật cuối; liên kết logic |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo |
| `updated_at` | `DATETIME` | default UTC now, auto update | Thời điểm cập nhật |
| `deleted_at` | `DATETIME` | NULL | Soft delete |

### 11.8. `knowledge_document_versions`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID phiên bản |
| `document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Tài liệu cha |
| `version_number` | `INTEGER` | NOT NULL | Số thứ tự phiên bản |
| `version_label` | `VARCHAR(100)` | NOT NULL | Nhãn, ví dụ `v2.0` |
| `effective_from` | `DATETIME` | NULL | Bắt đầu hiệu lực của phiên bản |
| `effective_to` | `DATETIME` | NULL | Kết thúc hiệu lực của phiên bản |
| `status` | `VARCHAR(40)` | default `FUTURE_EFFECTIVE` | Trạng thái phiên bản |
| `change_summary` | `TEXT` | NULL | Tóm tắt thay đổi |
| `change_document_code` | `VARCHAR(120)` | NULL | Mã văn bản làm phát sinh thay đổi |
| `created_by` | `VARCHAR(36)` | NOT NULL | ID người tạo phiên bản |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo |

### 11.9. `knowledge_document_files`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID metadata file |
| `document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Tài liệu sở hữu file |
| `version_id` | `VARCHAR(36)` | NULL | ID phiên bản tương ứng; liên kết logic |
| `original_file_name` | `VARCHAR(500)` | NOT NULL | Tên file do người dùng upload |
| `storage_provider` | `VARCHAR(30)` | default `local` | Adapter lưu trữ: `local`, `r2` |
| `storage_bucket` | `VARCHAR(255)` | NULL | Bucket nếu dùng object storage |
| `storage_key` | `TEXT` | UQ, NOT NULL | Đường dẫn/key nội bộ trong storage |
| `mime_type` | `VARCHAR(150)` | NOT NULL | MIME type đã validate |
| `file_extension` | `VARCHAR(20)` | NOT NULL | Phần mở rộng file |
| `file_size` | `INTEGER` | NOT NULL | Kích thước file theo byte |
| `checksum_sha256` | `VARCHAR(64)` | NOT NULL | SHA-256 kiểm tra toàn vẹn file |
| `uploaded_by` | `VARCHAR(36)` | NOT NULL | ID người upload |
| `uploaded_at` | `DATETIME` | default UTC now | Thời điểm upload |
| `is_current` | `BOOLEAN` | default `TRUE` | File có phải bản hiện hành không |
| `deleted_at` | `DATETIME` | NULL | Soft delete file metadata |

### 11.10. `knowledge_document_keywords`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `document_id` | `VARCHAR(36)` | PK, FK → `knowledge_documents.id` | Tài liệu |
| `keyword` | `VARCHAR(150)` | PK | Một từ khóa |
| `created_at` | `DATETIME` | default UTC now | Thời điểm thêm từ khóa |

Khóa chính ghép: (`document_id`, `keyword`).

### 11.11. `knowledge_document_access`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID bản ghi cấp quyền |
| `document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Tài liệu được bảo vệ |
| `subject_type` | `VARCHAR(30)` | NOT NULL | Loại chủ thể: `USER`, `ROLE`, `DEPARTMENT` |
| `subject_id` | `VARCHAR(100)` | IDX, NOT NULL | ID/code của chủ thể |
| `access_level` | `VARCHAR(30)` | NOT NULL | Mức quyền: đọc, tải xuống, quản lý... |
| `granted_by` | `VARCHAR(36)` | NOT NULL | ID người cấp quyền |
| `created_at` | `DATETIME` | default UTC now | Thời điểm cấp |
| `expires_at` | `DATETIME` | NULL | Thời điểm quyền hết hạn |

### 11.12. `ai_ref_documents`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID bản ghi ánh xạ |
| `document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, UQ | Document Backend |
| `ai_document_id` | `VARCHAR(255)` | UQ, NOT NULL | ID document do AI Service quản lý |
| `ai_collection` | `VARCHAR(255)` | NULL | Collection/index logic phía AI |
| `sync_status` | `VARCHAR(40)` | default `PENDING` | Trạng thái đồng bộ |
| `last_synced_at` | `DATETIME` | NULL | Lần đồng bộ thành công gần nhất |
| `last_sync_error` | `TEXT` | NULL | Lỗi đồng bộ gần nhất |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo ánh xạ |
| `updated_at` | `DATETIME` | default UTC now, auto update | Thời điểm cập nhật |

### 11.13. `ai_ref_versions`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID ánh xạ |
| `document_version_id` | `VARCHAR(36)` | FK → `knowledge_document_versions.id`, UQ | Version Backend |
| `ai_version_id` | `VARCHAR(255)` | UQ, NOT NULL | Version ID phía AI |
| `sync_status` | `VARCHAR(40)` | default `PENDING` | Trạng thái đồng bộ |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo |
| `updated_at` | `DATETIME` | default UTC now, auto update | Thời điểm cập nhật |

### 11.14. `ai_ref_relations`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID quan hệ Backend |
| `source_document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Tài liệu nguồn |
| `target_document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Tài liệu đích |
| `ai_relation_id` | `VARCHAR(255)` | NULL | ID quan hệ ở AI/Graph Service |
| `relation_type` | `VARCHAR(50)` | NOT NULL | Loại: references, amends, supersedes... |
| `sync_status` | `VARCHAR(40)` | default `PENDING` | Trạng thái đồng bộ quan hệ |
| `created_by` | `VARCHAR(36)` | NOT NULL | ID người khai báo |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo |
| `updated_at` | `DATETIME` | default UTC now, auto update | Thời điểm cập nhật |

### 11.15. `ai_ref_chunks`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID ánh xạ |
| `document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Document Backend chứa chunk |
| `ai_chunk_id` | `VARCHAR(255)` | UQ, NOT NULL | ID chunk phía AI; không phải nội dung chunk |
| `created_at` | `DATETIME` | default UTC now | Thời điểm ghi nhận ánh xạ |

### 11.16. `ai_ref_jobs`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID ánh xạ job |
| `job_id` | `VARCHAR(36)` | UQ, NOT NULL | ID job Backend |
| `ai_job_id` | `VARCHAR(255)` | NULL | ID job phía AI Service |
| `status` | `VARCHAR(40)` | default `QUEUED` | Trạng thái đồng bộ job |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo |

### 11.17. `conversation_conversations`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID hội thoại |
| `owner_user_id` | `VARCHAR(36)` | FK → `auth_users.id`, IDX | Chủ sở hữu hội thoại |
| `title` | `VARCHAR(500)` | default `Cuộc trò chuyện mới` | Tiêu đề hội thoại |
| `scope` | `VARCHAR(30)` | default `PUBLIC` | Phạm vi truy vấn `PUBLIC`/`INTERNAL` |
| `status` | `VARCHAR(30)` | default `ACTIVE` | Trạng thái hội thoại |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo |
| `updated_at` | `DATETIME` | default UTC now, auto update | Thời điểm cập nhật |
| `deleted_at` | `DATETIME` | NULL | Soft delete |

### 11.18. `conversation_messages`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID message |
| `conversation_id` | `VARCHAR(36)` | FK → `conversation_conversations.id`, IDX | Hội thoại chứa message |
| `parent_message_id` | `VARCHAR(36)` | NULL | Message cha; hiện là liên kết logic |
| `role` | `VARCHAR(20)` | NOT NULL | `user` hoặc `assistant` |
| `content` | `TEXT` | NOT NULL | Nội dung câu hỏi/câu trả lời; không phải source text |
| `status` | `VARCHAR(30)` | default `COMPLETED` | Trạng thái tạo message |
| `ai_request_id` | `VARCHAR(255)` | NULL | Request ID do AI Service trả về |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo |
| `completed_at` | `DATETIME` | NULL | Thời điểm AI hoàn thành trả lời |
| `error_code` | `VARCHAR(100)` | NULL | Mã lỗi xử lý message |

### 11.19. `conversation_message_feedback`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID feedback |
| `message_id` | `VARCHAR(36)` | FK → `conversation_messages.id`, IDX | Message được đánh giá |
| `user_id` | `VARCHAR(36)` | FK → `auth_users.id` | Người đánh giá |
| `feedback_type` | `VARCHAR(30)` | NOT NULL | Loại đánh giá: like/dislike/report... |
| `comment` | `TEXT` | NULL | Nhận xét bổ sung |
| `created_at` | `DATETIME` | default UTC now | Thời điểm đánh giá |

### 11.20. `conversation_source_groups`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID nhóm source Backend |
| `conversation_id` | `VARCHAR(36)` | FK → `conversation_conversations.id`, IDX | Hội thoại sở hữu nhóm source |
| `user_message_id` | `VARCHAR(36)` | FK → `conversation_messages.id` | Câu hỏi tương ứng |
| `assistant_message_id` | `VARCHAR(36)` | FK → `conversation_messages.id` | Câu trả lời tương ứng |
| `ai_source_group_id` | `VARCHAR(255)` | NOT NULL | ID nhóm source phía AI |
| `question_snapshot` | `TEXT` | NULL | Bản chụp câu hỏi, không chứa source text |
| `chunk_count` | `INTEGER` | default `0` | Số chunk reference trong nhóm |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo nhóm |

### 11.21. `conversation_source_refs`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID source reference |
| `source_group_id` | `VARCHAR(36)` | FK → `conversation_source_groups.id`, IDX | Nhóm source cha |
| `ai_chunk_id` | `VARCHAR(255)` | IDX, NOT NULL | ID chunk tại AI Service |
| `rank` | `INTEGER` | default `1` | Thứ hạng retrieval |
| `relevance_score` | `FLOAT` | NULL | Điểm liên quan do AI trả về |
| `access_status` | `VARCHAR(30)` | default `AVAILABLE` | Trạng thái quyền/khả dụng của source |
| `created_at` | `DATETIME` | default UTC now | Thời điểm ghi nhận source |

Không có column chứa nội dung source.

### 11.22. `conversation_retrieval_graph_refs`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID graph reference |
| `assistant_message_id` | `VARCHAR(36)` | FK → `conversation_messages.id`, IDX | Câu trả lời sở hữu graph |
| `ai_graph_id` | `VARCHAR(255)` | NOT NULL | ID graph phía AI Service |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo reference |

Node, edge và node detail không được lưu trong bảng này.

### 11.23. `workflow_processing_jobs`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID processing job |
| `document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Tài liệu được xử lý |
| `document_file_id` | `VARCHAR(36)` | NULL | ID file đầu vào; hiện là liên kết logic |
| `ai_job_id` | `VARCHAR(255)` | NULL | Job ID phía AI |
| `job_type` | `VARCHAR(50)` | NOT NULL | `INGEST`, `REINDEX`... |
| `status` | `VARCHAR(40)` | default `QUEUED` | Trạng thái job |
| `current_step` | `VARCHAR(100)` | NULL | Bước hiện tại: ingest, parse, index... |
| `progress_percent` | `INTEGER` | default `0` | Tiến độ từ 0 đến 100 |
| `requested_by` | `VARCHAR(36)` | FK → `auth_users.id` | Người yêu cầu chạy job |
| `started_at` | `DATETIME` | NULL | Thời điểm bắt đầu |
| `completed_at` | `DATETIME` | NULL | Thời điểm kết thúc |
| `error_code` | `VARCHAR(100)` | NULL | Mã lỗi chuẩn hóa |
| `error_message` | `TEXT` | NULL | Mô tả lỗi kỹ thuật |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo job |
| `updated_at` | `DATETIME` | default UTC now, auto update | Lần cập nhật gần nhất |

### 11.24. `workflow_reindex_jobs`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID batch re-index |
| `requested_by` | `VARCHAR(36)` | FK → `auth_users.id` | Người yêu cầu |
| `reason` | `TEXT` | NOT NULL | Lý do re-index |
| `status` | `VARCHAR(40)` | default `QUEUED` | Trạng thái batch |
| `total_documents` | `INTEGER` | default `0` | Tổng số tài liệu |
| `completed_documents` | `INTEGER` | default `0` | Số tài liệu thành công |
| `failed_documents` | `INTEGER` | default `0` | Số tài liệu thất bại |
| `started_at` | `DATETIME` | NULL | Thời điểm bắt đầu |
| `completed_at` | `DATETIME` | NULL | Thời điểm hoàn tất |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo batch |

### 11.25. `workflow_reindex_job_documents`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `job_id` | `VARCHAR(36)` | PK, FK → `workflow_reindex_jobs.id` | Batch job cha |
| `document_id` | `VARCHAR(36)` | PK, FK → `knowledge_documents.id` | Tài liệu trong batch |
| `ai_job_id` | `VARCHAR(255)` | NULL | Job ID phía AI cho tài liệu này |
| `status` | `VARCHAR(40)` | default `QUEUED` | Trạng thái tài liệu trong batch |
| `error_code` | `VARCHAR(100)` | NULL | Mã lỗi nếu thất bại |
| `created_at` | `DATETIME` | default UTC now | Thời điểm thêm vào batch |
| `completed_at` | `DATETIME` | NULL | Thời điểm xử lý xong |

Khóa chính ghép: (`job_id`, `document_id`).

### 11.26. `workflow_metadata_reviews`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID lượt review |
| `document_id` | `VARCHAR(36)` | FK → `knowledge_documents.id`, IDX | Tài liệu được review |
| `document_version_id` | `VARCHAR(36)` | NULL | Phiên bản được review; liên kết logic |
| `reviewer_id` | `VARCHAR(36)` | FK → `auth_users.id` | Người review |
| `status` | `VARCHAR(30)` | NOT NULL | Trạng thái review |
| `note` | `TEXT` | NULL | Ghi chú của reviewer |
| `reviewed_at` | `DATETIME` | NULL | Thời điểm thực hiện review |
| `created_at` | `DATETIME` | default UTC now | Thời điểm tạo yêu cầu/lượt review |

### 11.27. `audit_logs`

| Column | Data type | Constraint/default | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK | UUID audit log |
| `request_id` | `VARCHAR(36)` | IDX, NOT NULL | Correlation ID của request |
| `actor_user_id` | `VARCHAR(36)` | NULL | ID người thực hiện; không khai báo FK để giữ lịch sử khi user bị xóa |
| `actor_role` | `VARCHAR(50)` | NULL | Role tại thời điểm thực hiện |
| `action` | `VARCHAR(100)` | NOT NULL | Hành động nghiệp vụ hoặc method/path API |
| `resource_type` | `VARCHAR(100)` | NOT NULL | Loại tài nguyên bị tác động |
| `resource_id` | `VARCHAR(36)` | NULL | ID tài nguyên bị tác động |
| `result` | `VARCHAR(30)` | NOT NULL | `SUCCESS` hoặc `FAILED` |
| `before_json` | `JSON` | NULL | Metadata trước thay đổi |
| `after_json` | `JSON` | NULL | Metadata sau thay đổi |
| `error_code` | `VARCHAR(100)` | NULL | Mã lỗi |
| `error_message` | `TEXT` | NULL | Mô tả lỗi |
| `ip_address` | `VARCHAR(80)` | NULL | IP nguồn |
| `user_agent` | `TEXT` | NULL | User-Agent của client |
| `created_at` | `DATETIME` | default UTC now | Thời điểm ghi audit |

`before_json` và `after_json` chỉ chứa metadata; không được chứa password, token, file binary, parsed text, chunk/source content hoặc embedding.
