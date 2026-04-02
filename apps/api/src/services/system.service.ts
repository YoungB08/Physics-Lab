import bcrypt from 'bcryptjs';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/prisma.js';
import { SIMULATION_PRESETS, resolveSimulationPreset } from '../constants/simulation-presets.js';
import { env } from '../config/env.js';
import { getApiMetrics } from './monitor.service.js';

const BRAND = 'KNTech';

const DEFAULT_SETTINGS = [
  { ma: 'installer.completed', nhom: 'he_thong', ten: 'Đã cài đặt', moTa: 'Đánh dấu hệ thống đã hoàn tất installer', giaTri: false },
  { ma: 'site.name', nhom: 'thong_tin', ten: 'Tên hệ thống', moTa: 'Tên hiển thị toàn hệ thống', giaTri: `${BRAND} Physics Lab` },
  { ma: 'site.brand', nhom: 'thong_tin', ten: 'Thương hiệu', moTa: 'Tên thương hiệu ngắn', giaTri: BRAND },
  { ma: 'site.contact_email', nhom: 'thong_tin', ten: 'Email liên hệ', moTa: 'Email hỗ trợ', giaTri: 'support@kntech.vn' },
  { ma: 'site.description', nhom: 'thong_tin', ten: 'Mô tả ngắn', moTa: 'Mô tả tại trang chủ và màn hình đăng nhập', giaTri: `${BRAND} Physics Lab - nền tảng học Vật lý THPT với mô phỏng 3D, AI và CMS quản trị toàn quyền.` },
  { ma: 'limit.upload_mb', nhom: 'gioi_han', ten: 'Giới hạn upload MB', moTa: 'Dung lượng tối đa mỗi tệp', giaTri: 20 },
  { ma: 'limit.exam_questions', nhom: 'gioi_han', ten: 'Số câu hỏi tối đa mỗi đề', moTa: 'Giới hạn khi tạo đề', giaTri: 50 },
  { ma: 'limit.ai_requests_per_day', nhom: 'gioi_han', ten: 'Số lượt AI mỗi ngày', moTa: 'Giới hạn theo người dùng', giaTri: 200 },
  { ma: 'feature.ai_enabled', nhom: 'tinh_nang', ten: 'Bật AI', moTa: 'Cho phép gọi AI trợ giảng', giaTri: true },
  { ma: 'feature.exam_enabled', nhom: 'tinh_nang', ten: 'Bật tạo đề', moTa: 'Cho phép giáo viên tạo đề thi', giaTri: true },
  { ma: 'feature.public_register', nhom: 'tinh_nang', ten: 'Bật đăng ký công khai', moTa: 'Cho phép hiển thị và sử dụng đăng ký công khai', giaTri: true },
  { ma: 'feature.simulation_quality', nhom: 'tinh_nang', ten: 'Mức mô phỏng', moTa: 'Thấp / vừa / cao', giaTri: 'cao' },
  { ma: 'db.driver', nhom: 'database', ten: 'DB driver', moTa: 'Thông tin loại cơ sở dữ liệu', giaTri: 'mysql' },
  { ma: 'db.host', nhom: 'database', ten: 'DB host', moTa: 'Máy chủ MySQL', giaTri: 'localhost' },
  { ma: 'db.port', nhom: 'database', ten: 'DB port', moTa: 'Cổng MySQL', giaTri: 3306 },
  { ma: 'db.name', nhom: 'database', ten: 'DB name', moTa: 'Tên cơ sở dữ liệu', giaTri: 'vatly_thpt' },
  { ma: 'security.allow_register_teacher', nhom: 'bao_mat', ten: 'Cho phép đăng ký giáo viên', moTa: 'Bật để cho phép tự đăng ký giáo viên', giaTri: true },
  { ma: 'security.allow_register_student', nhom: 'bao_mat', ten: 'Cho phép đăng ký học sinh', moTa: 'Bật để cho phép tự đăng ký học sinh', giaTri: true },
  { ma: 'analytics.retention_days', nhom: 'phan_tich', ten: 'Số ngày lưu phân tích', moTa: 'Thời gian giữ log/analytics', giaTri: 90 }
];

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function safeJsonObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const raw = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(raw)) return true;
    if (['false', '0', 'no', 'off', ''].includes(raw)) return false;
  }
  return fallback;
}

