import { prisma } from '../config/prisma.js';
import { runAI } from './ai.service.js';
import { HttpError, logSystem } from './system.service.js';

type UserRef = { id: string; vaiTro?: string; tenHienThi?: string | null };

function normalizeText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function conversationTitle(lessonName: string, firstMessage?: string) {
  const text = normalizeText(firstMessage || '');
  if (!text) return `Chat ve ${lessonName}`;
  return text.length > 48 ? `${text.slice(0, 48).trim()}...` : text;
}

async function getLessonBySlugOrThrow(slug: string) {
  const lesson = await prisma.baiHoc.findUnique({ where: { slug } });
  if (!lesson) throw new HttpError(404, 'Khong tim thay bai hoc.');
  return lesson;
}

async function getConversationOrThrow(userId: string, id: string) {
  const row = await prisma.nhatKyHeThong.findUnique({ where: { id } });
  if (!row || row.nhom !== 'chat' || row.hanhDong !== 'conversation' || row.nguoiDungId !== userId) {
    throw new HttpError(404, 'Khong tim thay cuoc tro chuyen.');
  }
  return row;
}

function buildChatPrompt(input: {
  lessonName: string;
  topic?: string | null;
  history: Array<{ vaiTro: string; noiDung: string }>;
  message: string;
}) {
  const recent = input.history.slice(-6).map((item) => `${item.vaiTro === 'user' ? 'Hoc sinh' : 'Nova'}: ${item.noiDung}`);
  return [
    `Ban dang chat 1-1 ve bai ${input.lessonName}${input.topic ? ` (${input.topic})` : ''}.`,
    'Tra loi nhu mot nguoi that: tu nhien, than thien, ngan gon truoc, ro rang va dung trong tam.',
    'Neu nguoi dung chi chao hoi nhu "hi", "hello", "chao", hay chao lai tu nhien trong 1-2 cau va moi ho hoi tiep, khong bien thanh bai giang.',
    'Neu la cau hoi hoc tap, uu tien tra loi truc tiep, co cong thuc khi that su can, va tranh van phong may moc.',
    recent.length ? `Ngu canh chat gan day:\n${recent.join('\n')}` : '',
    `Tin nhan moi: ${input.message}`
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
      tieuDe: data.tieuDe || 'Cuoc tro chuyen',
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

export async function createChatConversation(user: UserRef, payload: { lessonSlug: string; tieuDe?: string; firstMessage?: string }) {
  const lesson = await getLessonBySlugOrThrow(payload.lessonSlug);
  const tieuDe = normalizeText(payload.tieuDe || '') || conversationTitle(lesson.ten, payload.firstMessage);
  const tomTat = normalizeText(payload.firstMessage || '') || `Chat ve ${lesson.ten}`;

  const row = await prisma.nhatKyHeThong.create({
    data: {
      muc: 'INFO',
      nhom: 'chat',
      hanhDong: 'conversation',
      doiTuong: lesson.id,
      nguoiDungId: user.id,
      duLieuJson: { baiHocId: lesson.id, baiHocSlug: lesson.slug, tieuDe, tomTat } as any
    }
  });

  await logSystem({ nhom: 'chat', hanhDong: 'create_conversation', doiTuong: row.id, nguoiDungId: user.id, duLieuJson: { lessonSlug: payload.lessonSlug } });

  return {
    id: row.id,
    tieuDe,
    tomTat,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    baiHoc: { id: lesson.id, ten: lesson.ten, slug: lesson.slug, moTa: lesson.moTa, chuDeThi: lesson.chuDeThi },
    messages: []
  };
}

export async function getChatConversationDetail(user: UserRef, id: string) {
  const row = await getConversationOrThrow(user.id, id);
  const data = safeObject(row.duLieuJson);
  const lesson = await prisma.baiHoc.findUnique({ where: { id: String(data.baiHocId || '') }, select: { id: true, ten: true, slug: true, moTa: true, chuDeThi: true } });
  if (!lesson) throw new HttpError(404, 'Khong tim thay bai hoc cua cuoc tro chuyen.');

  const messages = await prisma.nhatKyHeThong.findMany({
    where: { nhom: 'chat', hanhDong: 'message', doiTuong: id },
    orderBy: { createdAt: 'asc' }
  });

  return {
    id: row.id,
    tieuDe: data.tieuDe || 'Cuoc tro chuyen',
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
        createdAt: message.createdAt
      };
    })
  };
}

export async function sendChatMessage(user: UserRef, conversationId: string, payload: { noiDung: string; provider?: 'auto' | 'gpt' | 'gemini' }) {
  const conversation = await getConversationOrThrow(user.id, conversationId);
  const conversationData = safeObject(conversation.duLieuJson);
  const lesson = await prisma.baiHoc.findUnique({ where: { id: String(conversationData.baiHocId || '') } });
  if (!lesson) throw new HttpError(404, 'Khong tim thay bai hoc cua cuoc tro chuyen.');

  const noiDung = normalizeText(payload.noiDung);
  if (!noiDung) throw new HttpError(400, 'Tin nhan khong duoc de trong.');

  const userMessage = await prisma.nhatKyHeThong.create({
    data: {
      muc: 'INFO',
      nhom: 'chat',
      hanhDong: 'message',
      doiTuong: conversationId,
      nguoiDungId: user.id,
      duLieuJson: { vaiTro: 'user', noiDung } as any
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

  const aiResult = await runAI({
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
      latestMessage: noiDung
    }
  }, user.id);

  const assistantText = String(
    aiResult?.du_lieu?.giai_thich ||
    (Array.isArray(aiResult?.du_lieu?.noi_dung_chinh) ? aiResult.du_lieu.noi_dung_chinh.join('\n') : '') ||
    aiResult?.du_lieu?.tom_tat ||
    'Minh chua co cau tra loi phu hop, ban hoi lai giup minh nhe.'
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
        tieuDe: conversationData.tieuDe || conversationTitle(lesson.ten, noiDung),
        tomTat: noiDung.length > 140 ? `${noiDung.slice(0, 140).trim()}...` : noiDung
      } as any
    }
  });

  await logSystem({ nhom: 'chat', hanhDong: 'send_message', doiTuong: conversationId, nguoiDungId: user.id, duLieuJson: { provider: aiResult.nha_cung_cap, userMessageId: userMessage.id, assistantMessageId: assistantMessage.id } });

  return {
    conversationId,
    userMessage: { id: userMessage.id, vaiTro: 'user', noiDung, createdAt: userMessage.createdAt },
    assistantMessage: { id: assistantMessage.id, vaiTro: 'assistant', noiDung: assistantText, provider: aiResult.nha_cung_cap, createdAt: assistantMessage.createdAt },
    trace: aiResult.trace || null
  };
}
