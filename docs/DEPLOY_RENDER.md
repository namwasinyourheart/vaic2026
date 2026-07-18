# Deploy lên Render

## Trước khi deploy

1. Rotate PostgreSQL password, R2 access key/secret và JWT secret nếu từng đưa vào file/chat/git.
2. Không commit `.env`, `.env.product` hoặc credential.
3. Push `render.yaml` và source code lên repository mà Render truy cập được.

## Deploy bằng Blueprint

1. Render Dashboard → **New** → **Blueprint**.
2. Chọn repository và file `render.yaml` ở root.
3. Blueprint tạo `shb-rag-backend` và `shb-rag-frontend`.
4. Điền các biến `sync: false`.

Backend:

```env
DATABASE_URL=postgresql://USER:URL_ENCODED_PASSWORD@HOST:PORT/DATABASE
FRONTEND_ORIGINS=https://shb-rag-frontend.onrender.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
```

Frontend:

```env
VITE_API_URL=https://shb-rag-backend.onrender.com/api/v1
```

`AI_PROVIDER=mock` được giữ đến khi AI Service thật có sẵn. `DATABASE_SSL=true`, migration, seed, health check và SPA rewrite đã nằm trong Blueprint.

## Kiểm tra sau deploy

1. `GET https://shb-rag-backend.onrender.com/health` trả `status=ok`, `database=postgresql`, `storage=r2`, `ai_provider=mock`.
2. Mở `/docs` để kiểm tra OpenAPI.
3. Login `customer/password` và `admin/password`; đổi mật khẩu demo trước khi dùng thật.
4. Upload một file nhỏ bằng Knowledge Manager, tải lại để xác nhận R2.
5. Mở frontend, signup không email, login, Guest Chat và protected route.

## Lệnh Render Blueprint đang dùng

Backend build: `pip install -r requirements.txt`.

Backend start: `alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Frontend build: `npm ci && npm run build`; publish `dist`; route `/*` rewrite về `/index.html`.