function pickPreset(meta: { lessonName?: string; chapterName?: string; topicName?: string }, usedTypes: Set<string>, index = 0) {
  const direct = resolveSimulationPreset(meta);
  if (direct && !usedTypes.has(direct.type)) return direct;
  for (let i = 0; i < SIMULATION_PRESETS.length; i += 1) {
    const preset = SIMULATION_PRESETS[(index + i) % SIMULATION_PRESETS.length];
    if (!usedTypes.has(preset.type)) return preset;
  }
  return direct ?? SIMULATION_PRESETS[index % SIMULATION_PRESETS.length];
}

function buildLessonSimulationConfig(currentConfig: unknown, simulationLabel: string, lesson: any) {
  const raw = safeJsonObject(currentConfig);
  const externalResources = Array.isArray(raw.externalResources) ? raw.externalResources : [];
  return {
    quality: raw.quality ?? 'ultra',
    brand: BRAND,
    displayName: raw.displayName ?? simulationLabel,
    renderer: raw.renderer ?? 'kntech-threejs-full3d',
    topic: raw.topic ?? lesson.chuDeThi ?? lesson.chuong?.ten ?? 'Tổng hợp',
    sceneVariant: raw.sceneVariant ?? lesson.slug,
    variantKey: raw.variantKey ?? `${lesson.slug}:${simulationLabel}`,
    allowExternalResources: true,
    externalResources,
    ...raw
  };
}

