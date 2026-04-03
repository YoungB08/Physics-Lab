# Tài liệu lập trình viên

## 1. Mục tiêu
Tài liệu này mô tả nhanh cấu trúc dự án và cách chạy local sau khi đã gom toàn bộ cấu hình về root `.env`.

## 2. Kiến trúc tổng thể
### Frontend
- React
- Vite
- React Router
- Zustand
- CSS thuần

### Backend
- Express
- Prisma
- MySQL
- JWT
- Zod

### AI layer
Các provider AI đều được chuẩn hóa về cùng một schema response.

Các file chính:
- `apps/api/src/providers/openai.provider.ts`
- `apps/api/src/providers/gemini.provider.ts`
- `apps/api/src/providers/local.provider.ts`
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
├─ scripts/
├─ docker-compose.yml
├─ .env
└─ .env.example
```

## 4. Cấu hình môi trường
Dự án hiện chỉ dùng **một** nguồn cấu hình duy nhất:
- `D:\Physic_Lab\V10\.env`

Không dùng nữa:
- `apps/api/.env`
- `apps/web/.env`
- các `.env.example` trong từng app

Web đọc biến `VITE_*` từ root `.env` qua `envDir` của Vite.
API đọc biến từ root `.env` trong `apps/api/src/config/env.ts`.

## 5. Chạy local
### 5.1. Tạo file `.env`
Sao chép từ root `.env.example`.

### 5.2. Cài dependency
```bash
npm install
```

### 5.3. Chạy database
```bash
docker compose up -d
```

### 5.4. Prisma
```bash
cd apps/api
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 5.5. Chạy web + api
```bash
npm run dev
```

Hoặc chạy riêng:
```bash
npm run dev:api
npm run dev:web
```

## 6. Quy ước bảo mật
- không commit `.env`
- không hard-code API key
- mọi route quản trị phải có kiểm tra quyền
- dữ liệu chat/ảnh AI cần đi qua luồng kiểm MIME và giới hạn dung lượng

## 7. Lệnh thường dùng
```bash
# root
npm install
npm run dev
npm run build

# api
cd apps/api
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev

# web
cd apps/web
npm run dev
npm run build
```
