# TÀI LIỆU MÔ TẢ GIAO DIỆN

## Advanced RAG Knowledge Base – SHB Bank

---

# 1. Mục đích tài liệu

Tài liệu này giúp UI/UX Designer hiểu hệ thống và thiết kế giao diện Figma dù chưa từng tham gia dự án.

Hệ thống là một nền tảng tra cứu tài liệu ngân hàng bằng AI. Người dùng có thể đặt câu hỏi bằng ngôn ngữ tự nhiên và nhận câu trả lời dựa trên tài liệu của ngân hàng.

Hệ thống không chỉ tìm kiếm nội dung thông thường mà còn xử lý:

* Văn bản tham chiếu đến văn bản khác.
* Văn bản sửa đổi văn bản cũ.
* Điều khoản bị thay thế một phần.
* Các điều khoản hoặc văn bản có khả năng mâu thuẫn.
* Phiên bản hiện hành của từng điều khoản.

Hệ thống có ba nhóm người dùng:

1. `customer`: Khách hàng.
2. `bank_employee`: Nhân viên ngân hàng.
3. `admin`: Quản trị viên hệ thống.

---

# 2. Phạm vi giao diện

Frontend có thể được thiết kế dưới dạng một ứng dụng web dùng chung.

Sau khi đăng nhập, hệ thống hiển thị chức năng dựa trên vai trò của người dùng.

Cấu trúc tổng quát:

```text
Ứng dụng
├── Khu vực Customer
├── Khu vực Bank Employee
├── Khu vực Admin
└── Các thành phần dùng chung
```

Thiết kế ưu tiên màn hình desktop vì các nghiệp vụ duyệt tài liệu, so sánh điều khoản và xử lý mâu thuẫn cần không gian hiển thị lớn.

---

# 3. Đối tượng sử dụng

## 3.1. Customer

Customer sử dụng hệ thống để:

* Đặt câu hỏi liên quan đến sản phẩm, dịch vụ hoặc quy định được phép công khai.
* Nhận câu trả lời từ chatbot.
* Xem nguồn trích dẫn.
* Xem lại lịch sử hội thoại.
* Đánh giá câu trả lời.

Customer không được:

* Xem tài liệu nội bộ.
* Upload tài liệu.
* Chỉnh sửa hoặc duyệt tài liệu.
* Xem dữ liệu quản trị.

---

## 3.2. Bank Employee

Bank employee là người sử dụng hệ thống để tra cứu và quản lý tài liệu nghiệp vụ.

Bank employee có thể:

* Tra cứu tài liệu nội bộ bằng chatbot.
* Upload tài liệu.
* Theo dõi quá trình xử lý tài liệu.
* Kiểm tra và chỉnh sửa metadata.
* Kiểm tra cấu trúc Chương, Điều, Khoản, Điểm.
* Duyệt các điều khoản được hệ thống trích xuất.
* Duyệt quan hệ giữa các văn bản.
* Duyệt nội dung sửa đổi hoặc thay thế điều khoản.
* Duyệt các mâu thuẫn do AI phát hiện.
* Xem lịch sử phiên bản điều khoản.

---

## 3.3. Admin

Admin quản trị hệ thống nhưng không trực tiếp thực hiện nghiệp vụ duyệt tài liệu.

Admin có thể:

* Quản lý người dùng.
* Quản lý vai trò.
* Quản lý quyền truy cập.
* Khóa hoặc mở tài khoản.
* Theo dõi nhật ký hoạt động hệ thống.
* Theo dõi trạng thái tổng thể của hệ thống.

---

# 4. Nguyên tắc thiết kế chung

## 4.1. Cấu trúc trang

Giao diện sau đăng nhập gồm ba khu vực chính:

### Sidebar

Nằm bên trái màn hình.

Dùng để hiển thị:

* Logo hệ thống.
* Menu chức năng.
* Menu đang được chọn.
* Nhóm chức năng theo vai trò.

### Header

Nằm phía trên.

Bao gồm:

* Tên trang hiện tại.
* Thanh tìm kiếm nếu cần.
* Thông báo.
* Ảnh đại diện hoặc tên người dùng.
* Menu tài khoản.
* Nút đăng xuất.

