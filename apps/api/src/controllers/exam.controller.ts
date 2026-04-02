import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { assertFeatureEnabled } from '../services/system.service.js';
import { changeExamStatus, examRoomStatus, exportExamPdf, getExamDetail, joinExamRoom, listExams, recordIntegrityEvent, recordTabOut, saveAttemptAnswer, submitAttempt, taoDeThi, thongKeTheoRole, updateExamMeta } from '../services/exam.service.js';

const MAX_TAB_SWITCH_LIMIT = 99;

const createExamSchema = z.object({
  ten: z.string().min(3),
  lop: z.number().int().min(10).max(12),
  thoiGianPhut: z.number().int().min(5).max(180),
  soLuongCau: z.number().int().min(1).max(100),
  mucDo: z.enum(['DE', 'TRUNG_BINH', 'KHO']),
  cheDo: z.enum(['NGAN_HANG', 'AI', 'KEP']),
  baiHocSlug: z.string().optional(),
  providerAI: z.enum(['gpt', 'gemini', 'auto']).optional(),
  maxTabSwitch: z.number().int().min(0).max(MAX_TAB_SWITCH_LIMIT).optional(),
  daoCauHoi: z.boolean().optional(),
  fullScreenRequired: z.boolean().optional(),
  strictAntiCheat: z.boolean().optional(),
  hideResultDetails: z.boolean().optional()
});

const updateExamSchema = z.object({
  ten: z.string().min(3).optional(),
  thoiGianPhut: z.number().int().min(5).max(180).optional(),
  maxTabSwitch: z.number().int().min(0).max(MAX_TAB_SWITCH_LIMIT).optional(),
  daoCauHoi: z.boolean().optional(),
  fullScreenRequired: z.boolean().optional(),
  strictAntiCheat: z.boolean().optional(),
  hideResultDetails: z.boolean().optional(),
  questions: z.array(z.object({
    id: z.string(),
    noiDung: z.string(),
    loai: z.string(),
    mucDo: z.string(),
    options: z.array(z.object({ key: z.string(), text: z.string() })).min(2),
    correctAnswers: z.array(z.string()).min(1),
    explanation: z.string().optional(),
    sourceQuestionId: z.string().nullable().optional()
  })).optional()
});

const saveAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.any(),
  elapsedSec: z.number().int().min(0).max(60 * 60 * 6)
});

const integritySchema = z.object({
  type: z.string().min(1).max(100),
  detail: z.string().max(300).optional()
});

export async function postTaoDe(req: Request & { user?: { id: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  const payload = createExamSchema.parse(req.body);
  res.json(await taoDeThi({ ...payload, giaoVienId: req.user!.id }));
}

export async function getThongKe(req: Request & { user?: { id: string; vaiTro: string } }, res: Response) {
  res.json(await thongKeTheoRole(req.user!));
}

export async function getExamList(req: Request & { user?: { id: string; vaiTro: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  res.json(await listExams(req.user!));
}

export async function getExamDetailHandler(req: Request & { user?: { id: string; vaiTro: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  res.json(await getExamDetail(req.user!, String(req.params.id)));
}

export async function patchExamHandler(req: Request & { user?: { id: string; vaiTro: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  res.json(await updateExamMeta(req.user!, String(req.params.id), updateExamSchema.parse(req.body)));
}

export async function exportExamPdfHandler(req: Request & { user?: { id: string; vaiTro: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  const buffer = await exportExamPdf(req.user!, String(req.params.id));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="de-thi-${req.params.id}.pdf"`);
  res.send(buffer);
}

export async function postExamActionHandler(req: Request & { user?: { id: string; vaiTro: string } }, res: Response, next: NextFunction) {
  try {
    await assertFeatureEnabled('exam');
    const action = z.enum(['confirm', 'start', 'stop', 'lock', 'delete']).parse(String(req.params.action));
    res.json(await changeExamStatus(req.user!, String(req.params.id), action));
  } catch (error) {
    next(error);
  }
}

export async function joinExamHandler(req: Request & { user?: { id: string; vaiTro: string; tenHienThi?: string | null } }, res: Response) {
  await assertFeatureEnabled('exam');
  res.json(await joinExamRoom(String(req.params.qrToken), req.user!));
}

export async function examStatusHandler(req: Request, res: Response) {
  await assertFeatureEnabled('exam');
  res.json(await examRoomStatus(String(req.params.qrToken)));
}

export async function saveAnswerHandler(req: Request & { user?: { id: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  const parsed = saveAnswerSchema.parse(req.body);
  res.json(await saveAttemptAnswer(req.user!, String(req.params.attemptId), { questionId: parsed.questionId, answer: parsed.answer, elapsedSec: parsed.elapsedSec }));
}

export async function tabOutHandler(req: Request & { user?: { id: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  res.json(await recordTabOut(req.user!, String(req.params.attemptId)));
}

export async function submitAttemptHandler(req: Request & { user?: { id: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  res.json(await submitAttempt(req.user!, String(req.params.attemptId)));
}

export async function integrityEventHandler(req: Request & { user?: { id: string } }, res: Response) {
  await assertFeatureEnabled('exam');
  const parsed = integritySchema.parse(req.body);
  res.json(await recordIntegrityEvent(req.user!, String(req.params.attemptId), parsed));
}
