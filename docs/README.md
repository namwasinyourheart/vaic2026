# SHB Advanced RAG Knowledge Base — Bộ tài liệu dự án

## Mục đích

Thư mục này là nguồn tài liệu kỹ thuật và nghiệp vụ dùng chung cho Frontend, Backend và AI/RAG Service. Các tài liệu được cập nhật cùng code; khi contract hoặc nghiệp vụ thay đổi phải cập nhật `CHANGELOG.md` và tài liệu liên quan trong cùng pull request.

## Danh mục

| Tài liệu | Nội dung |
|---|---|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Tên đề tài, mục tiêu, phạm vi, kiến trúc và vai trò |
| [ACTORS.md](ACTORS.md) | Actor nghiệp vụ, ánh xạ role và phân đoạn dữ liệu PUBLIC/INTERNAL |
| [BUSINESS_DECISIONS.md](BUSINESS_DECISIONS.md) | Các nghiệp vụ đã chốt trong quá trình làm |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Phân ranh giới FE/BE/AI, dữ liệu và luồng chính |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Bảng, cột, kiểu dữ liệu, khóa và quy tắc lưu trữ |
| [API_FE_BE.md](API_FE_BE.md) | Contract Frontend ↔ Backend |
| [API_BE_AI.md](API_BE_AI.md) | Contract Backend ↔ AI/RAG Service |
| [AUTH_AND_GUEST.md](AUTH_AND_GUEST.md) | Authentication, authorization, signup và Guest Chat |
| [WORKFLOWS.md](WORKFLOWS.md) | Luồng chat, upload, ingestion, re-index và admin |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Cách chạy, test, migration và cấu hình |
| [DEPLOY_RENDER.md](DEPLOY_RENDER.md) | Checklist và hướng dẫn deploy Render Blueprint |
| [TRACEABILITY.md](TRACEABILITY.md) | Đối chiếu yêu cầu, implementation và cách kiểm tra |
| [CHANGELOG.md](CHANGELOG.md) | Nhật ký quyết định/thay đổi, cập nhật liên tục |

## Quy ước nguồn sự thật

1. Yêu cầu UI/nghiệp vụ chi tiết: `solution/frontend/frontend.md`.
2. Ngữ cảnh trao đổi nghiệp vụ: `FULL_CONTEXT_EXPORT.md`.
3. Quy tắc user/auth: `AUTH_USER.md`.
4. API thực tế: mã FastAPI trong `solution/backend/app/api/v1` và client trong `solution/frontend/src/services/api.ts`.
5. Khi tài liệu và code lệch nhau, ghi nhận trong `CHANGELOG.md`, sau đó cập nhật contract theo implementation được duyệt.

## Trạng thái hiện tại (18/07/2026)

- Backend: FastAPI + SQLAlchemy async + Alembic; production dùng PostgreSQL, runtime driver `asyncpg` và cấu hình tương thích PgBouncer transaction pooling. SQLite chỉ dùng cho test.
- Storage: local adapter cho development/test; production được cấu hình dùng Cloudflare R2 qua S3-compatible API. Database chỉ lưu metadata và `storage_key`, không lưu binary.
- Frontend: React + Vite + TypeScript. Local development gọi `http://localhost:8000/api/v1`; production fallback gọi `https://vaic2026.onrender.com/api/v1` và vẫn có thể override bằng `VITE_API_URL` lúc build.
- Backend production URL: `https://vaic2026.onrender.com`; health check: `/health`; OpenAPI UI: `/docs`.
- AI Service thật chưa có, vì vậy deploy hiện tại phải dùng `AI_PROVIDER=mock`. Interface và ID contract BE ↔ AI đã sẵn sàng để thay bằng HTTP adapter.
- Auth: bcrypt, JWT access token, refresh token chỉ lưu SHA-256 hash và có rotation.
- Migration hiện tại: `0001_initial`, `0002_auth_guest`, `0003_ai_governance`.
