# Nhật ký thay đổi và quyết định

## 2026-07-18 — Chuẩn hóa actor ngân hàng

- Ánh xạ `knowledge_manager` thành actor Chuyên gia Pháp chế thuộc Phòng Pháp chế/Khối Tuân thủ.
- Ánh xạ `bank_employee` thành Nhân viên Nghiệp vụ gồm RM, Giao dịch viên và Tín dụng.
- Giữ `customer` là Khách hàng B2C và `system_admin` là Quản trị hệ thống.
- Giữ nguyên role code trong JWT/DB/API; chỉ thay tên nghiệp vụ hiển thị.
- Bổ sung tài liệu `ACTORS.md` và quy tắc phân đoạn `PUBLIC/INTERNAL`.

## 2026-07-18 — PostgreSQL, R2 và deploy Render

- Chuyển database production sang PostgreSQL; SQLite chỉ giữ cho test.
- Runtime SQLAlchemy dùng `asyncpg`; Alembic chuyển URL sang driver đồng bộ `psycopg`.
- Thêm cấu hình `DATABASE_SSL` cho PostgreSQL hosted.
- Tương thích Supabase/PgBouncer transaction mode bằng cách tắt asyncpg/SQLAlchemy prepared-statement cache, tạo tên statement duy nhất và dùng `NullPool`.
- Pin Python Render ở `3.11.11` và dùng `psycopg[binary]==3.2.10` tương thích môi trường build.
- Production storage dùng `R2StorageAdapter`; credential chỉ cấu hình qua environment variables, không commit `.env.product`.
- Backend Render hiện dùng URL `https://vaic2026.onrender.com`; Frontend production fallback dùng `https://vaic2026.onrender.com/api/v1`.
- Trong thời gian AI Service chưa có, giữ `AI_PROVIDER=mock`; không bắt buộc `AI_SERVICE_URL` phải truy cập được.
- Health check đúng là `GET /health`, không phải `/healthz`.

## 2026-07-18 — Mở rộng contract nghiệp vụ AI

- Bổ sung API clause/chunk theo document cho Bank Employee và Knowledge Manager.
- Bổ sung relation types cho tham chiếu, sửa đổi, bổ sung, thay thế, bãi bỏ và hợp nhất.
- Bổ sung impact analysis, conflict detection/resolution, effective snapshot và graph APIs.
- Phân biệt endpoint đã có với contract cần triển khai.
- Bổ sung schema dự kiến cho clause ref, conflict ref và các workflow review.
- Backend đã thêm migration `0003_ai_governance`, AI mock methods và các API document clause/chunk/graph, relation detection/review, conflict detection/resolution và impact analysis.

## 2026-07-18 — Auth/User và Guest Public Chat

- Chốt bcrypt thay cho MD5/client hash.
- Thêm customer signup; email nullable.
- Mỗi user đúng một role; unique `auth_user_roles.user_id`.
- Thêm refresh rotation, logout-all, profile và change password.
- Root route trở thành Guest Public Chat khi chưa đăng nhập.
- Guest query dùng PUBLIC scope; history chỉ localStorage; không tạo conversation DB.
- Guest source/graph dùng short-lived guest access token.
- Thêm migration `0002_auth_guest` và cập nhật tài liệu password.

## Trước đó — Backend POC

- Tạo FastAPI/SQLAlchemy/Alembic backend độc lập trong `solution/backend`.
- Tạo storage abstraction local và AI adapter mock.
- Tách metadata/file/workflow/audit backend khỏi parsed/chunk/graph AI.
- Frontend API mặc định gọi localhost Backend.

## Quy tắc cập nhật tiếp theo

Mỗi thay đổi contract phải ghi ngày, lý do, endpoint/schema bị ảnh hưởng, migration cần chạy và test nghiệm thu. Không sửa âm thầm tài liệu này.