export function extractDbInfo() {
  try {
    const url = new URL(env.DATABASE_URL);
    return {
      host: url.hostname || 'localhost',
      port: Number(url.port || 3306),
      database: url.pathname.replace(/^\//, '') || 'vatly_thpt',
      user: decodeURIComponent(url.username || 'root')
    };
  } catch {
    return { host: 'localhost', port: 3306, database: 'vatly_thpt', user: 'root' };
  }
}

export async function logSystem(input: { muc?: string; nhom: string; hanhDong: string; doiTuong?: string; duLieuJson?: unknown; nguoiDungId?: string | null }) {
  try {
    await prisma.nhatKyHeThong.create({
      data: {
        muc: input.muc ?? 'INFO',
        nhom: input.nhom,
        hanhDong: input.hanhDong,
        doiTuong: input.doiTuong,
        duLieuJson: (input.duLieuJson ?? null) as any,
        nguoiDungId: input.nguoiDungId ?? null
      }
    });
  } catch {}
}

export async function ensureSystemSettings() {
  const db = extractDbInfo();
  for (const item of DEFAULT_SETTINGS) {
    const value = item.ma === 'db.host' ? db.host : item.ma === 'db.port' ? db.port : item.ma === 'db.name' ? db.database : item.giaTri;
    const existing = await prisma.cauHinhHeThong.findUnique({ where: { ma: item.ma } });

    if (existing) {
      await prisma.cauHinhHeThong.update({
        where: { ma: item.ma },
        data: {
          nhom: item.nhom,
          ten: item.ten,
          moTa: item.moTa,
          ...(existing.giaTri === null || typeof existing.giaTri === 'undefined' ? { giaTri: value as any } : {})
        }
      });
      continue;
    }

    await prisma.cauHinhHeThong.create({ data: { ...item, giaTri: value as any } });
  }
}

async function settingMap() {
  await ensureSystemSettings();
  const settings = await prisma.cauHinhHeThong.findMany();
  return Object.fromEntries(settings.map((item: any) => [item.ma, item.giaTri]));
}

export async function getFeatureFlags() {
  const map = await settingMap().catch(() => ({} as Record<string, any>));
  return {
    ai: parseBoolean(map['feature.ai_enabled'], true),
    exam: parseBoolean(map['feature.exam_enabled'], true),
    publicRegister: parseBoolean(map['feature.public_register'], true),
    registerTeacher: parseBoolean(map['security.allow_register_teacher'], true),
    registerStudent: parseBoolean(map['security.allow_register_student'], true),
    simulationQuality: String(map['feature.simulation_quality'] ?? 'cao')
  };
}

export async function assertFeatureEnabled(key: 'ai' | 'exam' | 'publicRegister' | 'registerTeacher' | 'registerStudent') {
  const flags = await getFeatureFlags();
  if (flags[key]) return;

  if (key === 'exam') {
    await prisma.cauHinhHeThong.upsert({
      where: { ma: 'feature.exam_enabled' },
      update: { giaTri: true as any },
      create: { ma: 'feature.exam_enabled', nhom: 'tinh_nang', ten: 'Bật tạo đề', moTa: 'Tự phục hồi khi backend cần dùng tính năng thi', giaTri: true as any }
    }).catch(() => null);
    await logSystem({ muc: 'WARN', nhom: 'system', hanhDong: 'auto_enable_exam_feature', doiTuong: key, duLieuJson: { reason: 'exam routes required' } });
    return;
  }

  throw new HttpError(403, `Tính năng này hiện đang bị tắt trong CMS: ${key}`);
}

async function listMedia() {
  const uploadDir = path.resolve(process.cwd(), env.DUONG_DAN_UPLOAD || './uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const entries = await fs.readdir(uploadDir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(entries.filter((e) => e.isFile()).map(async (entry) => {
    const filePath = path.join(uploadDir, entry.name);
    const stat = await fs.stat(filePath);
    return {
      name: entry.name,
      sizeMb: Number((stat.size / 1024 / 1024).toFixed(2)),
      updatedAt: stat.mtime.toISOString(),
      url: `${env.URL_API.replace(/\/$/, '')}/uploads/${entry.name}`
    };
  }));
  return files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 50);
}

async function ensureLessonSimulationCoverage() {
  const lessons = await prisma.baiHoc.findMany({ include: { chuong: true, moPhong: true }, orderBy: [{ chuong: { lop: 'asc' } }, { chuong: { thuTu: 'asc' } }, { thuTu: 'asc' }] });
  const usedTypes = new Set<string>();
  let changed = 0;

  for (let index = 0; index < lessons.length; index += 1) {
    const lesson = lessons[index];
    const currentType = lesson.simulationType ?? lesson.moPhong?.loaiMoPhong ?? undefined;
    let preset = SIMULATION_PRESETS.find((item) => item.type === currentType) ?? pickPreset({ lessonName: lesson.ten, chapterName: lesson.chuong?.ten, topicName: lesson.chuDeThi ?? undefined }, usedTypes, index);
    if (usedTypes.has(preset.type)) {
      preset = pickPreset({ lessonName: lesson.ten, chapterName: lesson.chuong?.ten, topicName: lesson.chuDeThi ?? undefined }, usedTypes, index + 3);
    }

    usedTypes.add(preset.type);
    const nextConfig = buildLessonSimulationConfig(lesson.moPhong?.cauHinhJson, preset.label, lesson);
    const nextParams = Object.keys(safeJsonObject(lesson.moPhong?.thamSoJson)).length ? safeJsonObject(lesson.moPhong?.thamSoJson) : preset.defaultParams;

    const needsLessonUpdate = !lesson.coMoPhong || lesson.loaiBai !== 'SIMULATION' || lesson.simulationType !== preset.type || lesson.simulationLabel !== preset.label;
    const needsModelUpdate = !lesson.moPhong || lesson.moPhong.loaiMoPhong !== preset.type || JSON.stringify(lesson.moPhong.cauHinhJson ?? {}) !== JSON.stringify(nextConfig) || JSON.stringify(lesson.moPhong.thamSoJson ?? {}) !== JSON.stringify(nextParams);

    if (!needsLessonUpdate && !needsModelUpdate) continue;

    changed += 1;
    await prisma.baiHoc.update({
      where: { id: lesson.id },
      data: {
        loaiBai: 'SIMULATION',
        coMoPhong: true,
        simulationType: preset.type,
        simulationLabel: preset.label,
        coAI: lesson.coAI ?? true
      }
    });

    await prisma.moPhong.upsert({
      where: { baiHocId: lesson.id },
      update: {
        loaiMoPhong: preset.type,
        cauHinhJson: nextConfig as any,
        thamSoJson: nextParams as any
      },
      create: {
        baiHocId: lesson.id,
        loaiMoPhong: preset.type,
        cauHinhJson: nextConfig as any,
        thamSoJson: nextParams as any
      }
    });
  }

  if (changed) {
    await logSystem({ muc: 'INFO', nhom: 'cms', hanhDong: 'ensure_lesson_simulation_coverage', doiTuong: 'lessons', duLieuJson: { changed } });
  }
}

