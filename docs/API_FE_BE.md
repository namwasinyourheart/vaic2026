# API contract: Frontend ↔ Backend

## Quy ước chung

- Base local: `http://localhost:8000/api/v1`.
- Base production hiện tại: `https://vaic2026.onrender.com/api/v1`.
- Frontend ưu tiên `VITE_API_URL`; nếu không khai báo, build production dùng URL Render trên, còn localhost dùng Backend port `8000`.
- JSON dùng `Content-Type: application/json`; upload dùng `multipart/form-data`.
- Protected endpoint: `Authorization: Bearer <access_token>`.
- Response lỗi FastAPI: `{ "detail": "..." }` hoặc validation detail.
- Access token ngắn hạn; FE tự refresh khi hết hạn bằng refresh token rotation.
- Backend không trả password hash, `storage_key` hoặc source content nếu chưa kiểm tra quyền.

## Authentication

### `POST /auth/login`

Request:

```json
{ "username": "customer", "password": "password" }
```

Response `200`:

```json
{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "user": { "id": "...", "username": "customer", "email": null, "full_name": "...", "status": "ACTIVE", "role": "customer" } }
```

`401` sai thông tin; `423` user LOCKED.

### `POST /auth/sign-up`

Không cần JWT. Request bắt buộc username/password/full_name; email tùy chọn:

```json
{ "username": "customer01", "password": "password123", "email": null, "full_name": "Customer 01" }
```

`201` trả user với role `customer`; `409` trùng username/email; `422` dữ liệu không hợp lệ.

### Session/profile

| Method | Path | Body/ý nghĩa |
|---|---|---|
| POST | `/auth/refresh` | `{refresh_token}`; revoke token cũ và trả cặp mới |
| POST | `/auth/logout` | `{refresh_token}`; revoke session hiện tại |
| POST | `/auth/logout-all` | Revoke mọi session của user |
| GET | `/auth/me` | User hiện tại |
| PATCH | `/auth/me` | `{full_name?, email?}` |
| PUT | `/auth/me/password` | `{current_password, new_password}`; revoke refresh sessions |

## Conversation account

Tất cả yêu cầu JWT và user chỉ truy cập conversation của mình.

| Method | Path | Mô tả |
|---|---|---|
| POST | `/conversations` | Tạo conversation `{title, scope}`; customer không tạo INTERNAL |
| GET | `/conversations` | Danh sách theo owner |
| GET | `/conversations/{id}` | Conversation + messages |
| PATCH | `/conversations/{id}` | Đổi title |
| DELETE | `/conversations/{id}` | Soft delete |
| POST | `/conversations/{id}/messages` | `{content}`; Backend gọi AI, lưu message + source ID + graph ID |
| POST | `/messages/{message_id}/feedback` | `{feedback_type, comment?}` |
| GET | `/conversations/{id}/sources` | Source groups + refs ID |
| GET | `/messages/{id}/sources` | Sources theo message |
| GET | `/source-chunks/{ai_chunk_id}` | Backend gọi AI lấy chunk sau khi check quyền |
| GET | `/messages/{id}/retrieval-graph` | Graph theo assistant message |

## Document read

| Method | Path | Mô tả |
|---|---|---|
| GET | `/documents` | Danh sách; customer chỉ PUBLIC |
| GET | `/documents/{id}` | Metadata document |
| GET | `/documents/{id}/download` | Stream file qua Backend và audit |
| GET | `/documents/{id}/versions` | Danh sách version |
| GET | `/documents/{id}/timeline` | Version/job timeline |
| GET | `/documents/{id}/relations` | Quan hệ tài liệu, chỉ ID AI |
| GET | `/documents/{id}/processing-status` | Job progress/status |

## Knowledge Manager

Upload cần permission `document.upload`, file PDF/DOCX/PNG/JPG/JPEG, giới hạn theo `MAX_UPLOAD_BYTES`:

| Method | Path | Mô tả |
|---|---|---|
| POST | `/knowledge/documents` | Multipart file + document_code/title/document_type/access_scope; tạo ingestion job |
| PATCH | `/knowledge/documents/{id}` | Cập nhật metadata cơ bản |
| PUT | `/knowledge/documents/{id}/file` | Tạo version/file mới và ingest |
| GET | `/knowledge/documents/{id}/metadata` | Metadata + keywords |
| PUT | `/knowledge/documents/{id}/metadata` | Cập nhật metadata |
| POST | `/knowledge/documents/{id}/expire` | `{effective_to, reason}` |
| POST | `/knowledge/documents/{id}/reindex` | `{reason}`; tạo job |
| POST | `/knowledge/documents/bulk-reindex` | `{document_ids, reason}` |
| GET | `/knowledge/jobs/{job_id}` | Processing/bulk re-index status |

