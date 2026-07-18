# Lumina Backend

FastAPI backend cho sản phẩm **Lumina – AI Assistant for Enterprise Knowledge** – nền tảng tra cứu tri thức doanh nghiệp bằng AI.

Ngân hàng quản lý hàng nghìn văn bản nội bộ, thông tư, quy định và hợp đồng với vòng đời phức tạp: mỗi điều khoản có thể được sửa đổi nhiều lần, bị thay thế một phần, hoặc mâu thuẫn với quy định mới hơn. RAG thông thường không phân biệt được câu trả lời đúng với câu trả lời đến từ quy định đã hết hiệu lực. Backend này được thiết kế để giải quyết chính xác bài toán đó.

Backend chịu trách nhiệm: xác thực, phân quyền, quản lý người dùng, metadata tài liệu, lưu trữ file gốc, lịch sử hội thoại, trạng thái workflow, tham chiếu AI và nhật ký kiểm toán. Toàn bộ nội dung văn bản đã phân tích, chunk text, embedding và graph node thuộc về AI/RAG Service độc lập và không được lưu vào database của Backend.

## Tại sao kiến trúc được tách thành hai service?

Việc tách Backend và AI/RAG Service qua **Internal API** (`/internal/v1`) có chủ đích:

- Backend đảm bảo mọi câu hỏi đều đi qua lớp xác thực và kiểm tra quyền trước khi chạm vào dữ liệu AI.
- AI/RAG Service có thể được nâng cấp, thay thế mô hình hoặc mở rộng độc lập mà không ảnh hưởng đến lớp nghiệp vụ.
- Mock AI adapter cho phép toàn bộ luồng nghiệp vụ (upload → xử lý → chat → sources → graph) hoạt động và kiểm thử được ngay cả khi AI thực chưa sẵn sàng.

## Grounding và độ tin cậy của câu trả lời

Mỗi câu trả lời AI được Backend liên kết với tập hợp **Source Groups** – các chunk văn bản thực tế được sử dụng, kèm theo:

- Tên văn bản, số hiệu, điều khoản cụ thể.
- Trạng thái hiệu lực tại thời điểm truy vấn (`EFFECTIVE`, `SUPERSEDED`, `EXPIRED`).
- Cảnh báo nếu chunk đến từ phần điều khoản có mâu thuẫn đã được phát hiện.

Nguồn không được nhúng trực tiếp vào câu trả lời mà nằm trong panel Sources riêng, theo từng câu hỏi, để người dùng có thể kiểm chứng độc lập.

## Bảo mật và kiểm soát truy cập

- Mật khẩu được hash bằng bcrypt; refresh token chỉ lưu SHA-256 hash.
- Refresh token được rotate mỗi lần dùng; phiên cũ bị thu hồi tức thì.
- Mỗi người dùng có đúng một vai trò; permission được kiểm tra tại Backend bất kể Frontend.
- Mọi thao tác nhạy cảm được ghi vào bảng `audit_logs` với đầy đủ actor, action, resource và timestamp.
- Khách vãng lai (Guest) được cấp token tạm thời giới hạn phạm vi `PUBLIC` và không được ghi lịch sử.

## Sẵn sàng pilot

Hệ thống có thể demo toàn bộ luồng nghiệp vụ với bốn vai trò (Customer, Bank Employee, Knowledge Manager, System Admin) ngay sau khi chạy `python -m app.seed`. Mọi thành phần production – Supabase PostgreSQL, Cloudflare R2, Render Web Service – đã được cấu hình và kiểm tra. Khi AI Service thực tế sẵn sàng, chỉ cần đổi `AI_PROVIDER=real` và trỏ `AI_SERVICE_URL`.

## Technology stack

- Python 3.11
- FastAPI and Uvicorn
- SQLAlchemy 2.x with async sessions
- PostgreSQL in production through `asyncpg`
- SQLite only for automated tests
- Alembic migrations through `psycopg`
- JWT access tokens and rotating refresh tokens
- bcrypt password hashing
- Local filesystem and Cloudflare R2 storage adapters
- Mock AI adapter until the real AI/RAG service is available

## Responsibilities

The Backend stores:

- users, one role per user, permissions, and sessions;
- account conversation messages and feedback;
- document metadata, versions, keywords, access rules, and file references;
- original files through `StorageService`;
- AI document, version, chunk, clause, relation, conflict, graph, and job IDs;
- ingestion, re-index, review, impact-analysis, and audit state.

The Backend does **not** store:

- plain-text passwords or MD5 hashes;
- file binaries inside PostgreSQL;
- parsed document bodies or source/chunk text;
- embeddings, vector indexes, or graph nodes and edges;
- Guest Chat history.

## Project structure

```text
solution/backend/
├── app/
│   ├── api/v1/          # Auth, conversations, documents, knowledge, sources, admin
│   ├── services/        # Security, storage, AI adapter, ingestion services
│   ├── config.py        # Environment configuration
│   ├── database.py      # Async SQLAlchemy engine and sessions
│   ├── dependencies.py  # JWT, role, and permission guards
│   ├── models.py        # Backend persistence models
│   ├── schemas.py       # Pydantic request/response models
│   ├── seed.py          # Roles, permissions, users, and demo data
│   └── main.py          # FastAPI application, CORS, health, and audit middleware
├── migrations/          # Alembic revisions
├── storage/             # Local development storage
├── tests/               # Unit and API tests
├── .env.example
├── alembic.ini
└── requirements.txt
```

## Local setup

Requirements:

- Python 3.11
- PostgreSQL, unless running the test suite with SQLite

On Windows PowerShell:

```powershell
cd solution/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `DATABASE_URL` and other local settings in `.env`, then run:

```powershell
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Available endpoints:

