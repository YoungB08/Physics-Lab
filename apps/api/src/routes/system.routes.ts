import { Router } from 'express';
import { z } from 'zod';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { deletePage, getCmsData, getPublicSystemInfo, isInstalled, runInstaller, updateLessonCms, updateLessonSections, updateSystemSettings, upsertPage } from '../services/system.service.js';

const router = Router();

const installerSchema = z.object({
  systemName: z.string().min(2),
  brandName: z.string().min(2),
  supportEmail: z.string().email(),
  siteDescription: z.string().min(10).max(300),
  rootEmail: z.string().email(),
  rootPassword: z.string().min(6),
  rootName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  adminName: z.string().min(2),
  uploadLimitMb: z.coerce.number().min(1).max(500),
  examQuestionLimit: z.coerce.number().min(1).max(500),
  aiRequestsPerDay: z.coerce.number().min(1).max(100000)
});

const cmsPageSchema = z.object({
  id: z.string().optional(),
  tieuDe: z.string().trim().min(1, 'Tiêu đề không được để trống'),
  slug: z.string().trim().min(1, 'Slug không được để trống'),
  moTa: z.string().optional(),
  noiDungMarkdown: z.string().trim().min(1, 'Nội dung không được để trống'),
  trangThai: z.enum(['NHAP', 'XUAT_BAN'])
});

const lessonCmsSchema = z.object({
  id: z.string().min(1),
  moTa: z.string().optional(),
  loaiBai: z.string().default('SIMULATION'),
  coMoPhong: z.boolean().default(true),
  coAI: z.boolean().default(true),
  chuDeThi: z.string().optional(),
  simulationType: z.string().optional(),
  simulationParams: z.record(z.unknown()).optional(),
  simulationConfig: z.record(z.unknown()).optional()
});

router.get('/thong-tin', async (_req, res) => res.json(await getPublicSystemInfo()));

const lessonSectionsSchema = z.object({
  lessonId: z.string().min(1),
  sections: z.array(z.object({
    id: z.string().optional(),
    tieuDe: z.string().trim().min(1),
    mucDo: z.enum(['DE', 'TRUNG_BINH', 'KHO']),
    noiDungMarkdown: z.string().trim().min(1),
    thuTu: z.coerce.number().int().min(1)
  })).min(1)
});

router.get('/trang-thai-cai-dat', async (_req, res) => res.json({ installed: await isInstalled() }));
router.post('/cai-dat', async (req, res) => res.json(await runInstaller(installerSchema.parse(req.body))));

router.use('/cms', authRequired, requireRoles('CMS_ROOT'));
router.get('/cms', async (_req, res) => res.json(await getCmsData()));
router.put('/cms/cau-hinh', async (req: any, res) => {
  const schema = z.object({ items: z.array(z.object({ ma: z.string(), giaTri: z.unknown() })) });
  const parsed = schema.parse(req.body);
  res.json(await updateSystemSettings(parsed.items as Array<{ ma: string; giaTri: unknown }>, req.user?.id));
});
router.post('/cms/trang', async (req: any, res) => res.json(await upsertPage(cmsPageSchema.parse(req.body), req.user?.id)));
router.delete('/cms/trang/:id', async (req: any, res) => {
  await deletePage(req.params.id, req.user?.id);
  res.json({ ok: true });
});
router.put('/cms/bai-hoc', async (req: any, res) => res.json(await updateLessonCms(lessonCmsSchema.parse(req.body), req.user?.id)));
router.put('/cms/bai-hoc/noi-dung', async (req: any, res) => res.json(await updateLessonSections(lessonSectionsSchema.parse(req.body), req.user?.id)));

export default router;
