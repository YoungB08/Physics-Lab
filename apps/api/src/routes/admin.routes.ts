import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { logSystem } from '../services/system.service.js';

const router = Router();
router.use(authRequired, requireRoles('QUAN_TRI_VIEN', 'CMS_ROOT'));

router.get('/tong-quan', async (_req, res) => {
  const [users, lessons, questions, aiLogs, exams] = await Promise.all([
    prisma.nguoiDung.count(),
    prisma.baiHoc.count(),
    prisma.cauHoi.count(),
    prisma.lichSuAI.count(),
    prisma.deThi.count()
  ]);
  res.json({ users, lessons, questions, aiLogs, exams });
});


router.post('/nguoi-dung', async (req: any, res) => {
  const zod = await import('zod');
  const schema = zod.z.object({
    email: zod.z.string().trim().toLowerCase().email(),
    tenHienThi: zod.z.string().optional().nullable(),
    hoTen: zod.z.string().optional().nullable(),
    vaiTro: zod.z.enum(['HOC_SINH', 'GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT']),
    trangThai: zod.z.enum(['HOAT_DONG', 'KHOA']).default('HOAT_DONG'),
    lopHoc: zod.z.string().optional().nullable(),
    matKhauMoi: zod.z.string().min(6)
  });
  const parsed = schema.parse(req.body);
  const exists = await prisma.nguoiDung.findUnique({ where: { email: parsed.email } });
  if (exists) return res.status(400).json({ message: 'Email đã tồn tại.' });
  const user = await prisma.nguoiDung.create({
    data: {
      email: parsed.email,
      tenHienThi: parsed.tenHienThi || null,
      hoTen: parsed.hoTen || parsed.tenHienThi || null,
      vaiTro: parsed.vaiTro,
      trangThai: parsed.trangThai,
      lopHoc: parsed.lopHoc || null,
      matKhauHash: await bcrypt.hash(parsed.matKhauMoi, 10)
    },
    select: { id: true, email: true, tenHienThi: true, hoTen: true, vaiTro: true, trangThai: true, lopHoc: true, createdAt: true }
  });
  await logSystem({ nhom: 'admin', hanhDong: 'create_user', doiTuong: user.email, nguoiDungId: req.user?.id, duLieuJson: { id: user.id, vaiTro: user.vaiTro } });
  res.json(user);
});

router.get('/nguoi-dung', async (_req, res) => {
  const users = await prisma.nguoiDung.findMany({
    select: { id: true, email: true, tenHienThi: true, hoTen: true, vaiTro: true, trangThai: true, lopHoc: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});



router.put('/nguoi-dung/:id', async (req: any, res) => {
  const schema = (await import('zod')).z.object({
    email: (await import('zod')).z.string().trim().toLowerCase().email(),
    tenHienThi: (await import('zod')).z.string().optional().nullable(),
    hoTen: (await import('zod')).z.string().optional().nullable(),
    vaiTro: (await import('zod')).z.enum(['HOC_SINH', 'GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT']),
    trangThai: (await import('zod')).z.enum(['HOAT_DONG', 'KHOA']),
    lopHoc: (await import('zod')).z.string().optional().nullable(),
    matKhauMoi: (await import('zod')).z.string().min(6).optional().or((await import('zod')).z.literal(''))
  });
  const parsed = schema.parse(req.body);
  const existing = await prisma.nguoiDung.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  const data: any = {
    email: parsed.email,
    tenHienThi: parsed.tenHienThi || null,
    hoTen: parsed.hoTen || parsed.tenHienThi || null,
    vaiTro: parsed.vaiTro,
    trangThai: parsed.trangThai,
    lopHoc: parsed.lopHoc || null
  };
  if (parsed.matKhauMoi) data.matKhauHash = await bcrypt.hash(parsed.matKhauMoi, 10);
  const user = await prisma.nguoiDung.update({
    where: { id: req.params.id },
    data,
    select: { id: true, email: true, tenHienThi: true, hoTen: true, vaiTro: true, trangThai: true, lopHoc: true, createdAt: true }
  });
  await logSystem({ nhom: 'admin', hanhDong: 'update_user', doiTuong: user.email, nguoiDungId: req.user?.id, duLieuJson: { id: user.id, vaiTro: user.vaiTro, trangThai: user.trangThai } });
  res.json(user);
});

router.delete('/nguoi-dung/:id', async (req: any, res) => {
  const existing = await prisma.nguoiDung.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  await prisma.nguoiDung.delete({ where: { id: req.params.id } });
  await logSystem({ nhom: 'admin', hanhDong: 'delete_user', doiTuong: existing.email, nguoiDungId: req.user?.id, duLieuJson: { id: existing.id } });
  res.json({ ok: true });
});

export default router;
