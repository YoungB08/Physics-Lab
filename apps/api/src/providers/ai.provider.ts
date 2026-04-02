export type LoaiTacVu = 'giai_thich_ly_thuyet' | 'giai_thich_mo_phong' | 'giai_bai' | 'giai_bai_tu_anh' | 'tao_cau_hoi' | 'phan_tich_ket_qua';
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

export function normalizeAIText(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) return payload.map(normalizeAIText).join('\n');
  if (payload && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>;
    return [rec.tieu_de, rec.tom_tat, rec.giai_thich, rec.dap_an, rec.noi_dung_chinh, rec.goi_y]
      .filter(Boolean)
      .map(normalizeAIText)
      .join('\n');
  }
  return String(payload ?? '');
}
