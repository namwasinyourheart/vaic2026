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

## Actor và role

Mỗi tài khoản chỉ có **một role**. Tên actor phản ánh vị trí nghiệp vụ, còn role code là contract kỹ thuật ổn định.

| Actor | Role | Vị trí thực tế | Không gian làm việc |
|---|---|---|---|
| Khách hàng | `customer` | Khách hàng cá nhân/doanh nghiệp | Chat và source phạm vi PUBLIC |
| Nhân viên Nghiệp vụ | `bank_employee` | RM, Giao dịch viên, Tín dụng | Chat/tra cứu INTERNAL theo ACL |
| Chuyên gia Pháp chế | `knowledge_manager` | Phòng Pháp chế/Khối Tuân thủ | Upload, metadata, hiệu lực, relation, conflict, re-index |
| Quản trị hệ thống | `system_admin` | CNTT/DevOps/An toàn thông tin | User, RBAC, audit và vận hành |

Xem quy tắc chi tiết tại [ACTORS.md](ACTORS.md).

## Công nghệ hiện tại

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS hiện hữu.
- Backend: FastAPI, Pydantic Settings, SQLAlchemy 2.x async, Alembic, PostgreSQL production; SQLite chỉ dùng trong test.
- Auth: JWT access token, opaque refresh token hash, bcrypt.
- Storage: `LocalStorageAdapter` cho development/test và `R2StorageAdapter` cho production.
- AI: `AIServiceAdapter`; hiện tại `MockAIServiceAdapter`.
- Deploy: Backend Render tại `https://vaic2026.onrender.com`; frontend dùng `VITE_API_URL` hoặc production fallback trỏ tới Backend này.

## Ngoài phạm vi hiện tại

SSO/OTP, approval workflow nhiều bước, AI Service thật, vector database/graph database thật và OCR/embedding/index thật chưa được tích hợp. R2 adapter đã có trong code nhưng việc vận hành phụ thuộc bộ credential/bucket được cấu hình trên môi trường deploy.
