# API/adapter contract: Backend ↔ AI/RAG Service

AI Service thật chưa nằm trong repository. Backend gọi qua `AIServiceAdapter`; adapter mock hiện tại phải giữ đúng shape dưới đây để thay bằng HTTP client không đổi API layer.

## Nguyên tắc

- Backend gửi file key và metadata để AI đọc file; không gửi source content từ DB.
- AI sở hữu OCR, parsed content, clause, chunk, embedding, vector index và graph.
- Backend chỉ nhận/lưu external IDs, status và error.
- Mọi query phải có `scope`; Guest bị Backend ép `PUBLIC`.
- AI phải thực hiện access-scope check lần cuối trước khi trả source/graph.

## Ingestion

### `ingest_document`

Request interface:

```python
await adapter.ingest_document(
    document_id="backend-document-uuid",
    file_key="documents/<id>/v1/original.pdf",
    metadata={"title": "...", "document_code": "..."},
)
```

Result:

```json
{ "ai_document_id": "rag_doc_123", "ai_job_id": "rag_job_123", "status": "QUEUED|PROCESSING|COMPLETED|FAILED" }
```

Backend ghi kết quả vào `ai_ref_documents` và `workflow_processing_jobs`.

## Query

### `query`

```json
{
  "user_id": "user-uuid-or-guest-session",
  "scope": "PUBLIC|INTERNAL",
  "question": "...",
  "conversation_id": "backend-conversation-or-guest-request"
}
```

Result:

```json
{
  "answer": "...",
  "ai_request_id": "request_123",
  "source_group_id": "source_group_123",
  "chunks": [{"ai_chunk_id":"chunk_123", "rank":1, "relevance_score":0.96}],
  "graph_id": "graph_123"
}
```

`chunks` không chứa content trong result persistence path. Backend trả IDs cho FE; FE gọi source endpoint để Backend lấy detail từ AI.

## Source chunk

### `get_source_chunk(ai_chunk_id)`

AI trả content chỉ sau khi xác nhận chunk tồn tại và access scope phù hợp:

```json
{
  "ai_chunk_id": "chunk_123",
  "document_name": "...",
  "document_code": "...",
  "path": "Điều 1 → Khoản 1",
  "content": "...",
  "access_status": "AVAILABLE|UNAVAILABLE",
  "access_scope": "PUBLIC|INTERNAL",
  "version": "v2.0"
}
```

Backend không ghi response content vào PostgreSQL (hoặc SQLite test).

## Retrieval graph

### `get_retrieval_graph(ai_graph_id)`

```json
{
  "ai_graph_id": "graph_123",
  "nodes": [{"id":"...", "type":"document|clause|chunk", "label":"...", "access_scope":"PUBLIC"}],
  "edges": [{"source":"...", "target":"...", "type":"references|amends|supersedes"}]
}
```

Graph content chỉ trả cho request đã qua authorization; Backend lưu `ai_graph_id` tại `conversation_retrieval_graph_refs` hoặc guest token claim.

## Re-index

```python
await adapter.reindex(document_id="document-uuid", reason="Metadata updated")
```

Result có `ai_document_id`, `ai_job_id`, `status`. Backend cập nhật workflow/index status.

## HTTP mapping đề xuất

Khi có AI Service thật, dùng internal base URL (`AI_SERVICE_URL`, local mặc định `http://localhost:9000/internal/v1`):

> Trạng thái hiện tại: deploy dùng `AI_PROVIDER=mock`; chưa cần một AI URL hoạt động. Mock adapter tuân theo cùng kiểu ID/response nhưng không thực hiện OCR, embedding, vector retrieval hoặc graph thật.

| Backend adapter | Internal endpoint đề xuất | Method |
|---|---|---|
| ingest_document | `/documents/ingest` | POST |
| query | `/query` | POST |
| get_source_chunk | `/source-chunks/{ai_chunk_id}` | GET |
| get_retrieval_graph | `/graphs/{ai_graph_id}` | GET |
| reindex | `/documents/{document_id}/reindex` | POST |

Contract cần có timeout, request ID, normalized error code và không log source content/password.

## Contract đầy đủ cần triển khai

Các endpoint dưới đây là contract mục tiêu để bao phủ toàn bộ nghiệp vụ. Ký hiệu: **Implemented by mock** là adapter hiện tại đã có method; **Required** là chưa có implementation thật.

### 1. Document processing

