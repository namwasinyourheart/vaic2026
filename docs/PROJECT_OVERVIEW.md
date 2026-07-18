# Thông tin dự án

## Tên đề tài

**Advanced RAG Knowledge Base — AI Chatbot for Complex Banking Document Retrieval**

Tên hệ thống sử dụng trong sản phẩm: **SHB Advanced RAG Knowledge Base**.

## Đơn vị/lĩnh vực

- Đơn vị: SHB Bank.
- Lĩnh vực: Ngân hàng & Tài chính.
- Đối tượng: khách hàng và nhân viên ngân hàng; nhóm quản lý tri thức và quản trị hệ thống.

## Mô tả

Hệ thống Retrieval-Augmented Generation cho phép hỏi bằng ngôn ngữ tự nhiên trên kho tài liệu ngân hàng: chính sách nội bộ, quy định, thông tư, công văn, quy trình vận hành, biểu mẫu hợp đồng và tài liệu liên quan.

Điểm khác biệt nghiệp vụ:

- **Cross-reference:** lần theo tài liệu được tham chiếu để trả lời đủ ngữ cảnh.
- **Amendment:** ưu tiên phiên bản mới nhất của văn bản sửa đổi.
- **Partial supersession:** loại trừ điều khoản đã bị thay thế một phần.
- **Conflicting regulations:** phát hiện và cảnh báo mâu thuẫn giữa các nguồn.
- **Source-cited answer:** câu trả lời có source ID để lấy nội dung chi tiết từ AI Service.

## Mục tiêu

1. Giúp người dùng tìm quy định đúng và còn hiệu lực.
2. Giảm thời gian tra cứu, onboarding và kiểm tra compliance.
3. Duy trì lịch sử hội thoại, version, timeline và quan hệ tài liệu cho user đã đăng nhập.
4. Không đưa parsed text, chunk text, embedding hoặc graph content vào Backend DB.

## Vai trò

Mỗi tài khoản chỉ có **một role**:

| Role | Không gian làm việc |
|---|---|
| `customer` | Chat phạm vi PUBLIC, tài liệu public |
| `bank_employee` | Chat và tra cứu tài liệu nội bộ được cấp quyền |
| `knowledge_manager` | Upload, metadata, version, expire, relation, re-index |
| `system_admin` | User, role-permission matrix, audit |

## Công nghệ hiện tại

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS hiện hữu.
- Backend: FastAPI, Pydantic Settings, SQLAlchemy 2.x async, Alembic, SQLite.
- Auth: JWT access token, opaque refresh token hash, bcrypt.
- Storage: `LocalStorageAdapter`; có abstraction để chuyển Cloudflare R2.
- AI: `AIServiceAdapter`; hiện tại `MockAIServiceAdapter`.

## Ngoài phạm vi hiện tại

SSO/OTP, approval workflow nhiều bước, vector database/graph database thật, OCR/embedding/index thật và R2 production chưa được tích hợp.