### Main content

Khu vực nội dung chính.

Dùng để hiển thị:

* Danh sách.
* Form.
* Chatbot.
* Chi tiết tài liệu.
* Màn hình duyệt.
* Biểu đồ hoặc timeline.

---

## 4.2. Trạng thái cần thiết kế

Mỗi màn hình cần có các trạng thái sau nếu phù hợp:

* Loading.
* Empty state.
* Error state.
* Success state.
* Permission denied.
* Không tìm thấy dữ liệu.
* Mất kết nối.
* Dữ liệu đang được xử lý.
* Dữ liệu chờ duyệt.
* Dữ liệu đã được duyệt.
* Dữ liệu bị từ chối.

---

## 4.3. Các thành phần dùng chung

Designer cần tạo component dùng chung trên Figma:

* Button.
* Input.
* Textarea.
* Select.
* Multi-select.
* Checkbox.
* Radio button.
* Date picker.
* Search box.
* Tabs.
* Badge trạng thái.
* Table.
* Pagination.
* Modal.
* Drawer.
* Tooltip.
* Toast notification.
* Confirmation dialog.
* File upload area.
* User avatar.
* Breadcrumb.
* Skeleton loading.
* Empty state.
* Error message.
* Citation card.
* Document card.
* Clause card.
* Conflict card.
* Status stepper.

---

# 5. Cấu trúc điều hướng theo vai trò

## 5.1. Customer

```text
Customer
├── Chatbot
├── Lịch sử hội thoại
└── Tài khoản
```

---

## 5.2. Bank Employee

```text
Bank Employee
├── Tổng quan
├── Chatbot nội bộ
├── Tài liệu
│   ├── Danh sách tài liệu
│   ├── Upload tài liệu
│   └── Chi tiết tài liệu
├── Công việc cần duyệt
│   ├── Metadata
│   ├── Điều khoản
│   ├── Quan hệ tài liệu
│   └── Mâu thuẫn
├── Lịch sử hội thoại
└── Tài khoản
```

---

## 5.3. Admin

```text
Admin
├── Tổng quan
├── Người dùng
├── Vai trò và quyền
├── Nhật ký hệ thống
└── Tài khoản
```

---

# 6. Màn hình đăng nhập

## 6.1. Mục đích

Cho phép người dùng truy cập hệ thống.

## 6.2. Thành phần

* Logo hệ thống.
* Tên hệ thống.
* Ô tên đăng nhập hoặc email.
* Ô mật khẩu.
* Checkbox ghi nhớ đăng nhập.
* Nút đăng nhập.
* Link quên mật khẩu nếu hệ thống hỗ trợ.
* Thông báo lỗi đăng nhập.

## 6.3. Trạng thái

* Chưa nhập dữ liệu.
* Nhập sai thông tin.
* Tài khoản bị khóa.
* Đang đăng nhập.
* Đăng nhập thành công.

---

# 7. Giao diện Customer

# 7.1. Màn hình Chatbot

## Mục đích

Cho phép customer đặt câu hỏi và nhận câu trả lời từ hệ thống.

## Bố cục

Màn hình chia thành hai phần:

### Cột trái

Hiển thị danh sách hội thoại.

Bao gồm:

* Nút “Cuộc trò chuyện mới”.
* Ô tìm kiếm hội thoại.
* Danh sách hội thoại gần đây.
* Tiêu đề hội thoại.
* Thời gian cập nhật gần nhất.
* Menu đổi tên hoặc xóa hội thoại.

### Khu vực chính

Hiển thị nội dung hội thoại.

Bao gồm:

* Tiêu đề hội thoại.
* Tin nhắn của người dùng.
* Tin nhắn trả lời của AI.
* Trích dẫn nguồn.
* Cảnh báo.
* Ô nhập câu hỏi.
* Nút gửi.

## Tin nhắn người dùng

Hiển thị:

* Nội dung câu hỏi.
* Thời gian gửi.
* Avatar hoặc ký hiệu người dùng.

## Tin nhắn AI

Hiển thị:

