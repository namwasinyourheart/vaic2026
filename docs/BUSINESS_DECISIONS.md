# Các nghiệp vụ đã chốt

Tài liệu này ghi quyết định đã thống nhất, không phải danh sách đề xuất.

## Phạm vi dữ liệu

- Backend là chủ sở hữu user, role, permission, session, conversation của user, message hỏi/đáp, metadata tài liệu, file gốc, version, workflow và audit.
- AI/RAG Service là chủ sở hữu parsed document, clause, chunk content, embedding, vector index, graph node/edge và source content.
- Backend chỉ lưu ID tham chiếu AI (`ai_document_id`, `ai_chunk_id`, `ai_graph_id`, `ai_job_id`) cùng trạng thái đồng bộ.
- Source text không được lưu trong message, source ref hoặc audit JSON.

## Authentication và user

- Login nhận `username` + `password`; không dùng `password_md5`.
- Password hash bằng bcrypt, không lưu plain text/MD5.
- Username chuẩn hóa lowercase.
- Email đăng ký Customer là tùy chọn; nếu có phải hợp lệ và không trùng.
- Customer tự đăng ký; Backend tự gán role `customer`, client không gửi role/status.
- Một user chỉ có một role. Bảng mapping vẫn là `auth_user_roles` nhưng `user_id` unique.
- Admin thay role hiện tại trong transaction, không gán danh sách role.
- User bị `LOCKED` không thể login, refresh hoặc gọi protected API.
- Đổi mật khẩu yêu cầu mật khẩu hiện tại và thu hồi toàn bộ refresh sessions.
- Refresh token rotation: token cũ bị revoke trước khi token mới được phát.

## Guest Public Chat

- Chưa đăng nhập mở `/` vào Public Chat.
- Guest được hỏi thật trong scope `PUBLIC`, không được truyền/nâng scope thành `INTERNAL`.
- Guest history chỉ lưu localStorage key `shb-rag-guest-chat-v1`.
- Guest không tạo record trong `conversation_conversations`, `conversation_messages`, `conversation_source_groups`, `conversation_source_refs`.
- Source/Graph guest dùng JWT ngắn hạn `guest_access_token` ràng buộc request, group, graph và chunk IDs.
- Hết hạn token không xóa lịch sử local; muốn lấy source/graph lại phải hỏi lại.
- Không tự nhập lịch sử Guest vào account sau login.

## Tài liệu và ingestion

- File gốc đi qua StorageService; POC lưu local tại `solution/backend/storage`.
- Chỉ nhận PDF, DOCX và ảnh scan theo MIME/extension/size.
- Upload tạo document, version, document_file và processing job trong Backend.
- Backend gọi AI adapter dạng background task sau khi lưu file.
- Parsed/OCR/chunk/index thuộc AI; Backend theo dõi trạng thái job.
- Re-index đơn hoặc batch tạo workflow job và cập nhật `index_status`.

## Phân quyền dữ liệu

- Permission được kiểm tra tại Backend, không chỉ ẩn nút Frontend.
- Customer chỉ xem tài liệu PUBLIC.
- User chỉ đọc/sửa conversation của chính mình.
- Download file phải qua Backend để kiểm tra quyền và audit.
