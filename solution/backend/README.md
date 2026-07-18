# SHB Advanced RAG Backend

PostgreSQL is the deployment database. SQLite is only a test/POC fallback by setting `DATABASE_URL` explicitly. Use `.env.product` as the production configuration template and fill all placeholders before starting the service.

Backend POC cho hệ thống Advanced RAG Knowledge Base, xây bằng FastAPI, SQLAlchemy 2 và SQLite. Backend quản lý xác thực, phân quyền, metadata tài liệu, file gốc, hội thoại, workflow và audit. Nội dung đã parse, clause/chunk, embedding, index, graph và source content thuộc AI/RAG Service; SQLite chỉ lưu ID tham chiếu.

## Chạy local

Yêu cầu Python 3.11 trở lên.

```powershell
cd solution/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Swagger UI: `http://localhost:8000/docs`. Health check: `GET /health`.

Tài khoản development (mật khẩu chung `password`):

| Username | Role |
|---|---|
| `customer` | Customer |
| `employee` | Bank Employee |
| `knowledge` | Knowledge Manager |
| `admin` | System Admin |

Đổi `JWT_SECRET_KEY` và mật khẩu seed trước khi dùng ngoài môi trường development.

## Kiến trúc dữ liệu

- Backend lưu file gốc qua `StorageService`, hiện tại tại `storage/documents/{document_id}/{version}/original.ext`.
- Database chỉ lưu `storage_key`, checksum và metadata file, không lưu binary.
- Source của câu trả lời chỉ lưu `ai_source_group_id` và `ai_chunk_id`.
- Retrieval graph chỉ lưu `ai_graph_id`; node/edge được lấy từ AI Service khi người dùng mở graph.
- `MockAIServiceAdapter` mô phỏng contract ingest/query/source/graph/reindex. Thay adapter này bằng HTTP client không yêu cầu đổi API hoặc schema nghiệp vụ.
- Tên bảng có prefix `auth_`, `knowledge_`, `ai_ref_`, `conversation_`, `workflow_` vì SQLite không hỗ trợ schema như PostgreSQL.

`R2StorageAdapter` đã có boundary và cấu hình môi trường, nhưng cố ý fail-fast trong POC vì chưa cài S3 client. Khi triển khai R2, bổ sung implementation vào adapter rồi đặt `STORAGE_BACKEND=r2`; database schema không đổi.

## API chính

- Auth: `/api/v1/auth/login`, `/refresh`, `/logout`, `/me`.
- Documents: `/api/v1/documents` và các route detail/download/versions/timeline/relations.
- Knowledge Manager: `/api/v1/knowledge/documents`, upload/update file/metadata/expire/reindex/bulk-reindex và `/api/v1/knowledge/jobs/{id}`.
- Conversations: `/api/v1/conversations` và `/messages`.
- Sources/graph: `/api/v1/source-chunks/{ai_chunk_id}`, `/api/v1/messages/{id}/retrieval-graph`.
- Admin: `/api/v1/admin/users`, `/roles`, `/audit-logs`.

Các endpoint nghiệp vụ đều yêu cầu Bearer access token. Refresh token dạng opaque chỉ được lưu dưới dạng SHA-256 hash và có thể bị revoke khi logout.

## Migration và kiểm tra

```powershell
alembic upgrade head
pytest
ruff check app tests migrations
mypy app
python -m compileall app
```

Migration đầu tiên tạo toàn bộ metadata từ SQLAlchemy. Khi thay đổi schema tiếp theo, tạo revision Alembic riêng thay vì sửa database thủ công.

## Cấu trúc

```text
app/
├── api/v1/          # HTTP routers
├── services/        # security, storage và AI adapters
├── config.py        # environment settings
├── database.py      # async SQLAlchemy session
├── dependencies.py  # JWT, role và permission guards
├── models.py        # Backend-only persistence models
├── schemas.py       # request/response contracts
├── seed.py          # roles, permissions và demo data
└── main.py          # FastAPI app, CORS và audit middleware
```