* Nội dung câu trả lời.
* Danh sách nguồn được sử dụng.
* Cảnh báo nếu có.
* Nút sao chép.
* Nút đánh giá hữu ích.
* Nút đánh giá không hữu ích.

## Citation card

Mỗi nguồn trích dẫn hiển thị:

* Tên văn bản.
* Số hiệu văn bản nếu có.
* Điều hoặc khoản được trích dẫn.
* Ngày hiệu lực.
* Trạng thái hiệu lực.
* Nút “Xem nguồn”.

Customer chỉ được xem nội dung được phép công khai.

## Trạng thái màn hình

* Chưa có hội thoại.
* Đang chờ AI trả lời.
* Đang hiển thị câu trả lời từng phần.
* Không tìm thấy thông tin phù hợp.
* Có cảnh báo mâu thuẫn.
* Có lỗi hệ thống.
* Không có quyền xem nguồn.

---

# 7.2. Màn hình xem nguồn trích dẫn

## Mục đích

Cho phép customer kiểm tra nội dung mà AI sử dụng để trả lời.

## Thành phần

* Tên tài liệu.
* Loại tài liệu.
* Số hiệu.
* Ngày ban hành.
* Ngày hiệu lực.
* Trạng thái hiệu lực.
* Điều hoặc khoản được trích dẫn.
* Nội dung trích dẫn.
* Nút quay lại hội thoại.

Không hiển thị toàn bộ tài liệu nếu customer không có quyền truy cập.

---

# 7.3. Màn hình lịch sử hội thoại

## Thành phần

* Danh sách hội thoại.
* Thanh tìm kiếm.
* Bộ lọc theo thời gian.
* Tiêu đề hội thoại.
* Nội dung câu hỏi đầu tiên.
* Thời gian tạo.
* Thời gian cập nhật.
* Nút mở lại.
* Nút xóa.

---

# 8. Giao diện Bank Employee

# 8.1. Dashboard tổng quan

## Mục đích

Giúp bank employee nắm được trạng thái tài liệu và các công việc cần xử lý.

## Thành phần

### Thẻ thống kê

* Tổng số tài liệu.
* Tài liệu đang xử lý.
* Tài liệu chờ duyệt.
* Tài liệu xử lý lỗi.
* Metadata chờ duyệt.
* Điều khoản chờ duyệt.
* Quan hệ chờ duyệt.
* Mâu thuẫn chờ duyệt.

### Danh sách công việc gần đây

Hiển thị:

* Loại công việc.
* Tên tài liệu.
* Trạng thái.
* Người upload.
* Ngày tạo.
* Nút mở chi tiết.

### Tài liệu gần đây

Hiển thị:

* Tên tài liệu.
* Loại tài liệu.
* Ngày upload.
* Trạng thái xử lý.
* Người upload.

---

# 8.2. Chatbot nội bộ

Giao diện tương tự chatbot của customer nhưng có thêm thông tin nghiệp vụ.

## Thành phần bổ sung

* Bộ lọc phạm vi tra cứu.
* Bộ lọc loại tài liệu.
* Bộ lọc đơn vị ban hành.
* Bộ lọc trạng thái hiệu lực.
* Bộ lọc khoảng thời gian.
* Hiển thị đầy đủ điều khoản được trích dẫn.
* Hiển thị quan hệ sửa đổi.
* Hiển thị quan hệ thay thế.
* Hiển thị cảnh báo mâu thuẫn.
* Link đến chi tiết tài liệu.
* Link đến timeline điều khoản.

## Citation card cho employee

Hiển thị:

* Tên tài liệu.
* Số hiệu.
* Điều, Khoản, Điểm.
* Trạng thái hiệu lực.
* Ngày bắt đầu hiệu lực.
* Ngày hết hiệu lực nếu có.
* Văn bản sửa đổi liên quan.
* Nút xem tài liệu.
* Nút xem lịch sử điều khoản.

---

# 8.3. Danh sách tài liệu

## Mục đích

Cho phép bank employee quản lý toàn bộ tài liệu mà mình có quyền truy cập.

## Thành phần đầu trang

