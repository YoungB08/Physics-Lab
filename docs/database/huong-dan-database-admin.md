# Hướng dẫn database cho quản trị viên

## 1. Thành phần database
Hệ thống dùng PostgreSQL. Dữ liệu được khởi tạo theo 3 cách:
- Prisma migration
- SQL thuần qua `apps/api/database/init.sql`
- seed dữ liệu mẫu qua `apps/api/database/seed.sql` hoặc `apps/api/prisma/seed.ts`

## 2. Khi nào dùng cách nào
- Muốn khởi tạo nhanh, chuẩn cho dev: dùng Prisma migration + seed TypeScript.
- Muốn kiểm tra cấu trúc bảng trực tiếp hoặc làm việc với DBA: dùng `init.sql`.
- Muốn đổ dữ liệu mẫu nhanh mà chưa cần chạy API: dùng `seed.sql`.

## 3. Tài khoản mẫu
- `admin@vatly.vn`
- `giaovien@vatly.vn`
- `hocsinh@vatly.vn`

Lưu ý: tài khoản quản trị chỉ nên dùng cho môi trường phát triển hoặc staging.

## 4. Sao lưu và khôi phục
### Sao lưu
```bash
pg_dump -U postgres -d vatly_thpt -F c -f backup-vatly-thpt.dump
```

### Khôi phục
```bash
pg_restore -U postgres -d vatly_thpt --clean --if-exists backup-vatly-thpt.dump
```

## 5. Cấp role quản trị
Tuyệt đối không cấp role quản trị qua giao diện đăng ký.

Ví dụ SQL:
```sql
UPDATE nguoi_dung
SET vai_tro = 'QUAN_TRI_VIEN'
WHERE email = 'ten-admin@donvi.vn';
```

## 6. Kiểm tra nhanh dữ liệu
```sql
SELECT vai_tro, COUNT(*)
FROM nguoi_dung
GROUP BY vai_tro;

SELECT lop, ten, slug
FROM chuong
ORDER BY lop, thu_tu;
```
