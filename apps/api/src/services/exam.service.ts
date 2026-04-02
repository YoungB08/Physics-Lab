import { prisma } from '../config/prisma.js';
import { runAI } from './ai.service.js';
import { HttpError, logSystem } from './system.service.js';

type ExamStatus = 'DRAFT' | 'CONFIRMED' | 'STARTED' | 'STOPPED' | 'LOCKED';

type ExamConfig = {
  soLuongCauYeuCau?: number;
  soLuongCauThucTe?: number;
  gioiHanHeThong?: number;
  mucDo?: string;
  cheDo?: string;
  baiHoc?: any;
  danhSachCauHoi?: string[];
  status?: ExamStatus;
  confirmedAt?: string | null;
  startedAt?: string | null;
  stoppedAt?: string | null;
  lockedAt?: string | null;
  examAccessUrl?: string | null;
  maxTabSwitch?: number;
  daoCauHoi?: boolean;
  fullScreenRequired?: boolean;
  strictAntiCheat?: boolean;
  hideResultDetails?: boolean;
  stopReason?: string | null;
  questionSnapshots?: ExamQuestionSnapshot[];
};

type ExamOption = {
  key: string;
  text: string;
};

type ExamQuestionSnapshot = {
  id: string;
  sourceQuestionId?: string | null;
  noiDung: string;
  loai: string;
  mucDo: string;
  options: ExamOption[];
  correctAnswers: string[];
  answerContents?: string[];
  explanation?: string;
};

type AttemptSummary = {
  id: string;
  hocSinhId: string;
  hocSinhTen: string | null;
  hocSinhEmail: string | null;
  diem: number;
  createdAt?: string | null;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  tabSwitchCount: number;
  warningCount: number;
  forcedStopReason: string | null;
  integrityEventCount: number;
  integrityEvents: Array<{ type: string; detail?: string | null; at?: string | null }>;
  answersCount: number;
  totalQuestions: number;
};

function examConfig(value: any): ExamConfig {
  return (value && typeof value === 'object' ? value : {}) as ExamConfig;
}

function repairMojibake(value: unknown) {
  let text = String(value ?? '');
  if (!text.trim()) return '';
  const suspicious = /Ã|Â|Ä|Æ|Ð|áº|á»|â|�|Ï|Î/;
  for (let i = 0; i < 3; i += 1) {
    if (!suspicious.test(text)) break;
    try {
      const repaired = Buffer.from(text, 'latin1').toString('utf8');
      if (!repaired || repaired === text) break;
      text = repaired;
    } catch {
      break;
    }
  }
  return text.replace(/\uFFFD/g, '').trim();
}

function normalizeWhitespace(value: string) {
  return repairMojibake(value).replace(/\s+/g, ' ').trim();
}

function normalizeLatexishText(value: string) {
  return normalizeWhitespace(String(value || ''))
    .replace(/\\pi/g, '\u03c0')
    .replace(/\\omega/g, '\u03c9')
    .replace(/\\alpha/g, '\u03b1')
    .replace(/\\beta/g, '\u03b2')
    .replace(/\\theta/g, '\u03b8')
    .replace(/\\Delta/g, '\u0394')
    .replace(/\\text\s*\{([^}]+)\}/g, ' $1 ')
    .replace(/\\mathrm\s*\{([^}]+)\}/g, ' $1 ')
    .replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\frac\s+([^\s()]+)\s+([^\s()]+)/g, '($1)/($2)')
    .replace(/\\left|\\right/g, '')
    .replace(/\\/g, '');
}

