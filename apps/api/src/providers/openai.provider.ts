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

function extractOpenAIText(json: any) {
  if (typeof json?.output_text === 'string' && json.output_text.trim()) return json.output_text.trim();
  const chunks = (json?.output || [])
    .flatMap((item: any) => item?.content || [])
    .map((c: any) => c?.text || c?.output_text || '')
    .filter(Boolean);
  return chunks.join('\n').trim();
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
    'Khong duoc tra ve markdown, prose, hay key ngoai schema.',
    'Moi cau phai co 4 lua chon A B C D, 1 dap an dung.',
    `Muc do yeu cau: ${level}. Lop: ${grade}. Bai hoc: ${lessonSlug}.`,
    'Noi dung phai la tieng Viet tu nhien, khong mo ta ve schema, khong lap key JSON vao stem.',
    'Khong duoc lap lai hoac chi doi vai tu giua cac cau.',
    'Moi cau phai kiem tra mot goc khac nhau: khai niem, dieu kien ap dung, so sanh, nhan biet sai lam, suy luan tu cong thuc, doc do thi neu phu hop.',
    'Khong duoc dung cung mot bo lua chon cho nhieu cau.',
    'Phan bo dap an dung da dang giua A, B, C, D; khong de tat ca cung mot vi tri.',
    'Neu chu de co tinh toan, uu tien it nhat 1-2 cau co du kien cu the; neu chu de thuan ly thuyet, uu tien cau hoi ve ban chat va dieu kien ap dung.',
    'Giai thich ngan gon, dung ban chat vat ly.'
  ].join('\n');
}

function normalizeStructuredQuestionPayload(payload: any) {
  const questions = Array.isArray(payload?.generated_questions) ? payload.generated_questions : [];
  return {
    title: String(payload?.title || 'Bo cau hoi OpenAI'),
    summary: String(payload?.summary || ''),
    generated_questions: questions
  };
}

export class OpenAIProvider implements AIProvider {
  async generate(input: AIRequestInput): Promise<AIResponseEnvelope> {
    const started = Date.now();
    const isQuestionTask = input.loaiTacVu === 'tao_cau_hoi';
    const amount = Math.max(1, Number(input.boCanh?.soLuong ?? 5));
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        instructions: isQuestionTask ? questionGenerationInstructions(input) : systemInstructions(input),
        input: userPrompt(input),
        max_output_tokens: 700,
        temperature: input.boCanh?.chatMode === 'lesson_1_1' ? 0.7 : 0.35,
        text: isQuestionTask
          ? {
              format: {
                type: 'json_schema',
                name: 'generated_question_set',
                schema: questionSetJsonSchema(amount),
                strict: true
              }
            }
          : { format: { type: 'text' } }
      })
    });
    const json: any = await response.json();
    if (!response.ok) {
      throw new Error(json?.error?.message || 'OpenAI request failed');
    }
    if (isQuestionTask) {
      const payload = normalizeStructuredQuestionPayload(JSON.parse(extractOpenAIText(json) || '{}'));
      return {
        loai_tac_vu: input.loaiTacVu,
        nha_cung_cap: 'gpt',
        trang_thai: 'thanh_cong',
        du_lieu: payload,
        meta: {
          phien_ban_schema: '1.0',
          thoi_gian_xu_ly_ms: Date.now() - started,
          can_kiem_duyet: true,
          used_external: true,
          model: env.OPENAI_MODEL
        }
      };
    }
    const text = extractOpenAIText(json) || 'KNTech AI chua nhan duoc noi dung phan hoi tu OpenAI.';
    return {
      loai_tac_vu: input.loaiTacVu,
      nha_cung_cap: 'gpt',
      trang_thai: 'thanh_cong',
      du_lieu: {
        tieu_de: 'Phan hoi OpenAI',
        tom_tat: text.slice(0, 180),
        noi_dung_chinh: paragraphsFromText(text),
        giai_thich: text
      },
      meta: {
        phien_ban_schema: '1.0',
        thoi_gian_xu_ly_ms: Date.now() - started,
        can_kiem_duyet: input.loaiTacVu === 'tao_cau_hoi',
        used_external: true,
        model: env.OPENAI_MODEL
      }
    };
  }
}
