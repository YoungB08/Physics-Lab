# Vật lý THPT 3D + CMS Root + Installer

## Điểm chính
- MySQL là database chính thức.
- `npm run dev` sẽ tự thử:
  - `docker compose up -d`
  - `prisma generate`
  - `prisma db push`
  - `prisma:seed`
  - sau đó chạy API + Web
- Nếu hệ thống chưa cài đặt, web tự chuyển vào **First-run Installer**.
- Quyền được tách rõ:
  - `CMS_ROOT`: toàn quyền hệ thống, cấu hình, log, AI, CMS, metadata DB, lesson control
  - `QUAN_TRI_VIEN`: admin vận hành học vụ
  - `GIAO_VIEN`, `HOC_SINH`

## Tài khoản seed
- CMS Root: `root@vatly.vn` / `123456`
- Admin: `admin@vatly.vn` / `123456`

## Chạy nhanh
```bash
npm install
npm run dev
```

## Nếu MySQL chưa chạy được tự động
```bash
docker compose up -d
cd apps/api
npx prisma generate
npx prisma db push
npm run prisma:seed
cd ../..
npm run dev
```