## Admin

Tất cả cần role `system_admin`.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/users` | Danh sách user, một role |
| POST | `/admin/users` | `{username,email?,password,full_name,role,department_id?}` |
| GET | `/admin/users/{id}` | Chi tiết user |
| PATCH | `/admin/users/{id}` | Cập nhật full_name/email/status/role |
| POST | `/admin/users/{id}/lock` | Khóa + revoke sessions |
| POST | `/admin/users/{id}/unlock` | Mở khóa |
| DELETE | `/admin/users/{id}` | Soft delete |
| GET | `/admin/roles` | Role và permission |
| PUT | `/admin/roles/{role_id}/permissions` | Thay ma trận permission của role |
| GET | `/admin/audit-logs` | Lọc audit |
| GET | `/admin/audit-logs/{id}` | Chi tiết audit |

## Guest public

Không dùng account JWT:

### `POST /public/chat`

```json
{ "guest_session_id": "browser-uuid", "question": "Lãi suất tiết kiệm là bao nhiêu?" }
```

Backend luôn gửi `scope=PUBLIC` cho AI. Response gồm `guest_request_id`, `answer`, `ai_source_group_id`, `source_refs[]`, `ai_graph_id`, `guest_access_token`, `created_at`.

### Source/graph

Gửi `Authorization: Bearer <guest_access_token>`:

- `GET /public/source-groups/{group_id}/chunks/{chunk_id}`
- `GET /public/graphs/{graph_id}`

Token chỉ hợp lệ với group/graph/chunk thuộc request tương ứng và hết hạn sau thời gian ngắn. Guest history không được gửi vào Backend.

## HTTP status

`200` thành công, `201` tạo mới, `202` background job, `401` thiếu/sai token, `403` sai role/scope/ownership, `404` không tồn tại, `409` trùng dữ liệu, `422` validation/file, `423` user locked.

## API đầy đủ cho Bank Employee

Các endpoint dưới đây phản ánh route Backend hiện có. Endpoint chưa có implementation được ghi rõ để FE không gọi nhầm route.

| Method | Path | Trạng thái | Permission | Mô tả |
|---|---|---|---|---|
| GET | `/documents` | Đã có | `document.read` | Tìm/lọc văn bản được cấp quyền |
| GET | `/documents/{id}` | Đã có | `document.read` | Chi tiết metadata |
| GET | `/documents/{id}/versions` | Đã có | `document.read` | Version list |
| GET | `/documents/{id}/timeline` | Đã có | `document.read` | Timeline Backend |
| GET | `/documents/{id}/relations` | Đã có | `relation.read` | Relation refs, không trả evidence content |
| GET | `/documents/{id}/clauses` | Đã có | `document.read` | Clause refs/detail qua AI adapter |
| GET | `/documents/{id}/clauses/{ai_clause_id}` | Đã có | `document.read` | Clause detail có access check |
| GET | `/documents/{id}/chunks` | Đã có | `document.read` | Chunk list từ AI |
| GET | `/documents/{id}/chunks/{ai_chunk_id}` | Đã có | `document.read` | Chunk detail với access check |
| GET | `/documents/{id}/knowledge-graph` | Đã có | `relation.read` | Graph tổng thể từ AI adapter |
| GET | `/documents/{id}/relation-graph` | Đã có | `relation.read` | Graph quan hệ tài liệu |
| GET | `/documents/{id}/conflicts` | Chưa có route trực tiếp | `document.read` | Dùng `/knowledge/documents/{id}/conflicts` cho KM |
| POST | `/documents/compare` | Chưa có route | `document.read` | So sánh version/document/clause |

List response chuẩn:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0,
  "has_next": false
}
```

Document query cần hỗ trợ `keyword`, `document_type`, `issuing_unit`, `business_domain`, `effective_status`, `access_scope`, `effective_at`, `page`, `page_size`, `sort`.

## API đầy đủ cho Knowledge Manager

### Processing inspection

| Method | Path | Trạng thái | Mô tả |
|---|---|---|---|
| GET | `/knowledge/jobs/{job_id}` | Đã có | Job progress |
| GET | `/knowledge/documents/{id}/ingestion-result` | Chưa có route | Count, warnings, failed steps |
| GET | `/knowledge/documents/{id}/outline` | Đã có | Parsed structure |
| GET | `/knowledge/documents/{id}/clauses` | Đã có | Clause review list |
| GET | `/knowledge/documents/{id}/chunks` | Đã có | Chunk QA list |
| GET | `/knowledge/documents/{id}/chunks/{chunk_id}` | Đã có | Chunk content từ AI |
| GET | `/knowledge/documents/{id}/knowledge-graph` | Đã có | Full graph sau ingestion |

