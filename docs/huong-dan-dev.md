# Tài liệu lập trình viên

## 1. Mục tiêu
Tài liệu này giúp lập trình viên hiểu cấu trúc dự án và cách phát triển tiếp.

## 2. Kiến trúc tổng thể
### 2.1. Frontend
- React
- Vite
- React Router
- Zustand
- CSS thuần để dễ kiểm soát giao diện tiếng Việt

### 2.2. Backend
- Express
- Prisma
- PostgreSQL
- JWT
- Zod validator

### 2.3. AI layer
Các provider AI đều được chuẩn hóa về cùng một schema response.

Các file chính:
- `apps/api/src/providers/ai.provider.ts`
- `apps/api/src/providers/openai.provider.ts`
- `apps/api/src/providers/gemini.provider.ts`
- `apps/api/src/services/ai.service.ts`

## 3. Cấu trúc thư mục
```text
vatly-thpt-platform/
├─ apps/
│  ├─ api/
│  │  ├─ prisma/
│  │  └─ src/
│  └─ web/
├─ docs/
├─ docker-compose.yml
└─ .env.example
```

## 4. Quy ước dữ liệu
### 4.1. Chuẩn bài học
- lớp
- chương
- bài học
- phần kiến thức
- mô phỏng (nếu có)

### 4.2. Chuẩn câu hỏi
- nguồn
- mức độ
- loại câu hỏi
- đáp án đúng
- giải thích
- trạng thái duyệt

### 4.3. Chuẩn AI response
Mọi response AI phải theo `AIResponseEnvelope`.

## 5. Cài môi trường local
### 5.1. Cài dependency
```bash
npm install
```

### 5.2. Tạo file `.env`
Sao chép từ `.env.example`.

### 5.3. Chạy database
```bash
docker compose up -d
```

### 5.4. Chạy migration + seed
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 5.5. Chạy web + api
```bash
npm run dev:api
npm run dev:web
```

## 6. Mở rộng AI thật
Hiện provider GPT/Gemini mới là stub chuẩn hóa. Để tích hợp thật:
1. thêm SDK chính thức hoặc gọi HTTP client
2. parse response thô
3. normalize về `AIResponseEnvelope`
4. validate trước khi trả ra frontend

## 7. Mở rộng tính năng
### 7.1. Nên ưu tiên tiếp theo
- refresh token hoàn chỉnh
- upload ảnh hỏi AI bằng multipart thực
- admin CRUD cho bài học, chương, câu hỏi
- trang thi thật, chấm bài thật
- QR SVG thật cho đề thi
- dashboard thống kê sâu hơn theo role
- duyệt câu hỏi AI sinh trước khi vào ngân hàng chính thức

### 7.2. Mô phỏng
Hiện dự án mới có “gắn dữ liệu mô phỏng”. Để nâng cấp:
- dùng Canvas hoặc Three.js cho bài cần 3D
- thêm preset
- thêm bảng số liệu
- thêm đồ thị đồng bộ

## 8. Quy ước bảo mật
- không commit `.env`
- không hard-code API key
- role `QUAN_TRI_VIEN` không cấp qua giao diện
- mọi route quản trị phải có `authRequired` + `requireRoles('QUAN_TRI_VIEN')`

## 9. Hướng production
Khi lên môi trường thật, cần bổ sung:
- reverse proxy
- HTTPS
- object storage cho ảnh
- log tập trung
- monitoring
- error tracking
- backup database
- CI/CD

## 10. Lệnh thường dùng
```bash
# root
npm install
npm run dev:web
npm run dev:api
npm run build

# api
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

# web
cd apps/web
npm run dev
npm run build
```
