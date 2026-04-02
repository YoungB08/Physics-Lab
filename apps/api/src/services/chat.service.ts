// @ts-nocheck
import { prisma } from '../config/prisma.js';
import { runAI } from './ai.service.js';
import { HttpError, logSystem } from './system.service.js';

type UserRef = { id: string; vaiTro?: string; tenHienThi?: string | null };

function normalizeText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildConversationTitle(lessonName: string, firstMessage?: string) {
  const seed = normalizeText(firstMessage || '');
  if (!seed) return `Chat về ${lessonName}`;
  const short = seed.length > 48 ? `${seed.slice(0, 48).trim()}...` : seed;
  return short;
}

function toConversationSummary(item: any) {
  const messages = Array.isArray(item.messages) ? item.messages : [];
  const lastMessage = messages[0] || null;
  return {
    id: item.id,
    tieuDe: item.tieuDe,
    tomTat: item.tomTat || lastMessage?.noiDung || '',
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
    baiHoc: item.baiHoc ? {
      id: item.baiHoc.id,
      ten: item.baiHoc.ten,
      slug: item.baiHoc.slug,
      chuDeThi: item.baiHoc.chuDeThi
    } : null,
    lastMessage: lastMessage ? {
      id: lastMessage.id,
      vaiTro: lastMessage.vaiTro,
      noiDung: lastMessage.noiDung,
      createdAt: lastMessage.createdAt
    } : null
  };
}

function toConversationDetail(item: any) {
  return {
    id: item.id,
    tieuDe: item.tieuDe,
    tomTat: item.tomTat || '',
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
    baiHoc: {
      id: item.baiHoc.id,
      ten: item.baiHoc.ten,
      slug: item.baiHoc.slug,
      moTa: item.baiHoc.moTa,
      chuDeThi: item.baiHoc.chuDeThi
    },
    messages: (item.messages || []).map((message: any) => ({
      id: message.id,
      vaiTro: message.vaiTro,
      noiDung: message.noiDung,
      provider: message.provider || null,
      createdAt: message.createdAt
    }))
  };
}

async function getConversationOrThrow(userId: string, id: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: {
      baiHoc: true,
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });
  if (!conversation || conversation.nguoiDungId !== userId) throw new HttpError(404, 'Không tìm thấy cuộc trò chuyện.');
  return conversation;
}

function buildChatPrompt(input: {
  lessonName: string;
  topic?: string | null;
  history: Array<{ vaiTro: string; noiDung: string }>;
  message: string;
}) {
  const recent = input.history.slice(-6).map((item) => `${item.vaiTro === 'user' ? 'Học sinh' : 'Nova'}: ${item.noiDung}`);
  return [
    `Bạn đang chat 1-1 về bài ${input.lessonName}${input.topic ? ` (${input.topic})` : ''}.`,
    'Trả lời như một người thật: tự nhiên, ngắn gọn trước, rõ ràng, thân thiện.',
    'Nếu người dùng chỉ chào hỏi như "hi", "hello", "chào", hãy chào lại tự nhiên trong 1-2 câu và mời họ hỏi tiếp, không biến thành bài giảng.',
    'Nếu là câu hỏi học tập, ưu tiên trả lời trực tiếp, có công thức khi thật sự cần, và tránh văn phong máy móc.',
    recent.length ? `Ngữ cảnh chat gần đây:\n${recent.join('\n')}` : '',
    `Tin nhắn mới: ${input.message}`
  ].filter(Boolean).join('\n\n');
}

