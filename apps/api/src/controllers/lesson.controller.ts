import type { Request, Response } from 'express';
import { getCurriculum, getLessonBySlug } from '../services/lesson.service.js';
export async function listCurriculum(_req: Request, res: Response) { res.json(await getCurriculum()); }
export async function getLesson(req: Request, res: Response) {
  const data = await getLessonBySlug(String(req.params.slug));
  if (!data) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  res.json(data);
}