* Tiêu đề “Tài liệu”.
* Nút “Upload tài liệu”.
* Ô tìm kiếm.
* Nút mở bộ lọc.

## Bộ lọc

* Loại tài liệu.
* Đơn vị ban hành.
* Người upload.
* Trạng thái xử lý.
* Trạng thái hiệu lực.
* Trạng thái duyệt.
* Ngày upload.
* Ngày hiệu lực.

## Bảng tài liệu

Các cột:

* Tên tài liệu.
* Số hiệu.
* Loại tài liệu.
* Đơn vị ban hành.
* Người upload.
* Ngày upload.
* Trạng thái xử lý.
* Trạng thái duyệt.
* Thao tác.

## Badge trạng thái xử lý

Có thể gồm:

* Đang tải lên.
* Chờ xử lý.
* Đang parse.
* Đang trích xuất metadata.
* Đang trích xuất điều khoản.
* Đang phát hiện quan hệ.
* Đang phát hiện mâu thuẫn.
* Chờ duyệt.
* Hoàn tất.
* Xử lý lỗi.

## Thao tác

* Xem chi tiết.
* Theo dõi xử lý.
* Chỉnh sửa.
* Yêu cầu xử lý lại.

---

# 8.4. Upload tài liệu

## Mục đích

Cho phép bank employee tải tài liệu mới lên hệ thống.

## Bố cục đề xuất

Sử dụng dạng wizard theo bước.

```text
Bước 1: Chọn file
Bước 2: Nhập thông tin ban đầu
Bước 3: Xác nhận
Bước 4: Theo dõi xử lý
```

## Bước 1: Chọn file

Thành phần:

* Khu vực kéo thả file.
* Nút chọn file.
* Tên file.
* Dung lượng file.
* Định dạng file.
* Trạng thái upload.
* Nút xóa file.

## Bước 2: Thông tin ban đầu

Các trường:

* Tên tài liệu.
* Loại tài liệu.
* Lĩnh vực nghiệp vụ.
* Phạm vi truy cập.
* Ghi chú.
* Người chịu trách nhiệm duyệt.

Các thông tin này là dữ liệu ban đầu. Metadata chi tiết sẽ do AI trích xuất sau.

## Bước 3: Xác nhận

Hiển thị:

* File đã chọn.
* Thông tin đã nhập.
* Phạm vi truy cập.
* Nút quay lại.
* Nút xác nhận upload.

## Bước 4: Theo dõi xử lý

Hiển thị stepper:

```text
Upload file
→ Parse tài liệu
→ Trích xuất metadata
→ Trích xuất điều khoản
→ Phát hiện quan hệ
→ Phát hiện mâu thuẫn
→ Chờ duyệt
```

Mỗi bước có:

* Trạng thái.
* Thời điểm bắt đầu.
* Thời điểm hoàn thành.
* Thông báo lỗi nếu có.

---

# 8.5. Chi tiết tài liệu

## Mục đích

Hiển thị đầy đủ thông tin và trạng thái của một tài liệu.

## Phần header

* Tên tài liệu.
* Số hiệu.
* Loại tài liệu.
* Trạng thái xử lý.
* Trạng thái hiệu lực.
* Trạng thái duyệt.
* Nút chỉnh sửa.
* Nút xử lý lại.

## Tabs

```text
Tổng quan
Nội dung
Điều khoản
Quan hệ
Mâu thuẫn
Lịch sử
```

## Tab Tổng quan

Hiển thị metadata:

* Tên tài liệu.
* Số hiệu.
* Loại tài liệu.
* Đơn vị ban hành.
* Ngày ban hành.
* Ngày hiệu lực.
* Ngày hết hiệu lực.
* Lĩnh vực nghiệp vụ.
* Phạm vi áp dụng.
* Phạm vi truy cập.
* Người upload.
* Ngày upload.

## Tab Nội dung

Hiển thị nội dung tài liệu đã parse.

Cần có:

* Mục lục bên trái.
* Nội dung bên phải.
* Highlight phần đang chọn.
* Tìm kiếm trong tài liệu.
* Chuyển nhanh đến Chương, Điều, Khoản, Điểm.

