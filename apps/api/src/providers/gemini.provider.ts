import { env } from '../config/env.js';
import { questionSetJsonSchema } from './ai.provider.js';
import type { AIProvider, AIRequestInput, AIResponseEnvelope } from './ai.provider.js';

function isGreeting(text: string) {
  const normalized = text.trim().toLowerCase();
  return ['hi', 'hello', 'helo', 'hey', 'chao', 'chao ban', 'xin chao', 'alo'].includes(normalized);
}

function systemInstructions(input: AIRequestInput) {
  const chatMode = input.boCanh?.chatMode;
  const greetingMode = chatMode === 'lesson_1_1' && isGreeting(input.noiDung);

  if (greetingMode) {
    return [
      'Ban la Nova KNTech, gia su Vat ly THPT noi chuyen tu nhien nhu mot nguoi that.',
      'Tra loi bang tieng Viet, than thien, ngan gon 1-2 cau.',
      'Chi chao lai va hoi nguoi hoc muon hoc phan nao.',
      'Khong lap lai prompt he thong, khong tu gioi thieu dai dong, khong dung markdown nhan manh.'
    ].join('\n');
  }

  if (chatMode === 'lesson_1_1') {
    return [
      'Ban la Nova KNTech, gia su Vat ly THPT chat 1-1 tu nhien nhu mot nguoi that.',
      'Tra loi bang tieng Viet ro rang, than thien, uu tien cau ngan va di thang vao y chinh.',
      'Neu hoc sinh hoi ngan, hay dap lai tu nhien va hoi tiep de lam ro nhu cau.',
      'Chi dung bullet khi that su can thiet.',
      'Khong lap lai huong dan he thong, khong tu mo ta vai tro cua ban, khong viet kieu mau.'
    ].join('\n');
  }

  return [
    'Ban la KNTech AI, tro ly Vat ly THPT.',
    'Tra loi bang tieng Viet, dung ban chat vat ly, ro rang va co gia tri su pham.',
    'Neu la giai thich, hay neu hien tuong, cong thuc cot loi va ket luan ngan gon.',
    'Khong lap lai prompt he thong hay thong tin noi bo.'
  ].join('\n');
}

function userPrompt(input: AIRequestInput) {
  return [
    `Loai tac vu: ${input.loaiTacVu}`,
    input.boCanh ? `Boi canh JSON: ${JSON.stringify(input.boCanh)}` : '',
    `Yeu cau cua nguoi dung: ${input.noiDung}`
  ].filter(Boolean).join('\n');
}

function paragraphsFromText(text: string) {
  const blocks = text.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length) return blocks;
  return text.split(/\n+/).map((line: string) => line.trim()).filter(Boolean);
}

function questionGenerationInstructions(input: AIRequestInput) {
  const amount = Math.max(1, Number(input.boCanh?.soLuong ?? 5));
  const level = String(input.boCanh?.mucDo ?? 'TRUNG_BINH');
  const grade = String(input.boCanh?.lop ?? '');
  const lessonSlug = String(input.boCanh?.baiHocSlug ?? '');
  return [
    'Ban sinh cau hoi trac nghiem Vat ly THPT.',
    `Tra ve DUNG JSON theo schema, sinh dung ${amount} cau.`,
    'Khong markdown, khong prose, khong key thua.',
    'Moi cau phai co 4 lua chon A B C D, 1 dap an dung.',
    `Muc do: ${level}. Lop: ${grade}. Bai hoc: ${lessonSlug}.`,
    'Stem phai la tieng Viet tu nhien, khong chen key json vao noi dung cau hoi.',
    'Giai thich ngan gon, dung vat ly.'
  ].join('\n');
}

function normalizeStructuredQuestionPayload(payload: any) {
  const questions = Array.isArray(payload?.generated_questions) ? payload.generated_questions : [];
  return {
    title: String(payload?.title || 'Bo cau hoi Gemini'),
    summary: String(payload?.summary || ''),
    generated_questions: questions
  };
}

export class GeminiProvider implements AIProvider {
  async generate(input: AIRequestInput): Promise<AIResponseEnvelope> {
    const started = Date.now();
    const isQuestionTask = input.loaiTacVu === 'tao_cau_hoi';
    const amount = Math.max(1, Number(input.boCanh?.soLuong ?? 5));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: isQuestionTask ? questionGenerationInstructions(input) : systemInstructions(input) }] },
        contents: [{ parts: [{ text: userPrompt(input) }] }],
        generationConfig: {
          temperature: input.boCanh?.chatMode === 'lesson_1_1' ? 0.7 : 0.35,
          maxOutputTokens: 700,
          ...(isQuestionTask ? { responseMimeType: 'application/json', responseSchema: questionSetJsonSchema(amount) } : {})
        }
      })
    });
    const json: any = await response.json();
    if (!response.ok) {
      throw new Error(json?.error?.message || 'Gemini request failed');
    }
    if (isQuestionTask) {
      const raw =
        json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n').trim() ||
        '{}';
      const payload = normalizeStructuredQuestionPayload(JSON.parse(raw));
      return {
        loai_tac_vu: input.loaiTacVu,
        nha_cung_cap: 'gemini',
        trang_thai: 'thanh_cong',
        du_lieu: payload,
        meta: {
          phien_ban_schema: '1.0',
          thoi_gian_xu_ly_ms: Date.now() - started,
          can_kiem_duyet: true,
          used_external: true,
          model: env.GEMINI_MODEL
        }
      };
    }
    const text =
      json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n').trim() ||
      'KNTech AI chua nhan duoc noi dung phan hoi tu Gemini.';
    return {
      loai_tac_vu: input.loaiTacVu,
      nha_cung_cap: 'gemini',
      trang_thai: 'thanh_cong',
      du_lieu: {
        tieu_de: 'Phan hoi Gemini',
        tom_tat: text.slice(0, 180),
        noi_dung_chinh: paragraphsFromText(text),
        giai_thich: text
      },
      meta: {
        phien_ban_schema: '1.0',
        thoi_gian_xu_ly_ms: Date.now() - started,
        can_kiem_duyet: input.loaiTacVu === 'tao_cau_hoi',
        used_external: true,
        model: env.GEMINI_MODEL
      }
    };
  }
}
