# Sơ đồ dữ liệu mức logic

## 1. Quan hệ chính
- Một `chuong` có nhiều `bai_hoc`
- Một `bai_hoc` có nhiều `phan_kien_thuc`
- Một `bai_hoc` có thể có một `mo_phong`
- Một `bai_hoc` có nhiều `cau_hoi`
- Một `de_thi` thuộc về một `nguoi_dung` vai trò giáo viên
- Một `bai_lam` gắn với một `de_thi` và một `nguoi_dung` vai trò học sinh
- Một `lich_su_ai` gắn với một `nguoi_dung`

## 2. Mục đích từng bảng
### `nguoi_dung`
Lưu tài khoản, vai trò, trạng thái và thông tin cơ bản.

### `chuong`
Lưu cấu trúc lớp → chương của chương trình Vật lí.

### `bai_hoc`
Lưu bài học cụ thể, liên kết với chương, cho biết có mô phỏng hay AI hay không.

### `phan_kien_thuc`
Lưu từng phần kiến thức trong bài học: lý thuyết, công thức, nội dung minh họa.

### `mo_phong`
Lưu loại mô phỏng và cấu hình tham số để web dựng UI/animation.

### `cau_hoi`
Lưu ngân hàng câu hỏi thống nhất từ nhiều nguồn: ngân hàng sẵn có, AI GPT, AI Gemini, thủ công.

### `de_thi`
Lưu metadata đề thi và cấu hình tạo đề.

### `bai_lam`
Lưu kết quả học sinh và dữ liệu dùng cho thống kê mức độ hiểu bài.

### `lich_su_ai`
Lưu lịch sử AI để thống kê, audit và tối ưu prompt.