## Tab Điều khoản

Hiển thị dạng cây:

```text
Chương
└── Điều
    └── Khoản
        └── Điểm
```

Mỗi điều khoản hiển thị:

* Mã điều khoản.
* Tiêu đề.
* Nội dung.
* Trạng thái hiệu lực.
* Trạng thái duyệt.
* Ngày hiệu lực.
* Quan hệ sửa đổi nếu có.

## Tab Quan hệ

Hiển thị các quan hệ:

* Tham chiếu.
* Sửa đổi.
* Bị sửa đổi.
* Thay thế.
* Bị thay thế.
* Thay thế một phần.

Có thể hiển thị dưới hai dạng:

* Danh sách.
* Biểu đồ quan hệ.

## Tab Mâu thuẫn

Hiển thị:

* Điều khoản liên quan.
* Văn bản liên quan.
* Loại mâu thuẫn.
* Trạng thái xử lý.
* Người duyệt.
* Kết luận.

## Tab Lịch sử

Hiển thị timeline:

* Thời điểm upload.
* Thời điểm AI xử lý.
* Người chỉnh sửa metadata.
* Người duyệt điều khoản.
* Người duyệt quan hệ.
* Người duyệt mâu thuẫn.
* Các lần xử lý lại.

---

# 8.6. Màn hình duyệt Metadata

## Mục đích

Cho phép bank employee kiểm tra thông tin tài liệu do AI trích xuất.

## Bố cục

Chia màn hình thành hai phần.

### Bên trái

Hiển thị tài liệu gốc hoặc nội dung parse.

### Bên phải

Hiển thị form metadata.

Các trường:

* Tên tài liệu.
* Số hiệu.
* Loại tài liệu.
* Đơn vị ban hành.
* Ngày ban hành.
* Ngày hiệu lực.
* Ngày hết hiệu lực.
* Lĩnh vực nghiệp vụ.
* Phạm vi áp dụng.
* Trạng thái hiệu lực.
* Phạm vi truy cập.

## Thông tin hỗ trợ

Mỗi trường có thể hiển thị:

* Giá trị AI trích xuất.
* Độ tin cậy.
* Vị trí trong tài liệu gốc.
* Giá trị đã chỉnh sửa.

## Nút thao tác

* Lưu nháp.
* Duyệt.
* Từ chối.
* Yêu cầu xử lý lại.

## Modal xác nhận duyệt

Hiển thị:

* Tên tài liệu.
* Các trường đã thay đổi.
* Ghi chú của người duyệt.
* Nút xác nhận.

---

# 8.7. Màn hình duyệt điều khoản

## Mục đích

Cho phép bank employee kiểm tra cấu trúc và nội dung điều khoản được AI trích xuất.

## Bố cục

Chia thành ba khu vực:

### Cột trái

Cây cấu trúc tài liệu:

* Chương.
* Điều.
* Khoản.
* Điểm.

### Khu vực giữa

Nội dung tài liệu gốc.

Điều khoản đang chọn được highlight.

### Cột phải

Form chỉnh sửa điều khoản.

Các trường:

* Mã điều khoản.
* Loại cấp nội dung.
* Tiêu đề.
* Nội dung.
* Điều khoản cha.
* Ngày bắt đầu hiệu lực.
* Ngày hết hiệu lực.
* Trạng thái hiệu lực.
* Trạng thái duyệt.

## Thao tác

* Chỉnh sửa nội dung.
* Tách điều khoản.
* Gộp điều khoản.
* Thay đổi điều khoản cha.
* Lưu nháp.
* Duyệt.
* Từ chối.

## Trạng thái duyệt

* Chưa duyệt.
* Đã chỉnh sửa.
* Đã duyệt.
* Bị từ chối.

---

# 8.8. Màn hình duyệt quan hệ tài liệu

## Mục đích

Cho phép bank employee kiểm tra các quan hệ do AI phát hiện.

## Danh sách quan hệ

Mỗi hàng hiển thị:

* Tài liệu nguồn.
* Điều khoản nguồn.
* Loại quan hệ.
* Tài liệu đích.
* Điều khoản đích.
* Độ tin cậy.
* Trạng thái.
* Thao tác.

