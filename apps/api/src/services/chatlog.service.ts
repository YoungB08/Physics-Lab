import { prisma } from '../config/prisma.js';
import { runAI } from './ai.service.js';
import { HttpError, logSystem } from './system.service.js';

type UserRef = { id: string; vaiTro?: string; tenHienThi?: string | null };
type ConversationKind = 'lesson_1_1' | 'ai_console';

function normalizeText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function conversationTitle(lessonName?: string, firstMessage?: string, kind: ConversationKind = 'lesson_1_1') {
  const text = normalizeText(firstMessage || '');
  if (text) return text.length > 48 ? `${text.slice(0, 48).trim()}...` : text;
  if (kind === 'ai_console') return 'Chat với AI';
  return `Chat về ${lessonName || 'bài học'}`;
}

function conversationSummary(lessonName?: string, firstMessage?: string, kind: ConversationKind = 'lesson_1_1') {
  const text = normalizeText(firstMessage || '');
  if (text) return text.length > 140 ? `${text.slice(0, 140).trim()}...` : text;
  if (kind === 'ai_console') return 'Phiên chat AI tổng quát';
  return `Chat về ${lessonName || 'bài học'}`;
}

async function getLessonBySlugOrThrow(slug: string) {
  const lesson = await prisma.baiHoc.findUnique({ where: { slug } });
  if (!lesson) throw new HttpError(404, 'Không tìm thấy bài học.');
  return lesson;
}

async function getConversationOrThrow(userId: string, id: string) {
  const row = await prisma.nhatKyHeThong.findUnique({ where: { id } });
  if (!row || row.nhom !== 'chat' || row.hanhDong !== 'conversation' || row.nguoiDungId !== userId) {
    throw new HttpError(404, 'Không tìm thấy cuộc trò chuyện.');
  }
  return row;
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
    'Trả lời như một người thật: tự nhiên, thân thiện, ngắn gọn trước, rõ ràng và đúng trọng tâm.',
    'Nếu người dùng chỉ chào hỏi như "hi", "hello", "chào", hãy chào lại tự nhiên trong 1-2 câu và mời họ hỏi tiếp, không biến thành bài giảng.',
    'Nếu là câu hỏi học tập, ưu tiên trả lời trực tiếp, có công thức khi thật sự cần, và tránh văn phong máy móc.',
    recent.length ? `Ngữ cảnh chat gần đây:\n${recent.join('\n')}` : '',
    `Tin nhắn mới: ${input.message}`
  ].filter(Boolean).join('\n\n');
}

function buildConsolePrompt(input: {
  history: Array<{ vaiTro: string; noiDung: string }>;
  message: string;
}) {
  const recent = input.history.slice(-6).map((item) => `${item.vaiTro === 'user' ? 'Người dùng' : 'Nova'}: ${item.noiDung}`);
  return [
    'Bạn đang chat trong giao diện Hỏi AI tổng quát của KNTech.',
    'Trả lời hoàn toàn bằng tiếng Việt có dấu, rõ ràng, tự nhiên, tránh văn phong máy móc.',
    'Nếu là câu hỏi học tập thì giải thích trực tiếp, có ví dụ hoặc công thức khi cần.',
    recent.length ? `Ngữ cảnh chat gần đây:\n${recent.join('\n')}` : '',
    `Tin nhắn mới: ${input.message}`
  ].filter(Boolean).join('\n\n');
}

async function loadLessonMapFromRows(rows: any[]) {
  const lessonIds = Array.from(new Set(rows.map((row) => safeObject(row.duLieuJson).baiHocId).filter(Boolean)));
  const lessons = lessonIds.length
    ? await prisma.baiHoc.findMany({ where: { id: { in: lessonIds } }, select: { id: true, ten: true, slug: true, moTa: true, chuDeThi: true } })
    : [];
  return new Map(lessons.map((lesson) => [lesson.id, lesson]));
}

