export type LoaiTacVu = 'giai_thich_ly_thuyet' | 'giai_thich_mo_phong' | 'giai_bai' | 'giai_bai_tu_anh' | 'tao_cau_hoi' | 'phan_tich_ket_qua';
export type AIGeneratedQuestion = {
  stem: string;
  level?: 'DE' | 'TRUNG_BINH' | 'KHO';
  kind?: 'MOT_DAP_AN';
  options: Array<{ key?: string; text: string }>;
  correctAnswers: string[];
  explanation: string;
};
export interface AIRequestInput {
  loaiTacVu: LoaiTacVu;
  provider: 'gpt' | 'gemini' | 'auto';
  noiDung: string;
  hinhAnhBase64?: string;
  boCanh?: Record<string, unknown>;
}
export interface AIResponseEnvelope {
  loai_tac_vu: LoaiTacVu;
  nha_cung_cap: 'gpt' | 'gemini' | 'local';
  trang_thai: 'thanh_cong' | 'that_bai' | 'can_xem_xet';
  du_lieu: Record<string, unknown>;
  meta: {
    phien_ban_schema: '1.0';
    thoi_gian_xu_ly_ms: number;
    can_kiem_duyet: boolean;
    requested_provider?: 'gpt' | 'gemini' | 'auto';
    used_external?: boolean;
    model?: string;
  };
}
export interface AIProvider {
  generate(input: AIRequestInput): Promise<AIResponseEnvelope>;
}

export function questionSetJsonSchema(amount = 5) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'summary', 'generated_questions'],
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      generated_questions: {
        type: 'array',
        minItems: 1,
        maxItems: Math.max(1, amount),
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['stem', 'level', 'kind', 'options', 'correctAnswers', 'explanation'],
          properties: {
            stem: { type: 'string' },
            level: { type: 'string', enum: ['DE', 'TRUNG_BINH', 'KHO'] },
            kind: { type: 'string', enum: ['MOT_DAP_AN'] },
            options: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['key', 'text'],
                properties: {
                  key: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
                  text: { type: 'string' }
                }
              }
            },
            correctAnswers: {
              type: 'array',
              minItems: 1,
              maxItems: 1,
              items: { type: 'string', enum: ['A', 'B', 'C', 'D'] }
            },
            explanation: { type: 'string' }
          }
        }
      }
    }
  };
}

export function normalizeAIText(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) return payload.map(normalizeAIText).join('\n');
  if (payload && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>;
    return [rec.tieu_de, rec.tom_tat, rec.giai_thich, rec.dap_an, rec.noi_dung_chinh, rec.goi_y, rec.title, rec.summary, rec.generated_questions]
      .filter(Boolean)
      .map(normalizeAIText)
      .join('\n');
  }
  return String(payload ?? '');
}
