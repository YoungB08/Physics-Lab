KNTECH PHASE 7 HOTFIX + POLISH

1. JWT secrets đã được điền sẵn ở .env / .env.example / apps/api/.env.example:
   - JWT_ACCESS_SECRET=doi_secret_nay
   - JWT_REFRESH_SECRET=doi_secret_nay_lan_2

2. Sửa lỗi exam bị chặn bởi CMS:
   - backend tự phục hồi feature.exam_enabled nếu bị tắt nhầm
   - trả về HTTP status đúng thay vì văng lỗi kiểu crash

3. Siết anti-cheat sâu hơn:
   - backend không trả gradedTeacherOnly cho luồng học sinh sau submit
   - frontend chặn thêm blur/select/drag/shortcut/printscreen/fullscreen-exit
   - watermark phiên thi nổi để hạn chế chụp/chia sẻ

4. Lesson builder:
   - bắt buộc mỗi lesson có mô phỏng
   - tự đảm bảo coverage mô phỏng toàn lesson catalog
   - bật external resources cho mọi lesson (video/PDF/model/web/article...)

5. UI/pháp lý:
   - footer làm lại nổi bật hơn
   - điều khoản + bản quyền viết lại chi tiết hơn
   - bài học mở rộng chiều sâu nội dung THPT 2025-2026

LƯU Ý
- Môi trường đóng gói hiện tại không có node_modules nên chưa chạy build npm end-to-end.
- Tuy vậy mình đã cập nhật cả source `src` và các file `apps/api/dist` trọng yếu để tránh lỗi backend khi bạn chạy nhanh.
- Khuyến nghị vẫn chạy lại `npm install` rồi `npm run build` trên máy/server của bạn để đồng bộ toàn bộ web + api.