| Method | Endpoint nội bộ | Trạng thái | Mục đích |
|---|---|---|---|
| POST | `/documents/ingest` | Implemented by mock | Parse/index một file/version |
| GET | `/jobs/{ai_job_id}` | Required | Theo dõi OCR/parse/chunk/embed/index |
| POST | `/documents/{ai_document_id}/reindex` | Implemented by mock | Re-index |
| DELETE | `/documents/{ai_document_id}/index` | Required | Xóa dữ liệu index khi document bị xóa |
| GET | `/documents/{ai_document_id}/processing-result` | Required | Tổng hợp clause/chunk/relation/conflict counts |

Processing result:

```json
{
  "ai_document_id": "ai_doc_001",
  "ai_version_id": "ai_ver_003",
  "status": "COMPLETED",
  "steps": [{"code":"OCR","status":"COMPLETED","progress":100}],
  "clause_count": 46,
  "chunk_count": 132,
  "relation_count": 8,
  "conflict_count": 2,
  "warnings": [],
  "completed_at": "2026-07-18T05:00:00Z"
}
```

### 2. Parsed structure, clauses và chunks

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/documents/{ai_document_id}/outline` | Cấu trúc chương/mục/điều/khoản |
| GET | `/documents/{ai_document_id}/clauses` | Danh sách clause có phân trang/filter |
| GET | `/clauses/{ai_clause_id}` | Chi tiết clause |
| GET | `/clauses/{ai_clause_id}/versions` | Lịch sử clause qua version |
| GET | `/documents/{ai_document_id}/chunks` | Danh sách chunk |
| GET | `/chunks/{ai_chunk_id}` | Nội dung chunk + metadata |
| GET | `/chunks/{ai_chunk_id}/context` | Chunk trước/sau và clause cha |

Query list chuẩn:

```text
page, page_size, version_id, effective_status, content_type,
relation_type, review_status, keyword
```

Chunk response:

```json
{
  "ai_chunk_id": "chunk_001",
  "ai_document_id": "ai_doc_001",
  "ai_version_id": "ai_ver_003",
  "ai_clause_id": "clause_05",
  "document_code": "SHB-QD-001",
  "path": ["Chương II", "Điều 5", "Khoản 2"],
  "content": "Nội dung do AI Service sở hữu",
  "content_type": "CLAUSE",
  "language": "vi",
  "effective_status": "EFFECTIVE",
  "access_scope": "INTERNAL",
  "indexed_at": "2026-07-18T05:00:00Z"
}
```

### 3. Version và hiệu lực

| Method | Endpoint | Mục đích |
|---|---|---|
| PUT | `/documents/{ai_document_id}/versions/{ai_version_id}` | Đồng bộ version metadata |
| GET | `/documents/{ai_document_id}/versions` | Danh sách version trong AI index |
| GET | `/versions/{ai_version_id}/effective-clauses` | Các clause hiệu lực tại version |
| POST | `/documents/{ai_document_id}/effective-snapshot` | Snapshot tại một ngày |
| GET | `/documents/{ai_document_id}/timeline` | Timeline version/effect |

Effective snapshot request:

```json
{ "as_of_date": "2026-07-18", "exclude_repealed": true, "resolve_amendments": true }
```

AI phải phân biệt `FUTURE_EFFECTIVE`, `EFFECTIVE`, `PARTIALLY_SUPERSEDED`, `SUPERSEDED`, `PARTIALLY_REPEALED`, `REPEALED`, `EXPIRED`.

### 4. Relation detection và review

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/relations/detect` | Phát hiện relation từ document/version |
| GET | `/documents/{ai_document_id}/relations` | Quan hệ vào/ra |
| GET | `/relations/{ai_relation_id}` | Chi tiết và evidence |
| POST | `/relations` | Tạo relation do Knowledge Manager khai báo |
| PATCH | `/relations/{ai_relation_id}` | Sửa phạm vi/type/effective date |
| POST | `/relations/{ai_relation_id}/review` | Approve/reject relation AI phát hiện |
| DELETE | `/relations/{ai_relation_id}` | Xóa relation thủ công |

Relation types chuẩn:

```text
REFERENCES, GUIDES, IMPLEMENTS, AMENDS, SUPPLEMENTS,
REPLACES, PARTIALLY_REPLACES, REPEALS, PARTIALLY_REPEALS,
CONSOLIDATES, CONFLICTS_WITH, RELATED_TO, SUPERSEDES_VERSION
```

Relation detail:

