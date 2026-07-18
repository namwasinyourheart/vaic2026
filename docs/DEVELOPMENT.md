# Hướng dẫn phát triển

## Backend

PostgreSQL là database triển khai. `asyncpg` dùng cho application runtime và Alembic dùng driver đồng bộ `psycopg`. SQLite chỉ được dùng khi test bằng `DATABASE_URL=sqlite+aiosqlite:///./shb_rag_test.db`. File `.env.product` là template để điền connection PostgreSQL.

```powershell
cd solution/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`; health: `GET /health`.

Kiểm tra:

```powershell
python -m pytest -q
python -m compileall app
ruff check .
mypy app
```

## Frontend

```powershell
cd solution/frontend
npm install
npm run dev -- --host 0.0.0.0 --port 8443
```

Localhost mặc định gọi Backend tại `http://localhost:8000/api/v1`. Có thể override bằng `VITE_API_URL` trong `.env`.

Kiểm tra:

```powershell
npm run typecheck
npm run build
```

## Demo accounts

Seed development dùng password `password` cho các tài khoản demo; production phải đổi secret/password seed. Role demo: customer, bank employee, knowledge manager, system admin.

## Environment chính

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | SQLite hiện tại hoặc PostgreSQL tương lai |
| `JWT_SECRET_KEY` | Secret ký access/guest JWT |
| `ACCESS_TOKEN_MINUTES` | Tuổi access token |
| `REFRESH_TOKEN_DAYS` | Tuổi refresh token |
| `STORAGE_BACKEND` | `local` hoặc `r2` |
| `LOCAL_STORAGE_PATH` | Thư mục file POC |
| `MAX_UPLOAD_BYTES` | Giới hạn upload |
| `AI_SERVICE_URL` | Internal AI base URL |
| `FRONTEND_ORIGINS` | CORS origins |

## Migration

Trong giai đoạn AI Service chưa có, đặt `AI_PROVIDER=mock`. Backend vẫn tạo và lưu các external ID giả lập (`ai_document_id`, `ai_chunk_id`, `ai_graph_id`, `ai_job_id`) đúng contract. Khi AI Service sẵn sàng, thay adapter bằng HTTP implementation mà không đổi schema Frontend/Backend.

Với R2, điền `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` và đặt `STORAGE_BACKEND=r2`. Adapter dùng S3-compatible API của Cloudflare R2.

Mỗi thay đổi schema tạo revision mới. Migration `0002_auth_guest` đã:

- Cho phép `auth_users.email` NULL.
- Dọn mapping role trùng và tạo unique theo `user_id`.
- Unique refresh token hash.

Không dùng `create_all` để thay thế migration trong môi trường triển khai.
