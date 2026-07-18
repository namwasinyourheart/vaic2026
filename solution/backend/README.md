# Lumina Backend

Backend service for **Lumina – AI Assistant for Enterprise Knowledge**. Lumina provides secure enterprise knowledge retrieval for customers, staff, compliance officers, and system administrators.

The backend is an independent FastAPI application. It owns identity, authorization, conversations, document metadata, original files, workflow state, and audit records. Parsed document text, clauses, chunks, embeddings, vector indexes, graph nodes, graph edges, and source content remain in the AI/RAG service.

## Responsibilities and boundaries

### Backend owns

- Authentication, JWT access tokens, refresh-token rotation, logout, and customer registration.
- One-role-per-user RBAC for `ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_COMPLIANCE`, and `ROLE_ADMIN`.
- Conversation and message metadata, including assistant answers returned by the AI service.
- Document metadata, versions, lifecycle/effective status, and original uploaded files.
- Local or Cloudflare R2 file storage through the `StorageService` abstraction.
- Processing, re-index, metadata-review, and audit workflows.
- Authorization checks before every protected document, source, chunk, and graph request.

### AI/RAG service owns

- OCR, parsing, normalized document content, clauses and chunks.
- Embeddings, vector search, BM25 search, graph traversal, and retrieval ranking.
- Source/chunk text and retrieval graph content.
- Cross-reference, amendment, partial supersession, and conflict analysis.

The backend stores only AI identifiers and synchronization state (`ai_document_id`, `ai_chunk_id`, `ai_graph_id`, and job IDs). It never stores source text or embeddings in PostgreSQL.

## Technology

- Python 3.11+
- FastAPI and Uvicorn
- SQLAlchemy 2.x async ORM
- PostgreSQL with `asyncpg` in production
- SQLite with `aiosqlite` for isolated tests/POC
- Alembic migrations
- Pydantic Settings
- bcrypt password hashing
- PyJWT-compatible access and refresh tokens
- Local filesystem or Cloudflare R2 storage

## Project layout

```text
app/
├── main.py                 # FastAPI application, CORS, audit middleware
├── config.py               # Environment-backed settings
├── database.py             # Async engine, session, declarative base
├── models.py               # Auth, knowledge, workflow, AI-reference, audit models
├── schemas.py              # Request/response contracts
├── api/v1/                 # auth, conversations, documents, knowledge, sources, admin
├── services/               # security, storage, ingestion, AI adapter services
└── seed.py                 # Development seed command
migrations/                 # Alembic revisions; required for deployment
storage/                    # Local-only uploaded files (ignored by Git)
tests/                      # API and service tests
```

## Local setup

From `solution/backend`:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/macOS
```

Set `DATABASE_URL` to a local PostgreSQL instance or a SQLite test URL. Never place production credentials in `.env.example` or source code.

Run migrations and seed development data:

```bash
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Useful endpoints:

```text
GET  /health
GET  /docs
GET  /api/v1/openapi.json
```

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `APP_NAME` | No | FastAPI/OpenAPI title; defaults to the Lumina product name |
| `ENVIRONMENT` | No | `development`, `test`, or `production` |
| `DATABASE_URL` | Yes in deployment | PostgreSQL URL; Render/Supabase URLs are normalized to `asyncpg` |
| `DATABASE_SSL` | No | Enable SSL for hosted PostgreSQL |
| `JWT_SECRET_KEY` | Yes in production | Strong secret used to sign access tokens |
| `ACCESS_TOKEN_MINUTES` | No | Access-token lifetime |
| `REFRESH_TOKEN_DAYS` | No | Refresh-session lifetime |
| `STORAGE_BACKEND` | No | `local` or `r2` |
| `LOCAL_STORAGE_PATH` | No | Local storage directory for development |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` | Required for R2 | Cloudflare R2 connection settings |
| `AI_PROVIDER` | No | `mock` for the current POC; `real` when the AI adapter is available |
| `AI_SERVICE_URL` | No | Internal AI/RAG service base URL |
| `FRONTEND_ORIGINS` | Yes in deployment | Comma-separated allowed browser origins |

## Authentication and RBAC

The public ROLE_CUSTOMER registration endpoint is `POST /api/v1/auth/sign-up`. It accepts username, full name, optional email, and a user-selected password. The backend always assigns the `ROLE_CUSTOMER` role. Admin-created accounts use the default development password `vaic@2026`; this behavior is intended for the POC and should be replaced by an invitation/reset flow in production.

Technical role codes remain stable for database and API compatibility:

| Display name | Stable role code | Scope |
| --- | --- | --- |
| Customer | `ROLE_CUSTOMER` | Public data and own conversations |
| Staff | `ROLE_STAFF` | Internal staff retrieval and document reading |
| Compliance Officer | `ROLE_COMPLIANCE` | Document lifecycle, metadata, relations, and re-indexing |
| System Admin | `ROLE_ADMIN` | Users, roles, permissions, and audit logs |

The display names can change without a database migration. The role code must not be renamed without an explicit compatibility migration.

## API groups

- `/api/v1/auth`: login, registration, refresh rotation, logout, profile, and password change.
- `/api/v1/conversations`: authenticated conversation and message operations.
- `/api/v1/documents`: authorized document metadata, versions, timeline, relations, and downloads.
- `/api/v1/knowledge`: Compliance Officer upload, metadata, expiry, relation, and re-index workflows.
- `/api/v1/source-chunks` and retrieval graph endpoints: authorization-protected proxy calls to the AI adapter.
- `/api/v1/public`: guest public chat, public sources, and public graphs using short-lived guest tokens.
- `/api/v1/admin`: user CRUD, lock/unlock, password reset, role permissions, and audit logs.

All protected routes require a bearer access token. Customer requests are forced to `PUBLIC` scope; clients cannot elevate themselves to `INTERNAL`.

## Database and migrations

PostgreSQL is the deployment database. The `migrations/` directory is part of the application release and must be committed. Render runs:

```bash
alembic upgrade head
```

Migration files create and evolve `auth`, `knowledge`, `ai_ref`, `conversation`, `workflow`, and `audit` tables. Runtime source text, parsed content, embeddings, and graph payloads are deliberately absent from these schemas.

## Render deployment

Use `solution/backend` as the Render Root Directory:

```text
Build Command: pip install -r requirements.txt
Start Command: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check: /health
```

Set production secrets in Render Environment Variables. Do not run `app.seed` on every production restart because it is a development data initializer.

## Validation

```bash
python -m compileall app
pytest
ruff check .
mypy app
```

The test suite covers password hashing, JWTs, RBAC, migrations, storage adapters, document validation, guest scope isolation, source/graph authorization, and admin workflows.
