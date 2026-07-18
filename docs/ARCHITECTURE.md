# Kiến trúc hệ thống

```text
Browser (React/Vite)
        │ HTTPS/JSON, multipart, JWT hoặc guest token
        ▼
Backend FastAPI
 ├─ Auth/permission
 ├─ Conversation & message persistence
 ├─ Document metadata/version/file workflow
 ├─ PostgreSQL production / SQLite test
 ├─ R2 production / Local StorageService development
 └─ AIServiceAdapter
        │ internal contract, chỉ ID + trạng thái; query/source/graph trả content từ AI
        ▼
AI/RAG Service
 ├─ OCR/parse/clause/chunk
 ├─ embeddings/vector index
 ├─ retrieval/cross-reference/version filtering
 ├─ source content
 └─ knowledge graph
```

## Nguyên tắc phân ranh giới

| Dữ liệu | Backend | AI/RAG |
|---|---:|---:|
| User/password/session/role | Có | Không |
| Câu hỏi/câu trả lời account | Có | Xử lý tạm |
| Guest history | Không | Không lưu lịch sử |
| File binary gốc | Có qua StorageService | Đọc để ingest |
| Document metadata/version | Có | Có bản index riêng nếu cần |
| Parsed text/clause/chunk | ID tham chiếu | Có |
| Embedding/vector index | Không | Có |
| Graph node/edge/content | Chỉ graph ID | Có |
| Audit | Có | Có log nội bộ riêng nếu cần |

## Luồng request account

1. FE gửi access token.
2. Backend giải mã JWT và kiểm tra user ACTIVE.
3. Endpoint kiểm tra role/permission và ownership/access scope.
4. Backend đọc/ghi PostgreSQL (SQLite trong test) và gọi AI adapter khi cần.
5. Response không expose `storage_key`, password hash hoặc source text không được phép.

## Luồng request guest

1. FE tạo `guest_session_id` trong browser.
2. FE gọi `/public/chat`; Backend ép `scope=PUBLIC`.
3. AI trả answer, source IDs và graph ID.
4. Backend ký guest token có hạn, không ghi conversation DB.
5. FE lưu response trong localStorage và dùng token gọi source/graph.

## Luồng thay AI thật

Component không đổi. Khi AI Service sẵn sàng, thay `MockAIServiceAdapter` bằng HTTP adapter thực hiện contract trong [API_BE_AI.md](API_BE_AI.md). Production chọn R2 bằng `STORAGE_BACKEND=r2`; việc đổi adapter không làm đổi schema `knowledge_document_files`.

## Trạng thái adapter khi deploy

```text
Frontend production → https://vaic2026.onrender.com/api/v1
Backend             → PostgreSQL qua asyncpg/PgBouncer-safe config
Backend file        → Cloudflare R2 khi STORAGE_BACKEND=r2
Backend AI          → MockAIServiceAdapter khi AI_PROVIDER=mock
```

Backend không gọi `AI_SERVICE_URL` khi đang chạy mock. Biến URL được giữ để chuyển sang HTTP AI adapter sau này.
