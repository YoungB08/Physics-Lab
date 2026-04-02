# Hướng dẫn database cho lập trình viên

## 1. Nguồn chân lý của database
- `apps/api/prisma/schema.prisma`: nguồn chân lý ở mức ORM
- `apps/api/database/init.sql`: cấu trúc SQL thuần để DBA và dev kiểm tra / import trực tiếp
- `apps/api/database/seed.sql`: dữ liệu mẫu SQL
- `apps/api/prisma/seed.ts`: dữ liệu mẫu theo Prisma Client

## 2. Quy trình khởi tạo khuyến nghị
### Cách 1: dùng Prisma
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### Cách 2: dùng SQL thuần
```bash
psql -U postgres -d vatly_thpt -f apps/api/database/init.sql
psql -U postgres -d vatly_thpt -f apps/api/database/seed.sql
```

## 3. Quy tắc thay đổi schema
1. sửa `schema.prisma`
2. tạo migration mới
3. nếu cần, cập nhật `init.sql`
4. nếu dữ liệu mẫu thay đổi, cập nhật `seed.ts` và/hoặc `seed.sql`
5. cập nhật tài liệu database nếu có bảng mới hoặc đổi ý nghĩa cột

## 4. Quy ước đặt tên
- Prisma giữ tên tiếng Việt không dấu kiểu camelCase ở model field
- SQL dùng snake_case để dễ đọc với PostgreSQL
- cần map rõ khi debug hoặc viết raw query

## 5. Các bảng cốt lõi
- `nguoi_dung`
- `chuong`
- `bai_hoc`
- `phan_kien_thuc`
- `mo_phong`
- `cau_hoi`
- `de_thi`
- `bai_lam`
- `lich_su_ai`

## 6. Lưu ý cho môi trường thật
- tách user DB cho ứng dụng và user DB cho backup/restore
- bật connection pooling nếu tải lớn
- tạo thêm index theo nhu cầu dashboard thực tế
- không để mật khẩu mặc định trong seed production