export async function isInstalled() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await ensureSystemSettings();
    const map = await settingMap();
    return parseBoolean(map['installer.completed'], false);
  } catch {
    return false;
  }
}

export async function getPublicSystemInfo() {
  const map: Record<string, any> = await settingMap().catch(() => ({} as Record<string, any>));
  return {
    installed: parseBoolean(map['installer.completed'], false),
    appName: String(map['site.name'] ?? `${BRAND} Physics Lab`),
    brand: String(map['site.brand'] ?? BRAND),
    description: String(map['site.description'] ?? ''),
    db: extractDbInfo(),
    limits: {
      uploadMb: Number(map['limit.upload_mb'] ?? 20),
      examQuestions: Number(map['limit.exam_questions'] ?? 50),
      aiRequestsPerDay: Number(map['limit.ai_requests_per_day'] ?? 200)
    },
    features: {
      ai: parseBoolean(map['feature.ai_enabled'], true),
      exam: true,
      simulationQuality: String(map['feature.simulation_quality'] ?? 'cao')
    }
  };
}

export async function runInstaller(input: {
  systemName: string;
  brandName: string;
  supportEmail: string;
  rootEmail: string;
  rootPassword: string;
  rootName: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  uploadLimitMb: number;
  examQuestionLimit: number;
  aiRequestsPerDay: number;
  siteDescription?: string;
}) {
  await ensureSystemSettings();

  const rootHash = await bcrypt.hash(input.rootPassword, 10);
  const adminHash = await bcrypt.hash(input.adminPassword, 10);

  const cmsRoot = await prisma.nguoiDung.upsert({
    where: { email: input.rootEmail },
    update: { tenHienThi: input.rootName, hoTen: input.rootName, vaiTro: 'CMS_ROOT', trangThai: 'HOAT_DONG', matKhauHash: rootHash },
    create: { email: input.rootEmail, tenHienThi: input.rootName, hoTen: input.rootName, vaiTro: 'CMS_ROOT', trangThai: 'HOAT_DONG', matKhauHash: rootHash }
  });

  const admin = await prisma.nguoiDung.upsert({
    where: { email: input.adminEmail },
    update: { tenHienThi: input.adminName, hoTen: input.adminName, vaiTro: 'QUAN_TRI_VIEN', trangThai: 'HOAT_DONG', matKhauHash: adminHash },
    create: { email: input.adminEmail, tenHienThi: input.adminName, hoTen: input.adminName, vaiTro: 'QUAN_TRI_VIEN', trangThai: 'HOAT_DONG', matKhauHash: adminHash }
  });

  const settingsMap: Record<string, unknown> = {
    'installer.completed': true,
    'site.name': input.systemName,
    'site.brand': input.brandName || BRAND,
    'site.contact_email': input.supportEmail,
    'site.description': input.siteDescription || `${BRAND} Physics Lab gồm CMS toàn quyền, AI trợ giảng, bài học và mô phỏng 3D.`,
    'limit.upload_mb': input.uploadLimitMb,
    'limit.exam_questions': input.examQuestionLimit,
    'limit.ai_requests_per_day': input.aiRequestsPerDay,
    'feature.exam_enabled': true,
    'db.driver': 'mysql'
  };

  for (const [ma, giaTri] of Object.entries(settingsMap)) {
    const fallback = DEFAULT_SETTINGS.find((x) => x.ma === ma);
    await prisma.cauHinhHeThong.upsert({
      where: { ma },
      update: { giaTri: giaTri as any },
      create: { ma, nhom: fallback?.nhom ?? 'he_thong', ten: fallback?.ten ?? ma, moTa: fallback?.moTa, giaTri: giaTri as any }
    });
  }

  await prisma.trangNoiDung.upsert({
    where: { slug: 'trang-chu' },
    update: { tieuDe: input.systemName, noiDungMarkdown: `# ${input.systemName}

${BRAND} installer đã hoàn tất. Đăng nhập bằng CMS Root để quản trị toàn hệ thống hoặc Admin để vận hành học vụ.` },
    create: { tieuDe: input.systemName, slug: 'trang-chu', moTa: 'Trang mặc định do installer tạo ra', noiDungMarkdown: `# ${input.systemName}

${BRAND} installer đã hoàn tất.`, trangThai: 'XUAT_BAN' }
  });

  await logSystem({ nhom: 'installer', hanhDong: 'run_installer', doiTuong: 'system', duLieuJson: { rootEmail: input.rootEmail, adminEmail: input.adminEmail } });
  return { cmsRoot, admin };
}