export async function listChatConversations(user: UserRef, lessonSlug?: string) {
  const conversations = await prisma.chatConversation.findMany({
    where: {
      nguoiDungId: user.id,
      ...(lessonSlug ? { baiHoc: { slug: lessonSlug } } : {})
    },
    include: {
      baiHoc: { select: { id: true, ten: true, slug: true, chuDeThi: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' },
    take: 100
  });
  return conversations.map(toConversationSummary);
}

export async function createChatConversation(user: UserRef, payload: { lessonSlug: string; tieuDe?: string; firstMessage?: string }) {
  const lesson = await prisma.baiHoc.findUnique({ where: { slug: payload.lessonSlug } });
  if (!lesson) throw new HttpError(404, 'Không tìm thấy bài học.');

  const conversation = await prisma.chatConversation.create({
    data: {
      nguoiDungId: user.id,
      baiHocId: lesson.id,
      tieuDe: normalizeText(payload.tieuDe || '') || buildConversationTitle(lesson.ten, payload.firstMessage),
      tomTat: normalizeText(payload.firstMessage || '') || `Chat về ${lesson.ten}`
    },
    include: {
      baiHoc: true,
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });

  await logSystem({ nhom: 'chat', hanhDong: 'create_conversation', doiTuong: conversation.id, nguoiDungId: user.id, duLieuJson: { lessonSlug: payload.lessonSlug } });
  return toConversationDetail(conversation);
}

export async function getChatConversationDetail(user: UserRef, id: string) {
  return toConversationDetail(await getConversationOrThrow(user.id, id));
}

export async function sendChatMessage(user: UserRef, conversationId: string, payload: { noiDung: string; provider?: 'auto' | 'gpt' | 'gemini' }) {
  const conversation = await getConversationOrThrow(user.id, conversationId);
  const noiDung = normalizeText(payload.noiDung);
  if (!noiDung) throw new HttpError(400, 'Tin nhắn không được để trống.');

  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      nguoiDungId: user.id,
      vaiTro: 'user',
      noiDung
    }
  });

  const history = conversation.messages.map((item) => ({ vaiTro: item.vaiTro, noiDung: item.noiDung }));
  const aiResult = await runAI({
    loaiTacVu: 'giai_bai',
    provider: payload.provider ?? 'auto',
    noiDung: buildChatPrompt({
      lessonName: conversation.baiHoc.ten,
      topic: conversation.baiHoc.chuDeThi,
      history,
      message: noiDung
    }),
    boCanh: {
      lesson: conversation.baiHoc.ten,
      topic: conversation.baiHoc.chuDeThi,
      lessonSlug: conversation.baiHoc.slug,
      chatMode: 'lesson_1_1',
      latestMessage: noiDung
    }
  }, user.id);

  const assistantText = String(
    aiResult?.du_lieu?.giai_thich ||
    (Array.isArray(aiResult?.du_lieu?.noi_dung_chinh) ? aiResult.du_lieu.noi_dung_chinh.join('\n') : '') ||
    aiResult?.du_lieu?.tom_tat ||
    'Mình chưa có câu trả lời phù hợp, bạn hỏi lại giúp mình nhé.'
  ).trim();

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      vaiTro: 'assistant',
      noiDung: assistantText,
      provider: aiResult.nha_cung_cap,
      metaJson: {
        trace: aiResult.trace || null,
        model: aiResult.meta?.model || null
      } as any
    }
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: {
      tomTat: noiDung.length > 140 ? `${noiDung.slice(0, 140).trim()}...` : noiDung,
      tieuDe: conversation.messages.length ? conversation.tieuDe : buildConversationTitle(conversation.baiHoc.ten, noiDung)
    }
  });

  await logSystem({ nhom: 'chat', hanhDong: 'send_message', doiTuong: conversationId, nguoiDungId: user.id, duLieuJson: { provider: aiResult.nha_cung_cap, messageId: userMessage.id, replyId: assistantMessage.id } });

  return {
    conversationId,
    userMessage: {
      id: userMessage.id,
      vaiTro: userMessage.vaiTro,
      noiDung: userMessage.noiDung,
      createdAt: userMessage.createdAt
    },
    assistantMessage: {
      id: assistantMessage.id,
      vaiTro: assistantMessage.vaiTro,
      noiDung: assistantMessage.noiDung,
      provider: assistantMessage.provider,
      createdAt: assistantMessage.createdAt
    },
    trace: aiResult.trace || null
  };
}
