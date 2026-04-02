# Tài liệu quản trị viên

## 1. Mục tiêu tài liệu
Tài liệu này dành cho quản trị viên hệ thống, giúp:
- nắm vai trò quản trị
- hiểu các module cần theo dõi
- biết cách kiểm tra cấu hình, AI, dữ liệu và người dùng

## 2. Vai trò quản trị viên
Quản trị viên có quyền:
- xem tổng quan toàn hệ thống
- xem danh sách người dùng
- khóa / mở tài khoản
- quản lý học liệu, bài học, câu hỏi, đề thi
- xem log AI
- kiểm tra cấu hình hệ thống

**Lưu ý quan trọng:**
Vai trò `QUAN_TRI_VIEN` không được cấp qua giao diện đăng ký. Chỉ được cập nhật trực tiếp trong cơ sở dữ liệu hoặc qua seed script.

## 3. Kiểm tra hệ thống sau khi cài
### 3.1. Kiểm tra API
Mở:
- `http://localhost:4000/api/suc-khoe`

Nếu nhận được `ok: true` tức là API hoạt động.

### 3.2. Kiểm tra giao diện
Mở:
- `http://localhost:5173`

### 3.3. Kiểm tra dữ liệu seed
Đăng nhập bằng:
- `admin@vatly.vn`
- mật khẩu: `123456`

## 4. Quản lý AI
### 4.1. Nguyên tắc bật / tắt AI
AI nào không có cấu hình sẽ tự động ẩn khỏi giao diện.

Các biến môi trường liên quan:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `CHO_PHEP_AI_GPT`
- `CHO_PHEP_AI_GEMINI`

### 4.2. Kiểm tra trạng thái AI
API:
- `GET /api/ai/trang-thai`

Ví dụ:
```json
{
  "gpt": false,
  "gemini": false
}
```

## 5. Quản lý người dùng
Hiện tại có route quản trị:
- `GET /api/quan-tri/nguoi-dung`

Trong giai đoạn tiếp theo nên mở rộng:
- khóa / mở khóa tài khoản
- đặt lại mật khẩu
- xem lịch sử đăng nhập
- gán lớp / giáo viên phụ trách

## 6. Quản lý học liệu
Học liệu được tổ chức theo:
- lớp
- chương
- bài học
- phần kiến thức

Quản trị viên nên chuẩn hóa dữ liệu theo các nguyên tắc:
- slug không trùng
- bài nào có mô phỏng thì gắn `coMoPhong = true`
- phần kiến thức có thứ tự rõ
- mỗi bài có ít nhất 1 mô tả, 1 phần kiến thức, 1 nhóm câu hỏi nền tảng

## 7. Quản lý ngân hàng câu hỏi
Ngân hàng câu hỏi là lõi tái sử dụng của hệ thống.

Mỗi câu hỏi phải có:
- lớp / chương / bài học
- mức độ
- loại câu hỏi
- nguồn gốc
- đáp án đúng
- giải thích
- trạng thái duyệt

Nếu câu hỏi do AI sinh ra thì mặc định nên để:
- `CHO_DUYET`

Sau khi giáo viên hoặc quản trị viên rà soát mới chuyển sang:
- `DA_DUYET`

## 8. Tạo đề và sử dụng AI
Hệ thống cho phép tạo đề theo 3 chế độ:
- chỉ từ ngân hàng
- chỉ từ AI
- chế độ kép

Khuyến nghị vận hành:
- giai đoạn đầu: ưu tiên ngân hàng + chế độ kép
- câu hỏi AI sinh ra phải được rà soát định kỳ

## 9. Sao lưu và vận hành
### 9.1. Sao lưu dữ liệu
Nên sao lưu PostgreSQL hằng ngày.

Ví dụ:
```bash
pg_dump -U postgres -d vatly_thpt > backup.sql
```

### 9.2. Nhật ký và giám sát
Giai đoạn này mới có logging cơ bản qua console. Khi triển khai production nên bổ sung:
- log tập trung
- giám sát lỗi
- cảnh báo hiệu năng

## 10. Checklist quản trị vận hành
- [ ] API chạy ổn
- [ ] Web truy cập được
- [ ] PostgreSQL hoạt động
- [ ] Seed dữ liệu thành công
- [ ] AI bật/tắt đúng theo cấu hình
- [ ] Có admin thật trong database
- [ ] Dữ liệu bài học hiển thị đúng
- [ ] Tạo đề mẫu thành công
- [ ] Route admin trả về dữ liệu đúng
