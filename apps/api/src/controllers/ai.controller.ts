import type { Request, Response } from 'express';
import { z } from 'zod';
import { runAI, getAIAvailability } from '../services/ai.service.js';
import { assertFeatureEnabled } from '../services/system.service.js';

const schema = z.object({
  loaiTacVu: z.enum(['giai_thich_ly_thuyet', 'giai_thich_mo_phong', 'giai_bai', 'giai_bai_tu_anh', 'tao_cau_hoi', 'phan_tich_ket_qua']),
  provider: z.enum(['gpt', 'gemini', 'auto']).default('auto'),
  noiDung: z.string().min(1),
  hinhAnhBase64: z.string().optional(),
  boCanh: z.record(z.any()).optional()
});

export async function postAI(req: Request & { user?: { id: string } }, res: Response) {
  await assertFeatureEnabled('ai');
  const payload = schema.parse(req.body);
  res.json(await runAI(payload, req.user?.id));
}

export async function getAIStatus(_req: Request, res: Response) {
  res.json(getAIAvailability());
}