- API base: `http://localhost:8000/api/v1`
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`
- Health check: `http://localhost:8000/health`

## Environment variables

Copy `.env.example` for local development. Never commit `.env`, `.env.product`, database credentials, JWT secrets, or R2 secrets.

| Variable | Required | Description |
|---|---:|---|
| `ENVIRONMENT` | Yes | `development`, `test`, or `production` |
| `DATABASE_URL` | Yes | PostgreSQL URL; `postgresql://` is normalized to asyncpg automatically |
| `DATABASE_SSL` | Production | Enables required SSL for hosted PostgreSQL |
| `JWT_SECRET_KEY` | Yes | Secret used to sign account and Guest JWTs |
| `JWT_ALGORITHM` | Yes | Currently `HS256` |
| `ACCESS_TOKEN_MINUTES` | Yes | Access-token lifetime |
| `REFRESH_TOKEN_DAYS` | Yes | Refresh-token lifetime |
| `STORAGE_BACKEND` | Yes | `local` or `r2` |
| `LOCAL_STORAGE_PATH` | Local | Local adapter root directory |
| `MAX_UPLOAD_BYTES` | Yes | Maximum accepted upload size |
| `AI_PROVIDER` | Yes | Use `mock` until the real service is integrated |
| `AI_SERVICE_URL` | Real AI only | Internal AI/RAG base URL |
| `FRONTEND_ORIGINS` | Yes | Comma-separated CORS origins |
| `R2_ACCESS_KEY_ID` | R2 | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 | Cloudflare R2 secret |
| `R2_BUCKET` | R2 | Bucket containing original documents |
| `R2_ENDPOINT` | R2 | S3-compatible R2 endpoint |

When `AI_PROVIDER=mock`, the Backend does not require a reachable `AI_SERVICE_URL`. Mock responses preserve the external-ID contract but do not perform real OCR, retrieval, conflict detection, or graph generation.

## Authentication and authorization

- Login accepts `username` and `password`.
- Passwords are hashed with bcrypt.
- Access uses JWT Bearer tokens.
- Only the SHA-256 hash of each refresh token is stored.
- Refresh tokens are rotated and the old session is revoked.
- Every user has exactly one role.
- Protected endpoints enforce permissions in the Backend, independently of the Frontend menu.
- Locked or soft-deleted users cannot access protected APIs.

Customer registration is available at `POST /api/v1/auth/sign-up`. Email is optional and the Backend always assigns the `customer` role.

## Guest Public Chat

Guest requests use `POST /api/v1/public/chat`. The Backend forces the query scope to `PUBLIC`, does not write Guest questions, answers, or conversations to PostgreSQL, and returns a short-lived Guest token for the corresponding public source group and graph.

Guest source and graph endpoints validate that the requested IDs belong to the token claims before calling the AI adapter.

## Main API groups

| Group | Prefix | Purpose |
|---|---|---|
| Authentication | `/api/v1/auth` | Login, signup, refresh, logout, profile, password |
| Public | `/api/v1/public` | Guest Chat, public source chunks, public graphs |
| Conversations | `/api/v1/conversations` | Account conversation CRUD and messages |
| Documents | `/api/v1/documents` | Search, detail, download, versions, timeline, clauses, chunks, graphs |
| Knowledge Manager | `/api/v1/knowledge` | Upload, metadata, expiry, re-index, relations, conflicts, impact analysis |
| Sources | `/api/v1/messages`, `/api/v1/source-chunks` | Account source groups, chunk details, retrieval graphs |
| Administration | `/api/v1/admin` | Users, roles, permissions, and audit logs |

Detailed contracts are documented in [`../../docs/API_FE_BE.md`](../../docs/API_FE_BE.md) and [`../../docs/API_BE_AI.md`](../../docs/API_BE_AI.md).

## Storage

`StorageService` supports two adapters:

- `LocalStorageAdapter` for local development and tests;
- `R2StorageAdapter` for production using the S3-compatible boto3 API.

PostgreSQL stores only the provider, bucket, key, MIME type, size, and SHA-256 checksum. Downloads pass through the Backend for authorization and auditing; storage keys are not exposed to the Frontend.

## Database and migrations

Run all migrations before starting a deployment:

```powershell
alembic upgrade head
```

Current revisions cover the initial schema, Auth/Guest changes, and AI-governance workflows. The application also calls `init_db()` as a POC startup safety net, but Alembic remains the deployment schema-version mechanism.

Hosted PostgreSQL transaction poolers are supported by disabling prepared-statement caches, generating unique prepared-statement names, and using SQLAlchemy `NullPool`.

The complete schema is documented in [`../../docs/DATABASE_SCHEMA.md`](../../docs/DATABASE_SCHEMA.md).

## Demo data

Run `python -m app.seed` to create or refresh development data. All demo users use the password `password`:

| Username | Role |
|---|---|
| `customer` | Customer |
| `employee` | Bank Employee |
| `knowledge` | Knowledge Manager |
| `admin` | System Admin |

The seed also creates sample document metadata, AI reference IDs, one Customer conversation, and an audit record. Replace demo credentials before any real deployment.

## Quality checks

```powershell
pytest
ruff check .
mypy app
python -m compileall app
```

The test suite covers security, storage, API behavior, role restrictions, Guest access, and AI-governance references.

## Render deployment

The current production Backend URL is `https://vaic2026.onrender.com`.

With `solution/backend` as the Render root directory:

```text
Build Command: pip install -r requirements.txt
Start Command: alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check: /health
```

Use PostgreSQL, `DATABASE_SSL=true`, `STORAGE_BACKEND=r2`, and `AI_PROVIDER=mock` until the real AI Service is ready. See [`../../docs/DEPLOY_RENDER.md`](../../docs/DEPLOY_RENDER.md) for the complete checklist.