export async function getCmsData() {
  await ensureSystemSettings();
  await ensureLessonSimulationCoverage();
  const [settings, pages, users, lessons, logs, aiLogs, stats, media] = await Promise.all([
    prisma.cauHinhHeThong.findMany({ orderBy: [{ nhom: 'asc' }, { ma: 'asc' }] }),
    prisma.trangNoiDung.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.nguoiDung.findMany({ select: { id: true, email: true, tenHienThi: true, hoTen: true, vaiTro: true, trangThai: true, lopHoc: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: 'desc' } }),
    prisma.baiHoc.findMany({ include: { chuong: true, moPhong: true, phanKienThuc: { orderBy: { thuTu: 'asc' } } }, orderBy: [{ chuong: { lop: 'asc' } }, { chuong: { thuTu: 'asc' } }, { thuTu: 'asc' }] }),
    prisma.nhatKyHeThong.findMany({ take: 80, orderBy: { createdAt: 'desc' }, include: { nguoiDung: { select: { email: true, vaiTro: true } } } }),
    prisma.lichSuAI.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
    Promise.all([prisma.nguoiDung.count(), prisma.baiHoc.count(), prisma.deThi.count(), prisma.cauHoi.count(), prisma.lichSuAI.count(), prisma.nhatKyHeThong.count()]),
    listMedia()
  ]);

  const runtime = {
    node: process.version,
    platform: `${process.platform} ${os.release()}`,
    uptimeSec: Math.round(process.uptime()),
    uptimeHum: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    cpuCount: os.cpus().length,
    loadAvg: os.loadavg().map((v) => Number(v.toFixed(2)))
  };

  const analytics = {
    lessonByGrade: lessons.reduce((acc: Record<string, number>, lesson: any) => {
      const key = `Lớp ${lesson.chuong.lop}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    aiByProvider: aiLogs.reduce((acc: Record<string, number>, item: any) => {
      const key = item.nhaCungCap || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    logsByGroup: logs.reduce((acc: Record<string, number>, item: any) => {
      const key = item.nhom || 'khac';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  };

  return {
    settings,
    pages,
    users,
    lessons,
    logs,
    aiLogs,
    media,
    dbInfo: extractDbInfo(),
    runtime,
    apiMetrics: getApiMetrics(),
    analytics,
    stats: {
      users: stats[0],
      lessons: stats[1],
      exams: stats[2],
      questions: stats[3],
      aiLogs: stats[4],
      systemLogs: stats[5]
    }
  };
}

export async function updateSystemSettings(items: Array<{ ma: string; giaTri: unknown }>, actorId?: string) {
  for (const item of items) {
    const normalized = item.ma === 'feature.exam_enabled' ? true : item.giaTri;
    await prisma.cauHinhHeThong.update({ where: { ma: item.ma }, data: { giaTri: normalized as any } });
  }
  await logSystem({ nhom: 'cms', hanhDong: 'update_settings', doiTuong: 'cau_hinh', nguoiDungId: actorId ?? null, duLieuJson: { count: items.length } });
  return prisma.cauHinhHeThong.findMany({ orderBy: [{ nhom: 'asc' }, { ma: 'asc' }] });
}

export async function upsertPage(input: { id?: string; tieuDe: string; slug: string; moTa?: string; noiDungMarkdown: string; trangThai: 'NHAP' | 'XUAT_BAN' }, actorId?: string) {
  const page = input.id ? await prisma.trangNoiDung.update({ where: { id: input.id }, data: input }) : await prisma.trangNoiDung.create({ data: input });
  await logSystem({ nhom: 'cms', hanhDong: input.id ? 'update_page' : 'create_page', doiTuong: input.slug, nguoiDungId: actorId ?? null });
  return page;
}

export async function deletePage(id: string, actorId?: string) {
  const page = await prisma.trangNoiDung.findUnique({ where: { id } });
  await prisma.trangNoiDung.delete({ where: { id } });
  await logSystem({ nhom: 'cms', hanhDong: 'delete_page', doiTuong: page?.slug ?? id, nguoiDungId: actorId ?? null });
}

function deriveLessonSimulation(meta: { ten?: string; chuDeThi?: string; chapterName?: string }, requested?: { coMoPhong?: boolean; simulationType?: string; simulationParams?: Record<string, unknown> }, lessonIndex = 0, usedTypes: Set<string> = new Set()) {
  if (requested?.coMoPhong === false) {
    throw new HttpError(400, 'Mỗi bài học bắt buộc phải có ít nhất 1 mô phỏng riêng. Không thể tắt mô phỏng ở lesson builder.');
  }

  const preset = requested?.simulationType
    ? (SIMULATION_PRESETS.find((item) => item.type === requested.simulationType) ?? pickPreset(meta, usedTypes, lessonIndex))
    : pickPreset(meta, usedTypes, lessonIndex);

  const simulationType = preset?.type ?? null;
  const simulationLabel = simulationType ? (preset?.label ?? simulationType) : null;
  const simulationParams = Object.keys(requested?.simulationParams ?? {}).length
    ? (requested?.simulationParams ?? {})
    : (preset?.defaultParams ?? {});

  return {
    coMoPhong: Boolean(simulationType),
    simulationType,
    simulationLabel,
    simulationParams,
    loaiBai: simulationType ? 'SIMULATION' as const : 'THEORY' as const
  };
}

export async function updateLessonCms(input: { id: string; moTa?: string; loaiBai?: string; coMoPhong?: boolean; coAI?: boolean; chuDeThi?: string; simulationType?: string; simulationParams?: Record<string, unknown>; simulationConfig?: Record<string, unknown> }, actorId?: string) {
  const current = await prisma.baiHoc.findUnique({ where: { id: input.id }, include: { chuong: true, moPhong: true } });
  if (!current) throw new HttpError(404, 'Không tìm thấy bài học');

  const siblings = await prisma.baiHoc.findMany({ where: { id: { not: input.id } }, orderBy: [{ chuong: { lop: 'asc' } }, { chuong: { thuTu: 'asc' } }, { thuTu: 'asc' }] });
  const usedTypes = new Set((siblings || []).map((item: any) => item.simulationType).filter(Boolean));
  const derived = deriveLessonSimulation({ ten: current.ten, chapterName: current.chuong?.ten, chuDeThi: input.chuDeThi ?? current.chuDeThi ?? undefined }, { coMoPhong: input.coMoPhong, simulationType: input.simulationType, simulationParams: input.simulationParams }, siblings.length, usedTypes);

  const lesson = await prisma.baiHoc.update({
    where: { id: input.id },
    data: {
      moTa: input.moTa,
      chuDeThi: input.chuDeThi,
      loaiBai: derived.loaiBai,
      simulationType: derived.simulationType,
      simulationLabel: derived.simulationLabel,
      coMoPhong: true,
      coAI: input.coAI ?? true
    }
  });

  if (!derived.coMoPhong || !derived.simulationType) {
    throw new HttpError(400, 'Không thể lưu bài học mà không có mô phỏng.');
  }

  const nextConfig = buildLessonSimulationConfig({ ...(safeJsonObject(current.moPhong?.cauHinhJson)), ...(input.simulationConfig ?? {}) }, derived.simulationLabel || derived.simulationType, { ...current, chuDeThi: input.chuDeThi ?? current.chuDeThi, slug: current.slug, chuong: current.chuong });

  await prisma.moPhong.upsert({
    where: { baiHocId: input.id },
    update: {
      loaiMoPhong: derived.simulationType,
      cauHinhJson: nextConfig as any,
      thamSoJson: (derived.simulationParams ?? {}) as any
    },
    create: {
      baiHocId: input.id,
      loaiMoPhong: derived.simulationType,
      cauHinhJson: nextConfig as any,
      thamSoJson: (derived.simulationParams ?? {}) as any
    }
  });

  await logSystem({ nhom: 'cms', hanhDong: 'update_lesson', doiTuong: lesson.slug, nguoiDungId: actorId ?? null, duLieuJson: { coMoPhong: derived.coMoPhong, simulationType: derived.simulationType, simulationLabel: derived.simulationLabel } });
  return getCmsData();
}

export async function updateLessonSections(input: { lessonId: string; sections: Array<{ id?: string; tieuDe: string; mucDo: 'DE' | 'TRUNG_BINH' | 'KHO'; noiDungMarkdown: string; thuTu: number }> }, actorId?: string) {
  const lesson = await prisma.baiHoc.findUnique({ where: { id: input.lessonId } });
  if (!lesson) throw new HttpError(404, 'Không tìm thấy bài học');

  const incomingIds = input.sections.map((item) => item.id).filter(Boolean) as string[];
  await prisma.phanKienThuc.deleteMany({ where: { baiHocId: input.lessonId, ...(incomingIds.length ? { id: { notIn: incomingIds } } : {}) } });

  for (const item of input.sections) {
    if (item.id) {
      await prisma.phanKienThuc.update({
        where: { id: item.id },
        data: {
          tieuDe: item.tieuDe,
          mucDo: item.mucDo,
          noiDungMarkdown: item.noiDungMarkdown,
          thuTu: item.thuTu
        }
      });
    } else {
      await prisma.phanKienThuc.create({
        data: {
          baiHocId: input.lessonId,
          tieuDe: item.tieuDe,
          mucDo: item.mucDo,
          noiDungMarkdown: item.noiDungMarkdown,
          thuTu: item.thuTu
        }
      });
    }
  }

  await logSystem({ nhom: 'cms', hanhDong: 'update_lesson_sections', doiTuong: lesson.slug, nguoiDungId: actorId ?? null, duLieuJson: { count: input.sections.length } });
  return getCmsData();
}