## Loại quan hệ

* Tham chiếu.
* Sửa đổi.
* Bị sửa đổi.
* Thay thế.
* Thay thế một phần.

## Màn hình chi tiết quan hệ

Chia thành hai cột.

### Cột trái

Điều khoản nguồn.

### Cột phải

Điều khoản đích.

Phần giữa hiển thị:

* Loại quan hệ AI đề xuất.
* Giải thích của AI.
* Độ tin cậy.
* Ngày hiệu lực liên quan.

## Thao tác

* Duyệt.
* Từ chối.
* Thay đổi loại quan hệ.
* Chỉnh sửa phạm vi áp dụng.
* Thêm ghi chú.

---

# 8.9. Màn hình duyệt mâu thuẫn

## Mục đích

Cho phép bank employee xác nhận hoặc bác bỏ mâu thuẫn giữa hai nội dung.

## Danh sách mâu thuẫn

Các cột:

* Mã mâu thuẫn.
* Tài liệu thứ nhất.
* Tài liệu thứ hai.
* Điều khoản liên quan.
* Mức độ.
* Độ tin cậy.
* Trạng thái.
* Ngày phát hiện.
* Thao tác.

## Màn hình chi tiết

Chia thành hai cột lớn.

### Bên trái

Hiển thị điều khoản thứ nhất:

* Tên tài liệu.
* Số hiệu.
* Điều hoặc khoản.
* Nội dung.
* Ngày hiệu lực.
* Trạng thái hiệu lực.

### Bên phải

Hiển thị điều khoản thứ hai với cấu trúc tương tự.

### Khu vực phân tích AI

Hiển thị:

* Phần nội dung có khả năng mâu thuẫn.
* Giải thích nguyên nhân.
* Loại mâu thuẫn.
* Mức độ ảnh hưởng.
* Độ tin cậy.

## Thao tác của người duyệt

* Xác nhận có mâu thuẫn.
* Xác nhận không có mâu thuẫn.
* Chưa đủ thông tin.
* Thêm ghi chú.
* Chọn điều khoản được ưu tiên nếu nghiệp vụ cho phép.
* Lưu quyết định.

---

# 8.10. Clause Version Timeline

## Mục đích

Hiển thị quá trình thay đổi của một điều khoản.

## Thành phần

Timeline theo thời gian:

```text
Phiên bản gốc
→ Sửa đổi lần 1
→ Thay thế một phần
→ Sửa đổi lần 2
→ Phiên bản hiện hành
```

Mỗi mốc hiển thị:

* Ngày bắt đầu hiệu lực.
* Văn bản tạo ra thay đổi.
* Loại thay đổi.
* Nội dung trước.
* Nội dung sau.
* Trạng thái hiệu lực.

Có nút:

* So sánh phiên bản.
* Mở văn bản liên quan.
* Xem chi tiết thay đổi.

---

# 8.11. Knowledge Graph

## Mục đích

Trực quan hóa quan hệ giữa tài liệu và điều khoản.

## Thành phần

* Node tài liệu.
* Node điều khoản.
* Đường liên kết giữa các node.
* Chú thích loại quan hệ.
* Thanh zoom.
* Nút căn giữa.
* Bộ lọc loại quan hệ.
* Bộ lọc trạng thái hiệu lực.
* Ô tìm kiếm tài liệu.

Khi chọn một node, mở panel chi tiết bên phải:

* Tên tài liệu hoặc điều khoản.
* Loại tài liệu.
* Trạng thái hiệu lực.
* Danh sách quan hệ.
* Nút mở chi tiết.

---

# 9. Giao diện Admin

# 9.1. Dashboard Admin

## Thẻ thống kê

* Tổng số người dùng.
* Người dùng đang hoạt động.
* Số bank employee.
* Số customer.
* Tài khoản bị khóa.
* Số thao tác hệ thống trong ngày.
* Số lỗi hệ thống.

## Danh sách gần đây

* Người dùng mới.
* Hoạt động quản trị gần đây.
* Lỗi hoặc cảnh báo hệ thống.

---