```json
{
  "ai_relation_id": "rel_001",
  "source_document_id": "ai_doc_new",
  "source_version_id": "ai_ver_new",
  "source_clause_ids": ["clause_new_02"],
  "target_document_id": "ai_doc_old",
  "target_version_id": "ai_ver_old",
  "target_clause_ids": ["clause_old_05"],
  "relation_type": "PARTIALLY_REPLACES",
  "effective_from": "2026-08-01T00:00:00Z",
  "effective_to": null,
  "confidence": 0.96,
  "detection_method": "AI_DETECTED",
  "review_status": "PENDING_REVIEW",
  "evidence_chunk_ids": ["chunk_new_12"],
  "created_at": "2026-07-18T05:00:00Z"
}
```

### 5. Impact analysis

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/impact-analyses` | Phân tích document mới tác động document cũ |
| GET | `/impact-analyses/{analysis_id}` | Kết quả chi tiết |
| POST | `/impact-analyses/{analysis_id}/apply` | Áp dụng effects đã được duyệt vào index |

Mỗi effect phải có `effect_type`, source/target clause IDs, trạng thái cũ/mới, effective date, confidence và evidence. `apply` chỉ được Backend gọi sau khi Knowledge Manager approve.

### 6. Conflict detection và resolution

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/conflicts/detect` | Phát hiện conflict theo document/scope |
| GET | `/documents/{ai_document_id}/conflicts` | Conflict liên quan document |
| GET | `/conflicts/{ai_conflict_id}` | Detail/evidence |
| POST | `/conflicts/{ai_conflict_id}/review` | Approve/reject detection |
| PUT | `/conflicts/{ai_conflict_id}/resolution` | Ghi cách xử lý/nguồn ưu tiên |

Conflict types: `CONTRADICTORY_REQUIREMENT`, `DIFFERENT_THRESHOLD`, `DIFFERENT_DEADLINE`, `SCOPE_OVERLAP`, `VERSION_AMBIGUITY`, `EFFECTIVE_DATE_OVERLAP`.

Resolution có `status` (`UNRESOLVED`, `RESOLVED`, `ACCEPTED_EXCEPTION`), `preferred_clause_id`, `reason`, `resolved_by`, `resolved_at`.

### 7. Query nâng cao

```json
{
  "user_id": "user_001",
  "conversation_id": "conv_001",
  "question": "Quy định hiện hành là gì?",
  "scope": "INTERNAL",
  "as_of_date": "2026-07-18",
  "allowed_document_ids": ["ai_doc_001"],
  "retrieval_options": {
    "follow_references": true,
    "resolve_amendments": true,
    "exclude_repealed_clauses": true,
    "detect_conflicts": true,
    "include_superseded_sources": false,
    "max_reference_depth": 3
  }
}
```

Response bổ sung `applied_document_ids`, `excluded_clause_ids`, `followed_relation_ids`, `conflict_ids`, `warnings`, `resolution_trace`, source group và graph ID. `resolution_trace` giải thích tại sao clause mới được chọn và clause cũ bị loại.

### 8. Knowledge graph và retrieval graph

| Method | Endpoint | Graph |
|---|---|---|
| GET | `/documents/{ai_document_id}/knowledge-graph` | Document/version/clause/relation/conflict tổng thể |
| GET | `/documents/{ai_document_id}/relation-graph` | Quan hệ document-to-document |
| GET | `/queries/{ai_request_id}/retrieval-graph` | Đồ thị thực tế của một câu trả lời |
| GET | `/graphs/{ai_graph_id}` | Graph snapshot theo ID |

Graph request hỗ trợ `depth`, `node_types`, `relation_types`, `effective_at`, `include_conflicts`, `access_scope`. AI phải loại node/edge không được phép trước khi trả.

### 9. Metadata suggestion và review

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/documents/{ai_document_id}/metadata-suggestions` | Metadata AI trích xuất |
| POST | `/documents/{ai_document_id}/metadata-suggestions/review` | Approve/reject/correct |
| POST | `/documents/{ai_document_id}/refresh-metadata` | Đồng bộ metadata đã duyệt vào index |

### 10. Error contract

```json
{
  "error": {
    "code": "AI_DOCUMENT_NOT_FOUND",
    "message": "Document does not exist",
    "retryable": false,
    "details": {},
    "request_id": "req_001"
  }
}
```

Các code chính: `AI_UNAVAILABLE`, `AI_TIMEOUT`, `INGESTION_FAILED`, `OCR_FAILED`, `INDEX_FAILED`, `DOCUMENT_NOT_FOUND`, `CHUNK_NOT_FOUND`, `GRAPH_NOT_FOUND`, `ACCESS_DENIED`, `INVALID_SCOPE`, `RELATION_CONFLICT`, `JOB_NOT_READY`.