### Relation review

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| GET | `/knowledge/documents/{id}/relations` | `relation.read` | AI-detected + manual relations |
| POST | `/knowledge/documents/{id}/relations/detect` | `relation.update` | Chạy detection |
| POST | `/knowledge/relations` | `relation.create` | Tạo relation manual |
| PATCH | `/knowledge/relations/{id}` | `relation.update` | Sửa relation |
| POST | `/knowledge/relations/{id}/review` | `relation.update` | Duyệt/từ chối relation với decision + reason |

Create relation:

```json
{
  "source_document_id": "backend-doc-new",
  "target_document_id": "backend-doc-old",
  "relation_type": "PARTIALLY_REPLACES",
  "source_ai_clause_ids": ["clause_new_02"],
  "target_ai_clause_ids": ["clause_old_05"],
  "effective_from": "2026-08-01T00:00:00Z",
  "note": "Theo Điều 2 văn bản sửa đổi"
}
```

Backend map document IDs sang AI IDs, gọi AI, rồi lưu `ai_relation_id` và sync status; không lưu clause content. Route approve/reject riêng chưa được expose.

### Conflict review

| Method | Path | Mô tả |
|---|---|---|
| GET | `/knowledge/documents/{id}/conflicts` | Danh sách conflict |
| POST | `/knowledge/documents/{id}/conflicts/detect` | Chạy detection |
| GET | `/knowledge/conflicts/{id}` | Chưa có route detail riêng |
| POST | `/knowledge/conflicts/{id}/approve` | Chưa có route riêng |
| POST | `/knowledge/conflicts/{id}/reject` | Chưa có route riêng |
| PUT | `/knowledge/conflicts/{id}/resolution` | Chọn clause ưu tiên và lý do |

Resolution request:

```json
{
  "status": "RESOLVED",
  "preferred_ai_clause_id": "clause_new_02",
  "reason": "Văn bản có ngày hiệu lực mới hơn",
  "reindex": true
}
```

### Impact analysis

| Method | Path | Mô tả |
|---|---|---|
| POST | `/knowledge/impact-analyses` | Phân tích sửa đổi/bổ sung/thay thế/bãi bỏ |
| GET | `/knowledge/impact-analyses/{id}` | Chưa có route detail riêng |
| POST | `/knowledge/impact-analyses/{id}/approve` | Chưa có route riêng |
| POST | `/knowledge/impact-analyses/{id}/reject` | Chưa có route riêng |
| POST | `/knowledge/impact-analyses/{id}/apply` | Chưa có route riêng |

### Metadata AI suggestions

| Method | Path | Mô tả |
|---|---|---|
| GET | `/knowledge/documents/{id}/metadata-suggestions` | Metadata AI gợi ý |
| POST | `/knowledge/documents/{id}/metadata-suggestions/review` | Approve/reject/correct từng field |

## Source/chunk authorization đầy đủ

Backend phải kiểm tra theo thứ tự:

1. User ACTIVE và có permission đọc.
2. Backend document tồn tại, chưa soft-delete.
3. Document scope/ACL cho phép user/department/role.
4. `ai_chunk_id` thuộc AI document/version tương ứng.
5. AI xác nhận `access_scope` trước khi trả content.
6. Ghi audit action nhưng không ghi chunk content.

Endpoint conversation source hiện kiểm tra ownership. Endpoint document chunk mới phải kiểm tra document ACL, không yêu cầu chunk từng xuất hiện trong conversation.

## Graph authorization đầy đủ

- Retrieval graph: user phải sở hữu conversation/message.
- Document graph: user phải có quyền đọc document gốc.
- Mọi node/edge liên quan tài liệu không được phép phải bị loại hoặc mask.
- Customer/Guest chỉ nhận PUBLIC graph.
- Knowledge Manager có thể xem review metadata, confidence và evidence IDs; Bank Employee chỉ đọc.

## Trạng thái review chuẩn

`PENDING_REVIEW`, `APPROVED`, `REJECTED`, `CORRECTED`, `APPLIED`, `SYNC_FAILED`.

## Audit cho nghiệp vụ AI

Các action tối thiểu: `RELATION_DETECT`, `RELATION_APPROVE`, `RELATION_REJECT`, `RELATION_UPDATE`, `CONFLICT_DETECT`, `CONFLICT_RESOLVE`, `IMPACT_ANALYSIS_CREATE`, `IMPACT_ANALYSIS_APPLY`, `METADATA_REVIEW`, `DOCUMENT_REINDEX`, `SOURCE_VIEW`, `GRAPH_VIEW`.