function sanitizeExplanation(input: unknown, fallback = 'Chưa có lời giải chi tiết.') {
  const cleaned = normalizeWhitespace(normalizeLatexishText(String(input ?? ''))
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_`>#]/g, ' ')
    .replace(/^\s*["']?(explanation|solution)["']?\s*:\s*/i, '')
    .replace(/^["']+|["']+$/g, ' ')
    .replace(/[{}[\]]/g, ' '));
  return cleaned || fallback;
}
function isJsonMetaLabel(value: string) {
  const normalized = normalizeWhitespace(String(value || ''))
    .toLowerCase()
    .replace(/^["']+|["']+$/g, '')
    .replace(/[{}[\],:]/g, '')
    .trim();
  return [
    'question',
    'questions',
    'option',
    'options',
    'choice',
    'choices',
    'answer',
    'answers',
    'correctanswer',
    'correctanswers',
    'explanation',
    'solution',
    'undefined',
    'null'
  ].includes(normalized);
}

function extractQuestionTextFromJsonish(value: string) {
  const source = String(value || '');
  const patterns = [
    /["'](?:question|noi_dung|content|stem|prompt)["']\s*:\s*"([^"]{8,500})"/gi,
    /["'](?:question|noi_dung|content|stem|prompt)["']\s*:\s*'([^']{8,500})'/gi,
    /(?:question|noi_dung|content|stem|prompt)\s*:\s*"([^"]{8,500})"/gi,
    /(?:question|noi_dung|content|stem|prompt)\s*:\s*'([^']{8,500})'/gi
  ];
  const results: string[] = [];
  for (const pattern of patterns) {
    const matches = Array.from(source.matchAll(pattern));
    for (const match of matches) {
      const candidate = normalizeWhitespace(normalizeLatexishText(match[1] || ''));
      if (candidate && !isJsonMetaLabel(candidate)) results.push(candidate);
    }
  }
  return results;
}

function sanitizeAiStem(input: unknown, fallback: string) {
  const extractedFromJson = extractQuestionTextFromJsonish(String(input ?? ''))[0];
  const raw = normalizeLatexishText(extractedFromJson || String(input ?? ''))
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_`>#]/g, ' ')
    .replace(/^\s*["']?(question|noi_dung|content|stem|prompt)["']?\s*:\s*/i, '')
    .replace(/^\s*["']?(options?|choices?|answers?|correctanswer|correctanswers|explanation|solution)["']?\s*:\s*/i, '')
    .replace(/^[\s\-•\d.)]+/gm, ' ')
    .replace(/^\s*(cau|câu|question)\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/^\s*["']?question["']?\s*$/i, '')
    .replace(/^\s*["']?options?["']?\s*$/i, '')
    .replace(/^[{\[]+|[}\],]+$/g, ' ')
    .replace(/^["']+|["']+$/g, ' ')
    .replace(/[{}[\]]/g, ' ');
  const cleaned = normalizeWhitespace(raw);
  if (!cleaned || cleaned.length < 8 || /^[^\p{L}\p{N}]+$/u.test(cleaned) || isJsonMetaLabel(cleaned)) return fallback;
  return cleaned.endsWith('?') ? cleaned.slice(0, 260) : `${cleaned.slice(0, 255)}?`;
}

function sanitizeAiOption(input: unknown) {
  const raw = normalizeLatexishText(String(input ?? ''))
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_`>#]/g, ' ')
    .replace(/^\s*["']?(options?|choices?|answer|correctanswer|correctanswers|explanation|solution)["']?\s*:\s*/i, '')
    .replace(/^\s*[A-D]\s*[:.)-]\s*/i, '')
    .replace(/^[{\[]+|[}\],]+$/g, ' ')
    .replace(/^["']+|["']+$/g, ' ')
    .replace(/[{}[\]]/g, ' ');
  const cleaned = normalizeWhitespace(raw);
  if (!cleaned || cleaned.length < 2 || isJsonMetaLabel(cleaned)) return '';
  return cleaned.replace(/[,.;:]+$/g, '').trim();
}

function splitAiQuestionCandidates(text: string) {
  const normalized = String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (!normalized) return [];

  const jsonQuestions = extractQuestionTextFromJsonish(normalized);
  if (jsonQuestions.length) return jsonQuestions;

  const numberedMatches = Array.from(
    normalized.matchAll(/(?:^|\n)\s*(?:câu|cau|question)?\s*(\d+)\s*[:.)-]\s*([\s\S]*?)(?=(?:\n\s*(?:câu|cau|question)?\s*\d+\s*[:.)-])|$)/gi)
  );
  if (numberedMatches.length) {
    return numberedMatches.map((match) => normalizeWhitespace(match[2] || '')).filter(Boolean);
  }

  return normalized
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line && !isJsonMetaLabel(line));
}

function extractAiQuestionStems(aiResult: any, amount: number, fallback: string) {
  const primaryContent = Array.isArray(aiResult?.du_lieu?.noi_dung_chinh) ? aiResult.du_lieu.noi_dung_chinh : [];
  const objectQuestionFields = primaryContent.flatMap((item: any) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    return [item.question, item.noi_dung, item.content, item.stem];
  });
  const sources = [
    ...primaryContent,
    ...objectQuestionFields,
    aiResult?.du_lieu?.giai_thich,
    aiResult?.du_lieu?.tom_tat
  ];
  const seen = new Set<string>();
  const rejected = new Set([
    'dưới đây là',
    'đây là',
    'sau đây là',
    'duoi day la',
    'day la',
    'sau day la'
  ]);
  const candidates: string[] = [];

  for (const source of sources) {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      const direct = sanitizeAiStem(source.question ?? source.noi_dung ?? source.content ?? source.stem, '');
      if (direct) {
        const lower = direct.toLowerCase();
        if (![...rejected].some((prefix) => lower.startsWith(prefix)) && !seen.has(lower)) {
          seen.add(lower);
          candidates.push(direct);
          if (candidates.length >= amount) return candidates;
        }
      }
    }

    for (const piece of splitAiQuestionCandidates(String(source || ''))) {
      const normalized = sanitizeAiStem(piece, '');
      if (!normalized) continue;
      const lower = normalized.toLowerCase();
      if ([...rejected].some((prefix) => lower.startsWith(prefix))) continue;
      if (seen.has(lower)) continue;
      seen.add(lower);
      candidates.push(normalized);
      if (candidates.length >= amount) return candidates;
    }
  }

  return candidates.length ? candidates : [fallback];
}

function buildSafeOptions(topic: string) {
  const subject = normalizeWhitespace(topic || 'chủ đề này');
  return [
    `${subject} phải được xét đúng bản chất vật lý và điều kiện áp dụng.`,
    `${subject} luôn cho cùng một kết quả dù thay đổi dữ kiện ban đầu.`,
    `${subject} chỉ cần nhớ công thức mà không cần xét dấu, chiều hay đơn vị.`,
    `${subject} không phụ thuộc mô hình, giả thiết và giới hạn của bài toán.`
  ];
}

function parseSimpleShm(stem: string) {
  const normalized = normalizeLatexishText(stem).replace(/\s+/g, '');
  const match = normalized.match(/x=([0-9]+(?:\.[0-9]+)?)\s*(?:cm|m)?\*?cos\(([^t]+)t([^)]+)?\)/i)
    || normalized.match(/x=([0-9]+(?:\.[0-9]+)?)cos\(([^t]+)t([^)]+)?\)/i);
  if (!match) return null;
  return {
    amplitude: match[1],
    omega: normalizeWhitespace(match[2] || ''),
    phase: normalizeWhitespace((match[3] || '').replace(/^\+/, ''))
  };
}

function buildOptionsForStem(stem: string, topic: string) {
  const plainStem = normalizeLatexishText(stem);
  const shm = parseSimpleShm(plainStem);
  if (shm) {
    const correct = normalizeWhitespace(`Biên độ của dao động là ${shm.amplitude} cm.`);
    return {
      options: [
        correct,
        normalizeWhitespace(`Tần số góc của dao động là ${shm.amplitude} rad/s.`),
        normalizeWhitespace('Pha ban đầu của dao động bằng 0 rad.'),
        normalizeWhitespace(`Chu kì của dao động là ${shm.amplitude} s.`)
      ],
      correct,
      explanation: sanitizeExplanation(`Từ phương trình dao động điều hòa, biên độ là hệ số đứng trước hàm cos nên A = ${shm.amplitude} cm.`)
    };
  }

  const subject = normalizeWhitespace(topic || 'chủ đề này');
  const prefix = plainStem.length > 72 ? `${plainStem.slice(0, 72).trim()}...` : plainStem;
  const correct = normalizeWhitespace(`Kết luận đúng phải bám sát dữ kiện của câu hỏi: ${prefix}`);
  return {
    options: [
      correct,
      normalizeWhitespace(`${subject} luôn cho cùng một kết quả dù thay đổi dữ kiện ban đầu.`),
      normalizeWhitespace(`${subject} chỉ cần nhớ công thức mà không cần xét điều kiện áp dụng.`),
      normalizeWhitespace(`${subject} không phụ thuộc mô hình, giả thiết và giới hạn của bài toán.`)
    ],
    correct,
    explanation: sanitizeExplanation('Đáp án đúng là phương án bám đúng dữ kiện đã nêu trong câu hỏi, thay vì suy luận tuyệt đối hoặc bỏ qua điều kiện áp dụng.')
  };
}

function createFallbackQuestion(index: number, topic: string, level: 'DE' | 'TRUNG_BINH' | 'KHO', stemOverride?: string) {
  const stems: Record<typeof level, string> = {
    DE: 'Hiện tượng nào sau đây mô tả đúng bản chất',
    TRUNG_BINH: 'Khi phân tích định lượng, kết luận đúng nhất về',
    KHO: 'Trong điều kiện tổng quát, mệnh đề nào đúng nhất về'
  };
  const safeTopic = normalizeWhitespace(topic || 'chủ đề này');
  const safeStem = sanitizeAiStem(stemOverride, `Câu ${index + 1}. ${stems[level]} ${safeTopic}?`);
  return {
    noiDung: safeStem,
    luaChonJson: [
      normalizeWhitespace(`${safeTopic}: nhận định mô tả đúng bản chất`),
      normalizeWhitespace(`${safeTopic}: nhận định chỉ đúng trong trường hợp đặc biệt`),
      normalizeWhitespace(`${safeTopic}: nhận định dễ nhầm với hiện tượng khác`),
      normalizeWhitespace(`${safeTopic}: nhận định trái với kết luận vật lý`)
    ],
    dapAnDungJson: [normalizeWhitespace(`${safeTopic}: nhận định mô tả đúng bản chất`)],
    giaiThich: sanitizeExplanation(`Đáp án đúng là phương án diễn đạt đúng bản chất của chủ đề ${safeTopic}; các lựa chọn còn lại là các bẫy nhận thức thường gặp.`)
  };
}

function createStructuredFallbackQuestion(index: number, topic: string, level: 'DE' | 'TRUNG_BINH' | 'KHO', stemOverride?: string) {
  const safeTopic = normalizeWhitespace(topic || 'chủ đề này');
  const stems: Record<typeof level, string> = {
    DE: `Phát biểu nào đúng nhất về ${safeTopic}?`,
    TRUNG_BINH: `Kết luận nào đúng nhất khi phân tích ${safeTopic}?`,
    KHO: `Trong bài toán tổng quát về ${safeTopic}, nhận định nào đúng nhất?`
  };
  const finalStem = sanitizeAiStem(stemOverride, stems[level]);
  const built = buildOptionsForStem(finalStem, safeTopic);
  return {
    noiDung: finalStem,
    luaChonJson: built.options,
    dapAnDungJson: [built.correct],
    giaiThich: sanitizeExplanation(built.explanation)
  };
}

function optionKeys(length: number) {
  return Array.from({ length }, (_, index) => String.fromCharCode(65 + index));
}

function normalizeOptions(raw: unknown): ExamOption[] {
  const source = Array.isArray(raw) ? raw : [];
  return source.map((item: any, index: number) => {
    if (item && typeof item === 'object' && 'text' in item) {
      return {
        key: String(item.key || String.fromCharCode(65 + index)).toUpperCase(),
        text: sanitizeAiOption(item.text)
      };
    }
    return {
      key: String.fromCharCode(65 + index),
      text: sanitizeAiOption(item)
    };
  }).filter((item) => item.text.trim());
}

function resolveCorrectAnswerKeys(answerRaw: unknown, options: ExamOption[]) {
  const source = Array.isArray(answerRaw) ? answerRaw : [];
  const keys = source.map((item: any) => String(item).trim()).map((value) => {
    const upper = value.toUpperCase();
    if (options.some((option) => option.key === upper)) return upper;
    const found = options.find((option) => option.text === value);
    return found?.key || null;
  }).filter(Boolean) as string[];
  return Array.from(new Set(keys)).sort();
}

function buildQuestionSnapshot(question: any, index = 0): ExamQuestionSnapshot {
  const safeStem = sanitizeAiStem(question.noiDung, `Câu ${index + 1}: phát biểu nào đúng nhất?`);
  const options = normalizeOptions(question.luaChonJson);
  let autoOptions = options.length ? options : optionKeys(4).map((key) => ({
    key,
    text: normalizeWhitespace(`Phương án ${key} cho câu ${index + 1}`)
  }));
  if (autoOptions.length < 2) {
    const rebuilt = buildOptionsForStem(safeStem, '');
    autoOptions = rebuilt.options.map((text, optionIndex) => ({
      key: String.fromCharCode(65 + optionIndex),
      text: sanitizeAiOption(text)
    }));
  }
  const correctAnswers = resolveCorrectAnswerKeys(question.dapAnDungJson, autoOptions);
  const finalCorrectAnswers = correctAnswers.length ? correctAnswers : [autoOptions[0]?.key || 'A'];
  const answerContents = finalCorrectAnswers.map((key) => autoOptions.find((option) => option.key === key)?.text || key);
  return {
    id: question.id || `snap-${Date.now()}-${index}`,
    sourceQuestionId: question.id || null,
    noiDung: safeStem,
    loai: String(question.loai || 'MOT_DAP_AN'),
    mucDo: String(question.mucDo || 'TRUNG_BINH'),
    options: autoOptions,
    correctAnswers: finalCorrectAnswers,
    answerContents,
    explanation: sanitizeExplanation(question.giaiThich)
  };
}

function sanitizeQuestionSnapshots(raw: unknown): ExamQuestionSnapshot[] {
  const source = Array.isArray(raw) ? raw : [];
  return source.map((item: any, index: number) => {
    const safeStem = sanitizeAiStem(item?.noiDung, `Câu ${index + 1}: phát biểu nào đúng nhất?`);
    let options = normalizeOptions(item?.options);
    if (options.length < 2) {
      const rebuilt = buildOptionsForStem(safeStem, '');
      options = rebuilt.options.map((text, optionIndex) => ({
        key: String.fromCharCode(65 + optionIndex),
        text: sanitizeAiOption(text)
      }));
    }
    const correctAnswers = resolveCorrectAnswerKeys(item?.correctAnswers, options);
    const finalCorrectAnswers = correctAnswers.length ? correctAnswers : [options[0]?.key || 'A'];
    return {
      id: String(item?.id || `snap-${index}`),
      sourceQuestionId: item?.sourceQuestionId ? String(item.sourceQuestionId) : null,
      noiDung: safeStem,
      loai: String(item?.loai || 'MOT_DAP_AN'),
      mucDo: String(item?.mucDo || 'TRUNG_BINH'),
      options,
      correctAnswers: finalCorrectAnswers,
      answerContents: finalCorrectAnswers.map((key) => options.find((option) => option.key === key)?.text || key),
      explanation: sanitizeExplanation(item?.explanation)
    };
  }).filter((item) => item.noiDung.trim() && item.options.length >= 2);
}
function summarizeAttempt(attempt: any, totalQuestions: number): AttemptSummary {
  const detail = attemptDetail(attempt?.chiTietJson);
  const integrityEvents = Array.isArray(detail.integrityEvents) ? detail.integrityEvents : [];
  const answers = detail.answers && typeof detail.answers === 'object' ? detail.answers : {};

  return {
    id: String(attempt.id),
    hocSinhId: String(attempt.hocSinhId),
    hocSinhTen: attempt.hocSinh?.tenHienThi || attempt.hocSinh?.hoTen || detail.studentName || null,
    hocSinhEmail: attempt.hocSinh?.email || null,
    diem: Number(attempt.diem ?? detail.studentResult?.score ?? 0),
    createdAt: attempt.createdAt?.toISOString?.() ?? null,
    status: String(detail.status || 'UNKNOWN'),
    startedAt: detail.startedAt ?? null,
    submittedAt: detail.submittedAt ?? null,
    tabSwitchCount: Number(detail.tabSwitchCount ?? 0),
    warningCount: Number(detail.warningCount ?? 0),
    forcedStopReason: detail.forcedStopReason ?? null,
    integrityEventCount: integrityEvents.length,
    integrityEvents: integrityEvents.slice(-8),
    answersCount: Object.keys(answers).length,
    totalQuestions
  };
}

function teacherQuestionView(snapshot: ExamQuestionSnapshot) {
  const options = normalizeOptions(snapshot.options);
  const answerContents = Array.isArray(snapshot.answerContents)
    ? snapshot.answerContents.map((item) => sanitizeAiOption(item))
    : snapshot.correctAnswers.map((key) => options.find((option) => option.key === key)?.text || key);
  return {
    id: snapshot.id,
    noiDung: sanitizeAiStem(snapshot.noiDung, 'Câu hỏi chưa hợp lệ?'),
    loai: snapshot.loai,
    mucDo: snapshot.mucDo,
    options,
    luaChonJson: options.map((item) => item.text),
    dapAnDungJson: snapshot.correctAnswers,
    noiDungDapAn: answerContents,
    giaiThich: sanitizeExplanation(snapshot.explanation)
  };
}

async function loadQuestionDetails(questionIds: string[] = []) {
  if (!questionIds.length) return [];
  const rows = await prisma.cauHoi.findMany({ where: { id: { in: questionIds } } });
  const map = new Map(rows.map((q: any) => [q.id, q]));
  return questionIds.map((id) => map.get(id)).filter(Boolean);
}

function shuffled<T>(arr: T[]) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function shuffledQuestionIds(ids: string[] = [], shouldShuffle = false) {
  return shouldShuffle ? shuffled(ids) : ids;
}

function attemptDetail(value: any) {
  return (value && typeof value === 'object' ? value : {}) as any;
}

function sanitizeAttemptForStudent(attempt: any) {
  const detail = attemptDetail(attempt?.chiTietJson);
  const safeStudentResult = detail.studentResult ? {
    score: detail.studentResult.score ?? attempt?.diem ?? 0,
    answered: detail.studentResult.answered ?? Object.keys(detail.answers ?? {}).length,
    total: detail.studentResult.total ?? detail.total ?? 0,
    hideResultDetails: Boolean(detail.studentResult.hideResultDetails ?? false),
    details: Array.isArray(detail.studentResult.details) ? detail.studentResult.details : []
  } : undefined;

  return {
    ...attempt,
    chiTietJson: {
      status: detail.status,
      startedAt: detail.startedAt ?? null,
      submittedAt: detail.submittedAt ?? null,
      forcedStopReason: detail.forcedStopReason ?? null,
      tabSwitchCount: Number(detail.tabSwitchCount ?? 0),
      warningCount: Number(detail.warningCount ?? 0),
      studentResult: safeStudentResult
    }
  };
}

function normalizeAnswer(answer: unknown) {
  if (Array.isArray(answer)) return answer.map((item) => String(item)).slice(0, 6).sort();
  if (answer === null || typeof answer === 'undefined' || answer === '') return [];
  return [String(answer)];
}

function asciiText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ãƒâ€žÃ¢â‚¬Ëœ/g, 'd')
    .replace(/Ãƒâ€žÃ‚Â/g, 'D');
}

function pdfEscape(value: string) {
  return asciiText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createSimplePdfBuffer(lines: string[]) {
  const pageWidth = 595;
  const pageHeight = 842;
  let y = 800;
  const contentLines = ['BT', '/F1 11 Tf', '40 800 Td'];
  let first = true;
  for (const rawLine of lines) {
    const line = pdfEscape(rawLine).slice(0, 150);
    if (!first) {
      y -= 16;
      contentLines.push(`1 0 0 1 40 ${y} Tm`);
    }
    contentLines.push(`(${line}) Tj`);
    first = false;
    if (y < 60) break;
  }
  contentLines.push('ET');
  const stream = contentLines.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function buildQuestionOrder(baseIds: string[], shouldShuffle: boolean) {
  return shouldShuffle ? shuffled(baseIds) : [...baseIds];
}

function buildOptionMap(snapshot: ExamQuestionSnapshot, shouldShuffle: boolean) {
  const source = snapshot.options.map((item) => ({ ...item }));
  const display = shouldShuffle ? shuffled(source) : source;
  return { source, display };
}

function toStudentQuestion(snapshot: ExamQuestionSnapshot, optionMap: { display: ExamOption[] }) {
  return {
    id: snapshot.id,
    noiDung: snapshot.noiDung,
    loai: snapshot.loai,
    luaChonJson: optionMap.display.map((item) => item.text),
    options: optionMap.display,
    mucDo: snapshot.mucDo
  };
}

async function forceStopAttempt(attempt: any, reason: string) {
  const detail = attemptDetail(attempt.chiTietJson);
  const updated = await prisma.baiLam.update({
    where: { id: attempt.id },
    data: {
      chiTietJson: {
        ...detail,
        status: 'FORCE_STOPPED',
        forcedStopReason: reason,
        submittedAt: new Date().toISOString()
      } as any
    }
  });
  return sanitizeAttemptForStudent(updated);
}


async function getExamByIdOrThrow(id: string) {
  const exam = await prisma.deThi.findUnique({
    where: { id },
    include: {
      giaoVien: true,
      baiLam: {
        include: {
          hocSinh: {
            select: { id: true, email: true, tenHienThi: true, hoTen: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!exam) throw new HttpError(404, 'KhÃƒÆ’Ã‚Â´ng tÃƒÆ’Ã‚Â¬m thÃƒÂ¡Ã‚ÂºÃ‚Â¥y Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â thi.');
  return exam;
}

function normalizeExam(exam: any, questions: any[] = []) {
  const cfg = examConfig(exam.cauHinhJson);
  const questionSnapshots = sanitizeQuestionSnapshots(cfg.questionSnapshots);
  const finalQuestions = questions.length ? questions : questionSnapshots.map(teacherQuestionView);
  return {
    ...exam,
    status: cfg.status ?? 'DRAFT',
    cauHinhJson: cfg,
    questions: finalQuestions,
    examAccessUrl: cfg.examAccessUrl ?? `/phong-thi/${exam.qrToken}`,
    canShowQr: (cfg.status ?? 'DRAFT') === 'STARTED',
    attempts: Array.isArray(exam.baiLam) ? exam.baiLam.map((attempt: any) => summarizeAttempt(attempt, finalQuestions.length)) : [],
    antiCheat: {
      maxTabSwitch: cfg.maxTabSwitch ?? 3,
      daoCauHoi: cfg.daoCauHoi ?? true,
      fullScreenRequired: cfg.fullScreenRequired ?? true,
      strictAntiCheat: cfg.strictAntiCheat ?? true,
      hideResultDetails: cfg.hideResultDetails ?? false,
      stopReason: cfg.stopReason ?? null
    }
  };
}

export async function taoDeThi(payload: {
  giaoVienId: string;
  ten: string;
  lop: number;
  thoiGianPhut: number;
  soLuongCau: number;
  mucDo: 'DE' | 'TRUNG_BINH' | 'KHO';
  cheDo: 'NGAN_HANG' | 'AI' | 'KEP';
  baiHocSlug?: string;
  providerAI?: 'gpt' | 'gemini' | 'auto';
  maxTabSwitch?: number;
  daoCauHoi?: boolean;
  fullScreenRequired?: boolean;
  strictAntiCheat?: boolean;
  hideResultDetails?: boolean;
}) {
  const lessonBySlug = payload.baiHocSlug ? await prisma.baiHoc.findUnique({ where: { slug: payload.baiHocSlug } }) : null;
  const baiHoc = lessonBySlug ?? await prisma.baiHoc.findFirst({ where: { chuong: { lop: payload.lop } }, orderBy: [{ chuong: { thuTu: 'asc' } }, { thuTu: 'asc' }] });
  let selectedQuestions: any[] = [];

  const limitSetting = await prisma.cauHinhHeThong.findUnique({ where: { ma: 'limit.exam_questions' } }).catch(() => null);
  const maxQuestions = Number(limitSetting?.giaTri ?? 50);
  const target = Math.min(payload.soLuongCau, maxQuestions);

  if (payload.cheDo !== 'AI') {
    selectedQuestions = await prisma.cauHoi.findMany({
      where: {
        mucDo: payload.mucDo,
        trangThaiDuyet: 'DA_DUYET',
        ...(baiHoc ? { baiHocId: baiHoc.id } : {})
      },
      take: target
    });
  }

  if (selectedQuestions.length < target && payload.cheDo !== 'NGAN_HANG') {
    const remain = target - selectedQuestions.length;
    const topic = normalizeWhitespace(baiHoc?.ten ?? `Vật lý lớp ${payload.lop}`);
    const aiResult = await runAI({
      loaiTacVu: 'tao_cau_hoi',
      provider: payload.providerAI ?? 'auto',
      noiDung: `Tạo ${remain} câu hỏi ${payload.mucDo} cho chủ đề ${topic}`,
      boCanh: { lop: payload.lop, baiHocSlug: baiHoc?.slug, soLuong: remain }
    }, payload.giaoVienId);

    const aiLines = extractAiQuestionStems(aiResult, remain, `Phát biểu nào đúng nhất về ${topic}?`);
    const generated = Array.from({ length: remain }).map((_, index) => ({
      baiHocId: baiHoc?.id,
      nguon: aiResult.nha_cung_cap === 'gemini' ? 'AI_GEMINI' : 'AI_GPT',
      mucDo: payload.mucDo,
      loai: 'MOT_DAP_AN',
      ...createStructuredFallbackQuestion(index, topic, payload.mucDo, aiLines[index]),
      trangThaiDuyet: 'CHO_DUYET'
    }));

    for (const q of generated) {
      if (q.baiHocId) {
        const created = await prisma.cauHoi.create({ data: q as any });
        selectedQuestions.push(created);
      }
    }
  }

  const questionSnapshots = selectedQuestions.map((q: any, index: number) => buildQuestionSnapshot(q, index));

  const qrToken = `DE-${Date.now()}`;
  const cfg: ExamConfig = {
    maxTabSwitch: payload.maxTabSwitch ?? 99,
    daoCauHoi: payload.daoCauHoi ?? true,
    fullScreenRequired: payload.fullScreenRequired ?? false,
    strictAntiCheat: payload.strictAntiCheat ?? false,
    hideResultDetails: payload.hideResultDetails ?? false,
    stopReason: null,
    soLuongCauYeuCau: payload.soLuongCau,
    soLuongCauThucTe: selectedQuestions.length,
    gioiHanHeThong: maxQuestions,
    mucDo: payload.mucDo,
    cheDo: payload.cheDo,
    baiHoc: baiHoc ? { id: baiHoc.id, ten: baiHoc.ten, slug: baiHoc.slug } : null,
    danhSachCauHoi: selectedQuestions.map((q: any) => q.id),
    questionSnapshots,
    status: 'DRAFT',
    examAccessUrl: `/phong-thi/${qrToken}`
  };

  const de = await prisma.deThi.create({
    data: {
      giaoVienId: payload.giaoVienId,
      ten: payload.ten,
      lop: payload.lop,
      thoiGianPhut: payload.thoiGianPhut,
      qrToken,
      cauHinhJson: cfg
    }
  });

  await Promise.all(selectedQuestions.map((q: any) => prisma.cauHoi.update({ where: { id: q.id }, data: { soLanSuDung: { increment: 1 } } })));
  await logSystem({ nhom: 'exam', hanhDong: 'create_exam', doiTuong: de.id, nguoiDungId: payload.giaoVienId, duLieuJson: { ten: payload.ten, lop: payload.lop, cheDo: payload.cheDo, soCau: selectedQuestions.length, providerAI: payload.providerAI ?? 'auto', baiHoc: baiHoc?.slug ?? null } });
  return { de: normalizeExam({ ...de, cauHinhJson: cfg }, questionSnapshots.map(teacherQuestionView)), soCauThucTe: selectedQuestions.length, baiHocSuDung: baiHoc?.ten ?? null, thongBao: selectedQuestions.length ? 'Đã tạo đề thành công.' : 'Chưa có câu hỏi phù hợp, hãy seed dữ liệu hoặc chọn chế độ AI/KEP.' };
}

export async function listExams(user: { id: string; vaiTro: string }) {
  const where = user.vaiTro === 'GIAO_VIEN' ? { giaoVienId: user.id } : {};
  const exams = await prisma.deThi.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      giaoVien: true,
      baiLam: {
        include: {
          hocSinh: {
            select: { id: true, email: true, tenHienThi: true, hoTen: true }
          }
        }
      }
    }
  });
  return exams.map((exam: any) => normalizeExam(exam));
}

export async function getExamDetail(user: { id: string; vaiTro: string }, examId: string) {
  const exam = await getExamByIdOrThrow(examId);
  if (user.vaiTro === 'GIAO_VIEN' && exam.giaoVienId !== user.id) throw new HttpError(403, 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ quyÃƒÂ¡Ã‚Â»Ã‚Ân xem Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â thi nÃƒÆ’Ã‚Â y.');
  const cfg = examConfig(exam.cauHinhJson);
  const snapshots = sanitizeQuestionSnapshots(cfg.questionSnapshots);
  if (snapshots.length) return normalizeExam(exam, snapshots.map(teacherQuestionView));
  const questionIds = cfg.daoCauHoi ? shuffledQuestionIds(cfg.danhSachCauHoi ?? [], false) : (cfg.danhSachCauHoi ?? []);
  const questions = await loadQuestionDetails(questionIds);
  return normalizeExam(exam, questions.map((item: any, index: number) => teacherQuestionView(buildQuestionSnapshot(item, index))));
}

export async function updateExamMeta(user: { id: string; vaiTro: string }, examId: string, payload: { ten?: string; thoiGianPhut?: number; maxTabSwitch?: number; daoCauHoi?: boolean; fullScreenRequired?: boolean; strictAntiCheat?: boolean; hideResultDetails?: boolean; questions?: ExamQuestionSnapshot[] }) {
  const exam = await getExamByIdOrThrow(examId);
  const cfg = examConfig(exam.cauHinhJson);
  if (user.vaiTro === 'GIAO_VIEN' && exam.giaoVienId !== user.id) throw new HttpError(403, 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ quyÃƒÂ¡Ã‚Â»Ã‚Ân chÃƒÂ¡Ã‚Â»Ã¢â‚¬Â°nh Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â nÃƒÆ’Ã‚Â y.');
  if ((cfg.status ?? 'DRAFT') === 'LOCKED') throw new HttpError(400, 'Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã‚Â Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ khÃƒÆ’Ã‚Â³a.');
  const nextCfg: ExamConfig = {
    ...cfg,
    maxTabSwitch: payload.maxTabSwitch ?? cfg.maxTabSwitch ?? 99,
    daoCauHoi: payload.daoCauHoi ?? cfg.daoCauHoi ?? true,
    fullScreenRequired: payload.fullScreenRequired ?? cfg.fullScreenRequired ?? false,
    strictAntiCheat: payload.strictAntiCheat ?? cfg.strictAntiCheat ?? false,
    hideResultDetails: payload.hideResultDetails ?? cfg.hideResultDetails ?? false,
    questionSnapshots: payload.questions?.length ? sanitizeQuestionSnapshots(payload.questions) : sanitizeQuestionSnapshots(cfg.questionSnapshots)
  };
  const updated = await prisma.deThi.update({ where: { id: examId }, data: { ten: payload.ten ?? exam.ten, thoiGianPhut: payload.thoiGianPhut ?? exam.thoiGianPhut, cauHinhJson: nextCfg as any } });
  await logSystem({ nhom: 'exam', hanhDong: 'update_exam', doiTuong: examId, nguoiDungId: user.id, duLieuJson: payload });
  return normalizeExam({ ...updated, cauHinhJson: nextCfg, baiLam: exam.baiLam }, sanitizeQuestionSnapshots(nextCfg.questionSnapshots).map(teacherQuestionView));
}

export async function changeExamStatus(user: { id: string; vaiTro: string }, examId: string, action: 'confirm' | 'start' | 'stop' | 'lock' | 'delete') {
  const exam = await getExamByIdOrThrow(examId);
  if (user.vaiTro === 'GIAO_VIEN' && exam.giaoVienId !== user.id) throw new HttpError(403, 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ quyÃƒÂ¡Ã‚Â»Ã‚Ân thao tÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â nÃƒÆ’Ã‚Â y.');
  const cfg = examConfig(exam.cauHinhJson);
  if (action === 'delete') {
    await prisma.baiLam.deleteMany({ where: { deThiId: examId } });
    await prisma.deThi.delete({ where: { id: examId } });
    await logSystem({ nhom: 'exam', hanhDong: 'delete_exam', doiTuong: examId, nguoiDungId: user.id });
    return { ok: true };
  }
  let next: ExamConfig = { ...cfg };
  const now = new Date().toISOString();
  if (action === 'confirm') next = { ...next, status: 'CONFIRMED', confirmedAt: now };
  if (action === 'start') {
    next = { ...next, status: 'STARTED', startedAt: now, examAccessUrl: `/phong-thi/${exam.qrToken}` };
    const activeAttempts = await prisma.baiLam.findMany({ where: { deThiId: examId } });
    await Promise.all(activeAttempts.map((attempt: any) => {
      const detail = attemptDetail(attempt.chiTietJson);
      if (detail.status === 'FORCE_STOPPED' || detail.status === 'STOPPED') {
        return prisma.baiLam.update({
          where: { id: attempt.id },
          data: { chiTietJson: { ...detail, status: 'STARTED', forcedStopReason: null } as any }
        });
      }
      return Promise.resolve();
    }));
  }
  if (action === 'stop') {
    next = { ...next, status: 'STOPPED', stoppedAt: now };
    const activeAttempts = await prisma.baiLam.findMany({ where: { deThiId: examId } });
    await Promise.all(activeAttempts.map((attempt: any) => prisma.baiLam.update({
      where: { id: attempt.id },
      data: { chiTietJson: { ...(attempt.chiTietJson as any), status: 'STOPPED', stoppedByTeacherAt: now } as any }
    })));
  }
  if (action === 'lock') next = { ...next, status: 'LOCKED', lockedAt: now };
  const updated = await prisma.deThi.update({ where: { id: examId }, data: { cauHinhJson: next as any } });
  await logSystem({ nhom: 'exam', hanhDong: `${action}_exam`, doiTuong: examId, nguoiDungId: user.id, duLieuJson: next });
  return normalizeExam(updated);
}

export async function joinExamRoom(qrToken: string, user: { id: string; vaiTro: string; tenHienThi?: string | null }) {
  const exam = await prisma.deThi.findUnique({ where: { qrToken } });
  if (!exam) throw new HttpError(404, 'KhÃƒÆ’Ã‚Â´ng tÃƒÆ’Ã‚Â¬m thÃƒÂ¡Ã‚ÂºÃ‚Â¥y Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â thi.');
  const cfg = examConfig(exam.cauHinhJson);
  const status = cfg.status ?? 'DRAFT';
  if (status !== 'STARTED') throw new HttpError(400, 'Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã‚Â chÃƒâ€ Ã‚Â°a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c bÃƒÂ¡Ã‚ÂºÃ‚Â¯t Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u hoÃƒÂ¡Ã‚ÂºÃ‚Â·c Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ dÃƒÂ¡Ã‚Â»Ã‚Â«ng.');
  let attempt = await prisma.baiLam.findFirst({ where: { deThiId: exam.id, hocSinhId: user.id } });

  const snapshots = sanitizeQuestionSnapshots(cfg.questionSnapshots);
  const baseSnapshots = snapshots.length ? snapshots : (await loadQuestionDetails(cfg.danhSachCauHoi ?? [])).map((item: any, index: number) => buildQuestionSnapshot(item, index));
  const questionOrder = buildQuestionOrder(baseSnapshots.map((item) => item.id), cfg.daoCauHoi ?? true);
  const baseMap = new Map(baseSnapshots.map((item) => [item.id, item]));

  if (!attempt) {
      const optionOrders = Object.fromEntries(questionOrder.map((id) => {
      const question = baseMap.get(id);
      const optionMap = question ? buildOptionMap(question, true) : { source: [], display: [] };
      return [id, optionMap];
    }));

    attempt = await prisma.baiLam.create({
      data: {
        deThiId: exam.id,
        hocSinhId: user.id,
        diem: 0,
        mucDoHieuBai: 0,
        chiTietJson: {
          status: 'STARTED',
          answers: {},
          questionTimes: {},
          tabSwitchCount: 0,
          warningCount: 0,
          integrityEvents: [],
          startedAt: new Date().toISOString(),
          studentName: user.tenHienThi ?? null,
          questionOrder,
          optionOrders,
          antiCheatSnapshot: {
            fullScreenRequired: cfg.fullScreenRequired ?? true,
            strictAntiCheat: cfg.strictAntiCheat ?? true,
            hideResultDetails: cfg.hideResultDetails ?? false,
            maxTabSwitch: cfg.maxTabSwitch ?? 3
          }
        }
      }
    });
    await logSystem({ nhom: 'exam', hanhDong: 'join_exam_room', doiTuong: exam.id, nguoiDungId: user.id });
  }

  const detail = attemptDetail(attempt.chiTietJson);
  const orderedIds = Array.isArray(detail.questionOrder) && detail.questionOrder.length ? detail.questionOrder : questionOrder;
  const optionOrders = detail.optionOrders || {};
  const studentQuestions = orderedIds.map((id: string) => {
    const q = baseMap.get(id);
    if (!q) return null;
    const optionMap = optionOrders[id] || buildOptionMap(q, true);
    return toStudentQuestion(q, optionMap);
  }).filter(Boolean);

  return {
    exam: normalizeExam(exam, studentQuestions),
    attempt
  };
}

export async function examRoomStatus(qrToken: string) {
  const exam = await prisma.deThi.findUnique({ where: { qrToken } });
  if (!exam) throw new HttpError(404, 'KhÃƒÆ’Ã‚Â´ng tÃƒÆ’Ã‚Â¬m thÃƒÂ¡Ã‚ÂºÃ‚Â¥y Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â thi.');
  const cfg = examConfig(exam.cauHinhJson);
  return {
    examId: exam.id,
    status: cfg.status ?? 'DRAFT',
    stopReason: cfg.stopReason ?? null,
    maxTabSwitch: cfg.maxTabSwitch ?? 3,
    fullScreenRequired: cfg.fullScreenRequired ?? true,
    strictAntiCheat: cfg.strictAntiCheat ?? true,
    hideResultDetails: cfg.hideResultDetails ?? false
  };
}

export async function saveAttemptAnswer(user: { id: string }, attemptId: string, payload: { questionId: string; answer: any; elapsedSec: number }) {
  const attempt = await prisma.baiLam.findUnique({ where: { id: attemptId }, include: { deThi: true } });
  if (!attempt || attempt.hocSinhId !== user.id) throw new HttpError(403, 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ quyÃƒÂ¡Ã‚Â»Ã‚Ân cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t bÃƒÆ’Ã‚Â i lÃƒÆ’Ã‚Â m.');
  const cfg = examConfig(attempt.deThi.cauHinhJson);
  if ((cfg.status ?? 'DRAFT') !== 'STARTED') throw new HttpError(400, 'Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã‚Â Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ dÃƒÂ¡Ã‚Â»Ã‚Â«ng hoÃƒÂ¡Ã‚ÂºÃ‚Â·c chÃƒâ€ Ã‚Â°a bÃƒÂ¡Ã‚ÂºÃ‚Â¯t Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u.');
  const detail = attemptDetail(attempt.chiTietJson);
  if (detail.status === 'SUBMITTED' || detail.status === 'FORCE_STOPPED') throw new HttpError(400, 'BÃƒÆ’Ã‚Â i lÃƒÆ’Ã‚Â m Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ khÃƒÆ’Ã‚Â³a.');
  const questionOrder = Array.isArray(detail.questionOrder) ? detail.questionOrder : (cfg.danhSachCauHoi ?? []);
  if (!questionOrder.includes(payload.questionId)) throw new HttpError(400, 'CÃƒÆ’Ã‚Â¢u hÃƒÂ¡Ã‚Â»Ã‚Âi khÃƒÆ’Ã‚Â´ng thuÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â nÃƒÆ’Ã‚Â y.');
  const normalizedAnswer = normalizeAnswer(payload.answer);
  const answers = { ...(detail.answers ?? {}), [payload.questionId]: normalizedAnswer };
  const questionTimes = { ...(detail.questionTimes ?? {}), [payload.questionId]: Math.max(Number(payload.elapsedSec ?? 0), Number((detail.questionTimes ?? {})[payload.questionId] ?? 0)) };
  const updated = await prisma.baiLam.update({
    where: { id: attemptId },
    data: { chiTietJson: { ...detail, answers, questionTimes, status: 'STARTED', lastSavedAt: new Date().toISOString() } as any }
  });
  return updated;
}

export async function recordTabOut(user: { id: string }, attemptId: string) {
  const attempt = await prisma.baiLam.findUnique({ where: { id: attemptId }, include: { deThi: true } });
  if (!attempt || attempt.hocSinhId !== user.id) throw new HttpError(403, 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ quyÃƒÂ¡Ã‚Â»Ã‚Ân cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t bÃƒÆ’Ã‚Â i lÃƒÆ’Ã‚Â m.');
  const cfg = examConfig(attempt.deThi.cauHinhJson);
  const detail = attemptDetail(attempt.chiTietJson);
  if (detail.status === 'SUBMITTED' || detail.status === 'FORCE_STOPPED') return { tabSwitchCount: Number(detail.tabSwitchCount ?? 0), forced: detail.status === 'FORCE_STOPPED' };
  const count = Number(detail.tabSwitchCount ?? 0) + 1;
  const maxTabSwitch = Number(cfg.maxTabSwitch ?? 3);
  // maxTabSwitch === 0 means "no tab-out allowed".
  // maxTabSwitch < 0 means "unlimited / disabled anti-tab-out".
  if (maxTabSwitch >= 0 && count > maxTabSwitch) {
    const forced = await forceStopAttempt(attempt, `VÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t quÃƒÆ’Ã‚Â¡ giÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi hÃƒÂ¡Ã‚ÂºÃ‚Â¡n rÃƒÂ¡Ã‚Â»Ã‚Âi mÃƒÆ’Ã‚Â n hÃƒÆ’Ã‚Â¬nh (${count}/${maxTabSwitch}).`);
    await logSystem({ nhom: 'exam', hanhDong: 'force_stop_attempt', doiTuong: attempt.deThiId, nguoiDungId: user.id, duLieuJson: { attemptId, count, maxTabSwitch } });
    return { tabSwitchCount: count, forced: true, reason: attemptDetail(forced.chiTietJson).forcedStopReason ?? null, maxTabSwitch };
  }
  await prisma.baiLam.update({ where: { id: attemptId }, data: { chiTietJson: { ...detail, tabSwitchCount: count, warningCount: Number(detail.warningCount ?? 0) + 1, lastTabOutAt: new Date().toISOString() } as any } });
  await logSystem({ nhom: 'exam', hanhDong: 'tab_out', doiTuong: attempt.deThiId, nguoiDungId: user.id, duLieuJson: { attemptId, count, maxTabSwitch } });
  return { tabSwitchCount: count, forced: false, maxTabSwitch };
}

export async function recordIntegrityEvent(user: { id: string }, attemptId: string, payload: { type: string; detail?: string }) {
  const attempt = await prisma.baiLam.findUnique({ where: { id: attemptId }, include: { deThi: true } });
  if (!attempt || attempt.hocSinhId !== user.id) throw new HttpError(403, 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ quyÃƒÂ¡Ã‚Â»Ã‚Ân cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t bÃƒÆ’Ã‚Â i lÃƒÆ’Ã‚Â m.');
  const cfg = examConfig(attempt.deThi.cauHinhJson);
  const detail = attemptDetail(attempt.chiTietJson);
  if (detail.status === 'SUBMITTED' || detail.status === 'FORCE_STOPPED') return { ok: true, forced: detail.status === 'FORCE_STOPPED' };

  const event = { type: String(payload.type || 'unknown'), detail: payload.detail || null, at: new Date().toISOString() };
  const events = [...(Array.isArray(detail.integrityEvents) ? detail.integrityEvents : []), event].slice(-60);
  let nextStatus = detail.status;
  let forced = false;
  let reason: string | null = null;

  if ((cfg.strictAntiCheat ?? true) && ['devtools-open', 'fullscreen-exit', 'copy-blocked', 'printscreen', 'multi-screen-suspect', 'shortcut-blocked', 'blur-window', 'selection-blocked', 'drag-blocked'].includes(event.type)) {
    const severeCount = events.filter((item: any) => ['devtools-open', 'fullscreen-exit', 'printscreen', 'multi-screen-suspect', 'blur-window'].includes(item.type)).length;
    const policyViolations = events.filter((item: any) => ['copy-blocked', 'shortcut-blocked', 'selection-blocked', 'drag-blocked'].includes(item.type)).length;
    if (severeCount >= 2 || policyViolations >= 5 || event.type === 'printscreen') {
      const stopped = await forceStopAttempt(attempt, `PhiÃƒÆ’Ã‚Âªn thi bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ khÃƒÆ’Ã‚Â³a do vi phÃƒÂ¡Ã‚ÂºÃ‚Â¡m chÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœng lÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â¡p ÃƒÆ’Ã‚Â¡n (${event.type}).`);
      forced = true;
      reason = attemptDetail(stopped.chiTietJson).forcedStopReason ?? null;
      nextStatus = 'FORCE_STOPPED';
    }
  }

  if (!forced) {
    await prisma.baiLam.update({ where: { id: attemptId }, data: { chiTietJson: { ...detail, integrityEvents: events, status: nextStatus, lastIntegrityAt: new Date().toISOString() } as any } });
  }
  await logSystem({ nhom: 'exam', hanhDong: 'integrity_event', doiTuong: attempt.deThiId, nguoiDungId: user.id, duLieuJson: { attemptId, type: event.type, detail: event.detail, forced } });
  return { ok: true, forced, reason, eventCount: events.length };
}

export async function submitAttempt(user: { id: string }, attemptId: string) {
  const attempt = await prisma.baiLam.findUnique({ where: { id: attemptId }, include: { deThi: true } });
  if (!attempt || attempt.hocSinhId !== user.id) throw new HttpError(403, 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ quyÃƒÂ¡Ã‚Â»Ã‚Ân nÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢p bÃƒÆ’Ã‚Â i.');
  const cfg = examConfig(attempt.deThi.cauHinhJson);
  const detail = attemptDetail(attempt.chiTietJson);
  const snapshots = sanitizeQuestionSnapshots(cfg.questionSnapshots);
  const questions = snapshots.length ? snapshots : (await loadQuestionDetails(cfg.danhSachCauHoi ?? [])).map((item: any, index: number) => buildQuestionSnapshot(item, index));
  const questionIds = Array.isArray(detail.questionOrder) && detail.questionOrder.length ? detail.questionOrder : questions.map((item) => item.id);
  const questionMap = new Map(questions.map((item) => [item.id, item]));
  if (detail.status === 'SUBMITTED') return sanitizeAttemptForStudent(attempt);
  const answers = detail.answers ?? {};
  let correct = 0;
  const gradedTeacherOnly = questionIds.map((id: string) => questionMap.get(id)).filter(Boolean).map((q: any) => {
    const expected = normalizeAnswer(q.correctAnswers);
    const given = normalizeAnswer(answers[q.id]);
    const right = JSON.stringify(expected) === JSON.stringify(given);
    if (right) correct += 1;
    return { questionId: q.id, answer: given, correct: right, expected, explain: q.explanation ?? null, answerContents: q.answerContents ?? [] };
  });
  const diem = questions.length ? Number(((correct / questions.length) * 10).toFixed(2)) : 0;
  const showDetails = !(cfg.hideResultDetails ?? false);
  const studentResult = {
    score: diem,
    total: questions.length,
    answered: Object.keys(answers).length,
    hideResultDetails: !showDetails,
    details: showDetails ? gradedTeacherOnly : []
  };
  const updated = await prisma.baiLam.update({
    where: { id: attemptId },
    data: {
      diem,
      chiTietJson: {
        ...detail,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        gradedTeacherOnly,
        studentResult,
        scoreRaw: correct,
        total: questions.length
      } as any
    }
  });
  await logSystem({ nhom: 'exam', hanhDong: 'submit_attempt', doiTuong: attempt.deThiId, nguoiDungId: user.id, duLieuJson: { attemptId, diem } });
  return sanitizeAttemptForStudent(updated);
}

export async function thongKeTheoRole(user: { id: string; vaiTro: string }) {
  if (user.vaiTro === 'HOC_SINH') {
    const baiLam = await prisma.baiLam.findMany({ where: { hocSinhId: user.id } });
    const lichSuAI = await prisma.lichSuAI.findMany({ where: { nguoiDungId: user.id } });
    return { role: 'HOC_SINH', soLanThi: baiLam.length, diemTrungBinh: baiLam.length ? baiLam.reduce((a: number, b: any) => a + b.diem, 0) / baiLam.length : 0, soLanHoiAI: lichSuAI.length };
  }
  if (user.vaiTro === 'GIAO_VIEN') {
    const deThi = await prisma.deThi.findMany({ where: { giaoVienId: user.id }, include: { baiLam: true } });
    return { role: 'GIAO_VIEN', soDe: deThi.length, tongBaiLam: deThi.reduce((a: number, d: any) => a + d.baiLam.length, 0) };
  }
  const [users, exams, questions, aiLogs] = await Promise.all([prisma.nguoiDung.count(), prisma.deThi.count(), prisma.cauHoi.count(), prisma.lichSuAI.count()]);
  return { role: 'QUAN_TRI_VIEN', tongNguoiDung: users, tongDeThi: exams, tongCauHoi: questions, tongLuotAI: aiLogs };
}

export async function exportExamPdf(user: { id: string; vaiTro: string }, examId: string) {
  const exam = await getExamDetail(user, examId);
  const lines: string[] = [
    `KNTECH EXAM PDF`,
    `Ten de: ${exam.ten}`,
    `Lop: ${exam.lop} - Thoi gian: ${exam.thoiGianPhut} phut`,
    `So cau: ${exam.questions?.length || 0}`,
    ' '
  ];
  (exam.questions || []).forEach((question: any, index: number) => {
    lines.push(`Cau ${index + 1}: ${question.noiDung}`);
    (question.options || []).forEach((option: any) => {
      lines.push(`  ${option.key}. ${option.text}`);
    });
    lines.push(`  Dap an dung: ${(question.dapAnDungJson || []).join(', ')}`);
    lines.push(`  Noi dung dap an: ${(question.noiDungDapAn || []).join(' | ')}`);
    lines.push(`  Giai thich: ${question.giaiThich || '-'}`);
    lines.push(' ');
  });
  return createSimplePdfBuffer(lines);
}

