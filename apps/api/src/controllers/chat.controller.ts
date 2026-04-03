import type { Request, Response } from 'express';
import { z } from 'zod';
import { createChatConversation, getChatConversationDetail, listChatConversations, sendChatMessage } from '../services/chatlog.service.js';

const createConversationSchema = z.object({
  lessonSlug: z.string().min(1).optional(),
  kind: z.enum(['lesson_1_1', 'ai_console']).optional(),
  tieuDe: z.string().optional(),
  firstMessage: z.string().optional()
});

const sendMessageSchema = z.object({
  noiDung: z.string().min(1),
  provider: z.enum(['auto', 'gpt', 'gemini']).optional(),
  hinhAnhBase64: z.string().optional(),
  boCanh: z.record(z.any()).optional()
});

export async function listConversationsHandler(req: Request & { user?: { id: string; vaiTro?: string } }, res: Response) {
  res.json(await listChatConversations(req.user!, typeof req.query.lessonSlug === 'string' ? req.query.lessonSlug : undefined));
}

export async function createConversationHandler(req: Request & { user?: { id: string; vaiTro?: string } }, res: Response) {
  res.json(await createChatConversation(req.user!, createConversationSchema.parse(req.body)));
}

export async function getConversationDetailHandler(req: Request & { user?: { id: string; vaiTro?: string } }, res: Response) {
  res.json(await getChatConversationDetail(req.user!, String(req.params.id)));
}

export async function sendMessageHandler(req: Request & { user?: { id: string; vaiTro?: string } }, res: Response) {
  res.json(await sendChatMessage(req.user!, String(req.params.id), sendMessageSchema.parse(req.body)));
}