export async function listChatConversations(user: UserRef, lessonSlug?: string) {
  const rows = await prisma.nhatKyHeThong.findMany({
    where: { nhom: 'chat', hanhDong: 'conversation', nguoiDungId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  const lessonMap = await loadLessonMapFromRows(rows);
  const filtered = rows.filter((row) => {
    const data = safeObject(row.duLieuJson);
    return lessonSlug ? data.baiHocSlug === lessonSlug : true;
  });

  const latestMessages = filtered.length
    ? await prisma.nhatKyHeThong.findMany({
        where: { nhom: 'chat', hanhDong: 'message', doiTuong: { in: filtered.map((row) => row.id) } },
        orderBy: { createdAt: 'desc' }
      })
    : [];
  const latestMap = new Map<string, any>();
  for (const row of latestMessages) {
    if (row.doiTuong && !latestMap.has(row.doiTuong)) latestMap.set(row.doiTuong, row);
  }

  return filtered.map((row) => {
    const data = safeObject(row.duLieuJson);
    const lesson = lessonMap.get(data.baiHocId || '');
    const latest = latestMap.get(row.id);
    const latestData = safeObject(latest?.duLieuJson);
    return {
      id: row.id,
      kind: String(data.kind || 'lesson_1_1'),
      tieuDe: data.tieuDe || 'Cuộc trò chuyện',
      tomTat: data.tomTat || latestData.noiDung || '',
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
      baiHoc: lesson ? { id: lesson.id, ten: lesson.ten, slug: lesson.slug, chuDeThi: lesson.chuDeThi } : null,
      lastMessage: latest ? {
        id: latest.id,
        vaiTro: latestData.vaiTro || 'assistant',
        noiDung: latestData.noiDung || '',
        createdAt: latest.createdAt
      } : null
    };
  });
}

export async function createChatConversation(user: UserRef, payload: { lessonSlug?: string; kind?: ConversationKind; tieuDe?: string; firstMessage?: string }) {
  const kind = payload.kind || (payload.lessonSlug ? 'lesson_1_1' : 'ai_console');
  const lesson = payload.lessonSlug ? await getLessonBySlugOrThrow(payload.lessonSlug) : null;
  if (kind === 'lesson_1_1' && !lesson) throw new HttpError(400, 'Thiếu bài học cho cuộc trò chuyện này.');

  const tieuDe = normalizeText(payload.tieuDe || '') || conversationTitle(lesson?.ten, payload.firstMessage, kind);
  const tomTat = conversationSummary(lesson?.ten, payload.firstMessage, kind);
  const payloadJson = lesson
    ? { kind, baiHocId: lesson.id, baiHocSlug: lesson.slug, tieuDe, tomTat }
    : { kind, tieuDe, tomTat };

  const row = await prisma.nhatKyHeThong.create({
    data: {
      muc: 'INFO',
      nhom: 'chat',
      hanhDong: 'conversation',
      doiTuong: lesson?.id || kind,
      nguoiDungId: user.id,
      duLieuJson: payloadJson as any
    }
  });

  await logSystem({
    nhom: 'chat',
    hanhDong: 'create_conversation',
    doiTuong: row.id,
    nguoiDungId: user.id,
    duLieuJson: { lessonSlug: payload.lessonSlug || null, kind }
  });

  return {
    id: row.id,
    kind,
    tieuDe,
    tomTat,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    baiHoc: lesson ? { id: lesson.id, ten: lesson.ten, slug: lesson.slug, moTa: lesson.moTa, chuDeThi: lesson.chuDeThi } : null,
    messages: []
  };
}

export async function getChatConversationDetail(user: UserRef, id: string) {
  const row = await getConversationOrThrow(user.id, id);
  const data = safeObject(row.duLieuJson);
  const lesson = data.baiHocId
    ? await prisma.baiHoc.findUnique({ where: { id: String(data.baiHocId || '') }, select: { id: true, ten: true, slug: true, moTa: true, chuDeThi: true } })
    : null;

  const messages = await prisma.nhatKyHeThong.findMany({
    where: { nhom: 'chat', hanhDong: 'message', doiTuong: id },
    orderBy: { createdAt: 'asc' }
  });

  return {
    id: row.id,
    kind: String(data.kind || 'lesson_1_1'),
    tieuDe: data.tieuDe || 'Cuộc trò chuyện',
    tomTat: data.tomTat || '',
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    baiHoc: lesson,
    messages: messages.map((message) => {
      const msg = safeObject(message.duLieuJson);
      return {
        id: message.id,
        vaiTro: msg.vaiTro || 'assistant',
        noiDung: msg.noiDung || '',
        provider: msg.provider || null,
        hinhAnhBase64: msg.hinhAnhBase64 || null,
        createdAt: message.createdAt
      };
    })
  };
}

export async function sendChatMessage(user: UserRef, conversationId: string, payload: {
  noiDung: string;
  provider?: 'auto' | 'gpt' | 'gemini';
  hinhAnhBase64?: string;
  boCanh?: Record<string, any>;
}) {
  const conversation = await getConversationOrThrow(user.id, conversationId);
  const conversationData = safeObject(conversation.duLieuJson);
  const kind = String(conversationData.kind || 'lesson_1_1') as ConversationKind;
  const lesson = conversationData.baiHocId
    ? await prisma.baiHoc.findUnique({ where: { id: String(conversationData.baiHocId || '') } })
    : null;
  if (kind === 'lesson_1_1' && !lesson) throw new HttpError(404, 'Không tìm thấy bài học của cuộc trò chuyện.');

  const noiDung = normalizeText(payload.noiDung);
  if (!noiDung) throw new HttpError(400, 'Tin nhắn không được để trống.');

  const userMessage = await prisma.nhatKyHeThong.create({
    data: {
      muc: 'INFO',
      nhom: 'chat',
      hanhDong: 'message',
      doiTuong: conversationId,
      nguoiDungId: user.id,
      duLieuJson: {
        vaiTro: 'user',
        noiDung,
        hinhAnhBase64: payload.hinhAnhBase64 || null
      } as any
    }
  });

  const historyRows = await prisma.nhatKyHeThong.findMany({
    where: { nhom: 'chat', hanhDong: 'message', doiTuong: conversationId },
    orderBy: { createdAt: 'asc' },
    take: 12
  });
  const history = historyRows.map((row) => {
    const data = safeObject(row.duLieuJson);
    return { vaiTro: String(data.vaiTro || 'assistant'), noiDung: String(data.noiDung || '') };
  });

  const aiPayload = kind === 'lesson_1_1' && lesson
    ? {
        loaiTacVu: 'giai_bai',
        provider: payload.provider ?? 'auto',
        noiDung: buildChatPrompt({
          lessonName: lesson.ten,
          topic: lesson.chuDeThi,
          history,
          message: noiDung
        }),
        boCanh: {
          lesson: lesson.ten,
          topic: lesson.chuDeThi,
          lessonSlug: lesson.slug,
          chatMode: 'lesson_1_1',
          latestMessage: noiDung,
          ...(payload.boCanh || {})
        }
      }
    : {
        loaiTacVu: payload.hinhAnhBase64 ? 'giai_bai_tu_anh' : 'giai_bai',
        provider: payload.provider ?? 'auto',
        noiDung: payload.hinhAnhBase64 ? (noiDung || 'Phân tích giúp mình ảnh này.') : buildConsolePrompt({ history, message: noiDung }),
        hinhAnhBase64: payload.hinhAnhBase64,
        boCanh: {
          chatMode: 'ai_console',
          latestMessage: noiDung,
          hasImage: Boolean(payload.hinhAnhBase64),
          ...(payload.boCanh || {})
        }
      };

  const aiResult = await runAI(aiPayload as any, user.id);

  const assistantText = String(
    aiResult?.du_lieu?.giai_thich ||
    (Array.isArray(aiResult?.du_lieu?.noi_dung_chinh) ? aiResult.du_lieu.noi_dung_chinh.join('\n') : '') ||
    aiResult?.du_lieu?.tom_tat ||
    'Mình chưa có câu trả lời phù hợp, bạn hỏi lại giúp mình nhé.'
  ).trim();

  const assistantMessage = await prisma.nhatKyHeThong.create({
    data: {
      muc: 'INFO',
      nhom: 'chat',
      hanhDong: 'message',
      doiTuong: conversationId,
      nguoiDungId: user.id,
      duLieuJson: {
        vaiTro: 'assistant',
        noiDung: assistantText,
        provider: aiResult.nha_cung_cap,
        trace: aiResult.trace || null
      } as any
    }
  });

  await prisma.nhatKyHeThong.update({
    where: { id: conversationId },
    data: {
      duLieuJson: {
        ...conversationData,
        tieuDe: conversationData.tieuDe || conversationTitle(lesson?.ten, noiDung, kind),
        tomTat: conversationSummary(lesson?.ten, noiDung, kind)
      } as any
    }
  });

  await logSystem({
    nhom: 'chat',
    hanhDong: 'send_message',
    doiTuong: conversationId,
    nguoiDungId: user.id,
    duLieuJson: { provider: aiResult.nha_cung_cap, userMessageId: userMessage.id, assistantMessageId: assistantMessage.id, kind }
  });

  return {
    conversationId,
    userMessage: { id: userMessage.id, vaiTro: 'user', noiDung, hinhAnhBase64: payload.hinhAnhBase64 || null, createdAt: userMessage.createdAt },
    assistantMessage: { id: assistantMessage.id, vaiTro: 'assistant', noiDung: assistantText, provider: aiResult.nha_cung_cap, createdAt: assistantMessage.createdAt },
    trace: aiResult.trace || null
  };
}
