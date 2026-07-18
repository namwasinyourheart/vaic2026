# Deploy lên Render

Tài liệu này mô tả cấu hình đang dùng cho backend `https://vaic2026.onrender.com` và cách triển khai frontend trong monorepo.

## 1. Yêu cầu trước khi deploy

- Branch deploy hiện tại: `fe_be`.
- Không commit `.env`, `.env.product`, connection string, JWT secret hoặc R2 secret.
- Nếu secret từng xuất hiện trong chat, log, ảnh hoặc file local, phải rotate trước khi đưa hệ thống vào sử dụng.
- PostgreSQL phải truy cập được từ Render và bật SSL.
- R2 bucket và API token phải cho phép ít nhất `PutObject`, `GetObject`, `DeleteObject`, `HeadObject` trên bucket được cấu hình.
- AI Service chưa có: dùng `AI_PROVIDER=mock`.

## 2. Backend Web Service

| Mục Render | Giá trị |
|---|---|
| Name | `vaic2026` hoặc tên duy nhất khác |
| Language | Python 3 |
| Branch | `fe_be` |
| Region | Singapore |
| Root Directory | `solution/backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |
| Instance | Free phù hợp demo; có cold start và không có persistent disk |

Có thể chuyển `alembic upgrade head && python -m app.seed` sang **Pre-Deploy Command** nếu gói Render hỗ trợ. Khi đó Start Command chỉ còn lệnh `uvicorn`.

### Environment variables bắt buộc

| Biến | Giá trị/ghi chú |
|---|---|
| `PYTHON_VERSION` | `3.11.11` |
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | PostgreSQL URL do nhà cung cấp cấp; code tự đổi `postgresql://` sang asyncpg |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET_KEY` | Secret ngẫu nhiên dài, không dùng giá trị mẫu |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_MINUTES` | `30` |
| `REFRESH_TOKEN_DAYS` | `30` |
| `STORAGE_BACKEND` | `r2` |
| `MAX_UPLOAD_BYTES` | `52428800` |
| `AI_PROVIDER` | `mock` |
| `FRONTEND_ORIGINS` | Domain frontend chính xác, phân cách dấu phẩy nếu có nhiều domain |
| `R2_ACCESS_KEY_ID` | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | R2 API secret |
| `R2_BUCKET` | Tên bucket |
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |

`R2_ACCOUNT_ID` có thể lưu để quản trị cấu hình nhưng adapter hiện lấy endpoint trực tiếp và không bắt buộc biến này. `LOCAL_STORAGE_PATH` không được dùng khi `STORAGE_BACKEND=r2`. `AI_SERVICE_URL` không được gọi khi `AI_PROVIDER=mock`, nên có thể giữ URL mẫu cho đến khi HTTP AI adapter được triển khai.

### PostgreSQL qua PgBouncer/Supabase pooler

Application đã cấu hình phù hợp transaction pooling:

- `statement_cache_size=0`;
- `prepared_statement_cache_size=0`;
- tên prepared statement duy nhất;
- SQLAlchemy `NullPool` để tránh double pooling;
- SSL `require` khi `DATABASE_SSL=true`.

Không bỏ các cấu hình này nếu `DATABASE_URL` là pooler URL. Lỗi `DuplicatePreparedStatementError` thường cho biết Render đang chạy commit cũ hơn `14271f3` hoặc cấu hình database chưa được cập nhật.

## 3. Frontend Static Site

| Mục Render | Giá trị |
|---|---|
| Root Directory | `solution/frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment | `VITE_API_URL=https://vaic2026.onrender.com/api/v1` |
| Rewrite | `/*` → `/index.html` |

Frontend code cũng có production fallback tới URL trên, nhưng vẫn nên khai báo `VITE_API_URL` để URL môi trường được tường minh.

Sau khi có domain frontend, cập nhật `FRONTEND_ORIGINS` ở Backend. Không thêm dấu `/` cuối origin. Có thể dùng `*` tạm thời để chẩn đoán CORS, không nên giữ khi vận hành thật.

## 4. Blueprint

File [`render.yaml`](../render.yaml) đã chứa cả Static Site và Backend Web Service. Nếu dùng **New → Blueprint**, điền toàn bộ biến có `sync: false`. Nếu tạo service thủ công, dùng đúng bảng cấu hình ở trên.

## 5. Kiểm tra sau deploy

1. `GET https://vaic2026.onrender.com/health` phải trả `status=ok`, `database=postgresql`, `storage=r2`, `ai_provider=mock`.
2. Mở `https://vaic2026.onrender.com/docs` và kiểm tra OpenAPI tải được.
3. Kiểm tra login bốn tài khoản seed; mật khẩu demo chỉ dành cho development/demo.
4. Đăng ký Customer không nhập email và xác nhận role được gán là `customer`.
5. Dùng Knowledge Manager upload file nhỏ, tải lại file để xác nhận R2 hoạt động.
6. Gửi Guest Chat; xác nhận Backend không tạo conversation/message cho Guest.
7. Truy cập Sources/Graph Guest bằng token đúng và thử token sai để xác nhận bị từ chối.

## 6. Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân/cách xử lý |
|---|---|
| Build không tìm thấy psycopg binary | Deploy commit có `psycopg[binary]==3.2.10`, Python `3.11.11` |
| `DuplicatePreparedStatementError` | Deploy commit mới nhất có PgBouncer-safe database config; giữ transaction pooler settings |
| Health check 404 | Đường dẫn đúng là `/health`, không phải `/healthz` |
| Seed lỗi kết nối | Kiểm tra `DATABASE_URL`, password URL-encoded, `DATABASE_SSL=true`, network/pooler |
| Backend khởi động nhưng upload lỗi | Kiểm tra đủ bốn biến bắt buộc của R2 và quyền token/bucket |
| Frontend bị CORS | `FRONTEND_ORIGINS` phải đúng scheme + domain + port, không có path |
| AI URL không truy cập được | Khi chưa có AI Service, đặt `AI_PROVIDER=mock`; URL không được sử dụng |
| Free service phản hồi chậm lần đầu | Render Free bị sleep; chờ cold start rồi thử lại |

## 7. Quy tắc seed và migration

- `alembic upgrade head` là cơ chế version schema chính.
- `python -m app.seed` được thiết kế chạy lặp lại để tạo/cập nhật dữ liệu demo cần thiết.
- App hiện vẫn gọi `init_db()` lúc startup như lớp an toàn cho POC; không xem đây là thay thế cho Alembic.
- Không chạy script local có `drop_all` hoặc connection string hard-code trên production.
