import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { ZodError } from 'zod';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { recordRequestMetric } from './services/monitor.service.js';
import { logSystem } from './services/system.service.js';

function normalizeOrigin(value?: string | null) {
  return String(value || '').trim().replace(/\/+$/, '');
}

const allowedOrigins = new Set(
  [
    env.URL_GIAO_DIEN,
    env.URL_GIAO_DIEN_WEB,
    env.PUBLIC_WEB_URL,
    'http://localhost:5173',
    'https://kntech.site',
    'https://www.kntech.site'
  ]
    .map((item) => normalizeOrigin(item))
    .filter(Boolean)
);

const uploadDir = path.resolve(process.cwd(), env.DUONG_DAN_UPLOAD || './uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '-')}`;
    cb(null, safe);
  }
});
const upload = multer({ storage });

export const app = express();
app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${normalizedOrigin} không được phép bởi CORS.`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - started;
    const status = res.statusCode;
    const routePath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    recordRequestMetric({ path: routePath, method: req.method, durationMs, status });
    void logSystem({
      muc: status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO',
      nhom: 'request',
      hanhDong: status >= 400 ? 'request_failed' : 'request_success',
      doiTuong: `${req.method} ${routePath}`,
      duLieuJson: {
        status,
        durationMs,
        query: req.query,
        contentType: req.headers['content-type'] || null,
        ip: req.ip
      },
      nguoiDungId: (req as any).user?.id ?? null
    });
  });
  next();
});
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({
    filename: req.file?.filename,
    originalname: req.file?.originalname,
    size: req.file?.size ?? 0,
    url: req.file ? `${env.PUBLIC_API_URL}/uploads/${req.file.filename}` : null
  });
});
app.use('/api', routes);
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = Number(err?.statusCode ?? err?.status ?? (err instanceof ZodError ? 400 : 500));
  const message = err?.message ?? 'Lỗi hệ thống.';
  console.error(`[${status}]`, message);
  void logSystem({
    muc: status >= 500 ? 'ERROR' : 'WARN',
    nhom: 'runtime',
    hanhDong: 'unhandled_error',
    doiTuong: `${req.method} ${req.originalUrl}`,
    duLieuJson: {
      status,
      message,
      stack: err?.stack ? String(err.stack).split('\n').slice(0, 8) : null
    },
    nguoiDungId: (req as any).user?.id ?? null
  });
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.issues.map((i) => i.message).join('; '), issues: err.issues });
  }
  res.status(status).json({ message });
});
