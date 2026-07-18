# Actors and Data Segmentation

Hệ thống sử dụng mô hình Hybrid gồm B2C (ngân hàng với khách hàng) và B2E (ngân hàng với nhân viên). Mỗi tài khoản chỉ có một role kỹ thuật; tên actor là tên nghiệp vụ hiển thị.

## Bảng mô tả actor

| Actor nghiệp vụ | Role kỹ thuật | Vị trí thực tế trong ngân hàng | Trách nhiệm chính |
|---|---|---|---|
| **Chuyên gia Pháp chế** | `knowledge_manager` | Phòng Pháp chế / Khối Tuân thủ (Compliance) | Quản trị kho tri thức; cập nhật văn bản, metadata và hiệu lực; định nghĩa/duyệt quan hệ; xử lý xung đột; yêu cầu re-index. |
| **Nhân viên Nghiệp vụ** | `bank_employee` | RM, Giao dịch viên, Tín dụng và các đơn vị nghiệp vụ | Tra cứu chính sách, quy trình nội bộ và hướng dẫn nghiệp vụ phục vụ công việc hằng ngày. |
| **Khách hàng** | `customer` | Khách hàng cá nhân hoặc doanh nghiệp | Tra cứu dịch vụ, biểu mẫu và quy định công khai được ngân hàng cho phép tiếp cận. |
| **Quản trị hệ thống** | `system_admin` | CNTT, DevOps hoặc An toàn thông tin | Quản lý tài khoản, RBAC, khóa/mở tài khoản, audit log và vận hành hệ thống. |

Các mã role không được đổi vì đang được sử dụng trong JWT, database, Backend permission guards, API response và Frontend routes.

## Phạm vi dữ liệu

| Actor | Scope truy vấn | Dữ liệu được phép |
|---|---|---|
| Guest | `PUBLIC` bắt buộc | Tài liệu công khai; lịch sử chỉ ở trình duyệt |
| Khách hàng | `PUBLIC` bắt buộc | Tài liệu và source công khai |
| Nhân viên Nghiệp vụ | `INTERNAL` theo ACL | Dữ liệu công khai và tài liệu nội bộ được cấp quyền |
| Chuyên gia Pháp chế | `INTERNAL` theo permission | Kho tài liệu phục vụ quản trị tri thức, hiệu lực, quan hệ và xung đột |
| Quản trị hệ thống | Không mặc định đọc nội dung nghiệp vụ | User, role, permission, audit và trạng thái vận hành |

## Quy tắc phân đoạn dữ liệu

1. Mỗi tài liệu Backend có `access_scope` bằng `PUBLIC` hoặc `INTERNAL`.
2. Guest và Customer không được gửi hoặc nâng scope lên `INTERNAL`.
3. Backend kiểm tra role, permission, ownership và document ACL trước khi gọi AI Service.
4. Backend truyền scope/ACL context sang AI; AI phải lọc lại trước retrieval và trước khi trả source/graph.
5. Source, chunk và graph không được trả chỉ vì người dùng biết ID.
6. Node/edge không được phép phải bị loại hoặc mask khỏi graph.
7. File download luôn qua Backend để kiểm tra quyền và ghi audit.
8. Audit không lưu password, file binary, parsed text hoặc source/chunk content.

## Tình huống nghiệp vụ

### Chuyên gia Pháp chế

Khi có thông tư mới, Chuyên gia Pháp chế tải văn bản lên workspace quản lý tri thức, chọn `PUBLIC` hoặc `INTERNAL`, kiểm tra metadata/điều khoản/quan hệ do AI phát hiện, xử lý cảnh báo xung đột và yêu cầu re-index. Phạm vi công khai hay nội bộ phải được chọn theo chính sách ngân hàng; một file không đồng thời mang hai scope trong model hiện tại.

### Nhân viên Nghiệp vụ

RM có thể hỏi về điều kiện ưu đãi cho doanh nghiệp. Backend xác nhận tài khoản và quyền nội bộ, AI truy xuất cả nguồn công khai lẫn tài liệu nội bộ được phép, sau đó trả câu trả lời kèm source ID. Nội dung source chỉ được lấy khi người dùng mở Sources và vượt qua kiểm tra quyền lần nữa.

### Khách hàng

Khách hàng hỏi thủ tục vay mua nhà. Query bị giới hạn ở `PUBLIC`; quy trình chấm điểm tín dụng hoặc tài liệu nội bộ không được truy xuất, xuất hiện trong source hay graph.

### Quản trị hệ thống

Quản trị viên quản lý tài khoản, một role duy nhất cho mỗi user, ma trận quyền và audit log. Quản trị hệ thống không mặc nhiên là Chuyên gia Pháp chế và không được dùng role admin để bỏ qua phân đoạn nội dung nghiệp vụ.