# 9.2. Danh sách người dùng

## Thành phần

* Nút tạo người dùng.
* Ô tìm kiếm.
* Bộ lọc role.
* Bộ lọc trạng thái.
* Bộ lọc phòng ban nếu có.

## Bảng

Các cột:

* Họ tên.
* Tên đăng nhập hoặc email.
* Role.
* Phòng ban.
* Trạng thái.
* Ngày tạo.
* Lần đăng nhập gần nhất.
* Thao tác.

## Thao tác

* Xem chi tiết.
* Chỉnh sửa.
* Gán role.
* Khóa tài khoản.
* Mở khóa tài khoản.

---

# 9.3. Tạo hoặc chỉnh sửa người dùng

Các trường:

* Họ tên.
* Email hoặc tên đăng nhập.
* Role.
* Phòng ban.
* Trạng thái.
* Phạm vi quyền truy cập.
* Ghi chú.

Nút:

* Hủy.
* Lưu.
* Lưu và kích hoạt.

---

# 9.4. Vai trò và quyền

## Danh sách role

* Admin.
* Bank employee.
* Customer.

Mỗi role hiển thị:

* Tên role.
* Mô tả.
* Số người dùng.
* Danh sách quyền.

## Ma trận quyền

Có thể hiển thị dạng bảng:

| Chức năng        | Admin          | Bank employee | Customer |
| ---------------- | -------------- | ------------- | -------- |
| Chatbot          | Theo cấu hình  | Có            | Có       |
| Upload tài liệu  | Không mặc định | Có            | Không    |
| Duyệt metadata   | Không          | Có            | Không    |
| Duyệt điều khoản | Không          | Có            | Không    |
| Duyệt mâu thuẫn  | Không          | Có            | Không    |
| Quản lý user     | Có             | Không         | Không    |

---

# 9.5. Nhật ký hệ thống

## Thành phần

* Ô tìm kiếm.
* Bộ lọc người dùng.
* Bộ lọc hành động.
* Bộ lọc đối tượng.
* Bộ lọc thời gian.

## Bảng

Các cột:

* Thời gian.
* Người thực hiện.
* Vai trò.
* Hành động.
* Đối tượng bị tác động.
* Kết quả.
* Địa chỉ IP nếu được lưu.
* Nút xem chi tiết.

## Chi tiết log

Hiển thị:

* Người thực hiện.
* Thời gian.
* Loại hành động.
* Dữ liệu trước thay đổi.
* Dữ liệu sau thay đổi.
* Request ID.
* Kết quả.
* Thông báo lỗi nếu có.

---

# 10. Hệ thống trạng thái hiển thị

Designer cần sử dụng badge rõ ràng và nhất quán.

## 10.1. Trạng thái xử lý tài liệu

* Queued: Chờ xử lý.
* Processing: Đang xử lý.
* Pending review: Chờ duyệt.
* Completed: Hoàn tất.
* Failed: Xử lý lỗi.
* Reprocessing: Đang xử lý lại.

## 10.2. Trạng thái duyệt

* Draft: Bản nháp.
* Pending: Chờ duyệt.
* Approved: Đã duyệt.
* Rejected: Bị từ chối.

## 10.3. Trạng thái hiệu lực

* Effective: Đang có hiệu lực.
* Partially effective: Còn hiệu lực một phần.
* Superseded: Đã bị thay thế.
* Expired: Hết hiệu lực.
* Future effective: Chưa đến ngày hiệu lực.

## 10.4. Trạng thái mâu thuẫn

* Detected: AI đã phát hiện.
* Pending review: Chờ người duyệt.
* Confirmed: Đã xác nhận mâu thuẫn.
* Rejected: Không phải mâu thuẫn.
* Resolved: Đã xử lý.

---

# 11. Các modal cần thiết kế

* Xác nhận xóa hội thoại.
* Xác nhận upload tài liệu.
* Xác nhận duyệt metadata.
* Xác nhận duyệt điều khoản.
* Xác nhận quan hệ.
* Xác nhận mâu thuẫn.
* Từ chối nội dung.
* Yêu cầu xử lý lại.
* Khóa người dùng.
* Mở khóa người dùng.
* Cảnh báo rời trang khi chưa lưu.

