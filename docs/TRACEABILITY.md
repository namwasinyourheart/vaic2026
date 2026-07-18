# Traceability: yêu cầu → implementation → kiểm tra

| Yêu cầu | Implementation hiện tại | Cách kiểm tra |
|---|---|---|
| Guest mở trang chủ | `App.tsx`, `GuestChatPage.tsx` | Mở `/` khi không có account session |
| Guest history local | `shb-rag-guest-chat-v1` trong GuestChatPage | Reload browser, kiểm tra localStorage |
| Guest chỉ PUBLIC | `public.py` gọi adapter với `scope="PUBLIC"` | POST public chat; không có field scope |
| Guest source/graph có hạn | `create_guest_access_token`, public endpoints | Dùng token sai group/chunk/graph phải 401/403 |
| Signup Customer | `/auth/sign-up`, `RegisterPage.tsx` | Signup không email; kiểm tra role customer |
| Password bcrypt | `services/security.py`, seed | `password_hash` bắt đầu `$2`; verify password |
| Một user một role | `UniqueConstraint` + migration 0002 | Thử thêm mapping thứ hai phải fail |
| Refresh rotation | `/auth/refresh` revoke old session | Token cũ refresh lần hai trả 401 |
| Locked user | `current_user`, login/refresh checks; admin lock revoke | Lock rồi gọi protected endpoint |
| File không lưu DB binary | `StorageService`, `document_files.storage_key` | DB chỉ có key/checksum; file nằm storage |
| AI chỉ giữ source/chunk/graph content | `AIServiceAdapter`; BE lưu external IDs | Inspect message/source ref models |
| Permission ở Backend | `require_permission`, `require_roles` | Customer gọi admin/upload phải 403 |
| Ingestion background | `documents.py` `BackgroundTasks` | Upload nhận job và xem processing-status |

## Known POC limitations

- Mock AI trả dữ liệu giả; chưa có OCR/vector/graph thật.
- Guest UI hiện là prototype; source/graph detail sẽ hoàn thiện khi AI API thật có schema ổn định.
- Production đã chuyển sang PostgreSQL; SQLite chỉ còn dùng cho test.
- AI Service thật chưa tồn tại nên source, graph, clause, conflict và impact analysis hiện do mock adapter trả dữ liệu mô phỏng.
- R2 adapter đã được triển khai nhưng cần kiểm tra upload/download thực tế sau mỗi lần thay credential hoặc bucket policy.
- Audit middleware hiện ghi request-level audit; production cần chuẩn hóa actor role, before/after và retention.