---

# 12. Các luồng prototype cần dựng trên Figma

## Luồng 1: Customer hỏi chatbot

```text
Đăng nhập
→ Mở chatbot
→ Nhập câu hỏi
→ AI đang xử lý
→ Hiển thị câu trả lời
→ Mở nguồn trích dẫn
→ Đánh giá câu trả lời
```

## Luồng 2: Bank employee upload tài liệu

```text
Đăng nhập
→ Danh sách tài liệu
→ Upload tài liệu
→ Chọn file
→ Nhập thông tin
→ Xác nhận
→ Theo dõi xử lý
→ Tài liệu chuyển sang chờ duyệt
```

## Luồng 3: Duyệt metadata

```text
Dashboard
→ Metadata chờ duyệt
→ Mở tài liệu
→ So sánh file gốc và dữ liệu AI
→ Chỉnh sửa
→ Duyệt
```

## Luồng 4: Duyệt điều khoản

```text
Danh sách công việc
→ Điều khoản chờ duyệt
→ Chọn điều khoản
→ So sánh với nội dung gốc
→ Chỉnh sửa
→ Duyệt
```

## Luồng 5: Duyệt quan hệ

```text
Quan hệ chờ duyệt
→ Mở chi tiết
→ So sánh hai điều khoản
→ Xem giải thích AI
→ Duyệt hoặc từ chối
```

## Luồng 6: Duyệt mâu thuẫn

```text
Mâu thuẫn chờ duyệt
→ Mở chi tiết
→ So sánh hai điều khoản
→ Xem phân tích AI
→ Nhập ghi chú
→ Xác nhận hoặc bác bỏ
```

## Luồng 7: Admin quản lý người dùng

```text
Đăng nhập
→ Danh sách người dùng
→ Tạo hoặc chỉnh sửa người dùng
→ Gán role
→ Lưu
```

---

# 13. Danh sách frame cần tạo trên Figma

## Authentication

* Login – Default.
* Login – Error.
* Login – Loading.
* Permission denied.

## Customer

* Chatbot – Empty.
* Chatbot – Có hội thoại.
* Chatbot – AI loading.
* Chatbot – Có citation.
* Chatbot – Có warning.
* Lịch sử hội thoại.
* Chi tiết nguồn trích dẫn.

## Bank Employee

* Dashboard.
* Chatbot nội bộ.
* Danh sách tài liệu.
* Upload tài liệu – Bước 1.
* Upload tài liệu – Bước 2.
* Upload tài liệu – Bước 3.
* Upload tài liệu – Bước 4.
* Chi tiết tài liệu – Tổng quan.
* Chi tiết tài liệu – Nội dung.
* Chi tiết tài liệu – Điều khoản.
* Chi tiết tài liệu – Quan hệ.
* Chi tiết tài liệu – Mâu thuẫn.
* Chi tiết tài liệu – Lịch sử.
* Danh sách metadata chờ duyệt.
* Chi tiết duyệt metadata.
* Danh sách điều khoản chờ duyệt.
* Chi tiết duyệt điều khoản.
* Danh sách quan hệ chờ duyệt.
* Chi tiết duyệt quan hệ.
* Danh sách mâu thuẫn chờ duyệt.
* Chi tiết duyệt mâu thuẫn.
* Clause version timeline.
* Knowledge graph.

## Admin

* Dashboard.
* Danh sách người dùng.
* Tạo người dùng.
* Chỉnh sửa người dùng.
* Danh sách vai trò.
* Ma trận quyền.
* Nhật ký hệ thống.
* Chi tiết nhật ký.

---

# 14. Kết quả bàn giao Figma mong muốn

Designer cần bàn giao:

* Sitemap.
* User flow cho ba role.
* Wireframe các màn hình chính.
* UI Design hoàn chỉnh.
* Component library.
* Các trạng thái loading, empty, error và permission denied.
* Prototype cho các luồng chính.
* Quy định spacing, typography, icon và badge trạng thái.
* Responsive cơ bản cho desktop và tablet.
