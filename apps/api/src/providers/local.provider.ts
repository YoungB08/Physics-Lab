import type { AIProvider, AIRequestInput, AIResponseEnvelope } from './ai.provider.js';

function isGreeting(text: string) {
  const normalized = text.trim().toLowerCase();
  return ['hi', 'hello', 'helo', 'hey', 'chao', 'chào', 'xin chao', 'xin chào'].includes(normalized);
}

function contextLine(input: AIRequestInput) {
  const lesson = typeof input.boCanh?.lesson === 'string' ? input.boCanh?.lesson : undefined;
  const topic = typeof input.boCanh?.topic === 'string' ? input.boCanh?.topic : undefined;
  const simType = typeof input.boCanh?.simulationType === 'string' ? input.boCanh?.simulationType : undefined;
  const tail = [lesson ? `Bài: ${lesson}` : null, topic ? `Chủ đề: ${topic}` : null, simType ? `Mô phỏng: ${simType}` : null].filter(Boolean).join(' · ');
  return tail ? `Ngữ cảnh: ${tail}` : '';
}

function buildTheoryExplanation(input: AIRequestInput) {
  const text = input.noiDung.trim();
  const ctx = contextLine(input);
  const lines = [
    ctx,
    `Yêu cầu: ${text}`,
    '',
    '## Khung giải thích chuẩn THPT',
    '- **Bản chất**: Nêu hiện tượng/ý nghĩa vật lý trước, tránh nhảy thẳng vào công thức.',
    '- **Công thức lõi**: Chọn 1–2 công thức gốc và điều kiện áp dụng.',
    '- **Suy luận**: Chỉ ra biến nào tăng/giảm, chiều/dấu (nếu là đại lượng véc tơ).',
    '- **Kết luận**: Nêu câu chốt và cách kiểm tra nhanh bằng ước lượng/thứ nguyên.',
    '',
    '## Sai lầm thường gặp',
    '- Nhầm điều kiện áp dụng công thức hoặc sai đơn vị.',
    '- Nhầm dấu/chiều khi chiếu lên trục hoặc khi quy ước quang học.',
    '',
    '## Gợi ý tự kiểm',
    '- Đổi toàn bộ về SI.',
    '- Kiểm tra thứ nguyên sau mỗi biến đổi.',
    '- So kết quả với trực giác vật lý (xu hướng đúng chưa?).'
  ].filter(Boolean);
  return {
    tieu_de: 'KNTech AI nội bộ (fallback)',
    tom_tat: 'Đang dùng AI nội bộ: trả lời theo khung chuẩn để bạn vẫn học được đúng cách.',
    noi_dung_chinh: lines,
    goi_y: ['Nếu bạn cấu hình API key GPT/Gemini, hệ thống sẽ trả lời chi tiết hơn theo từng bài.'],
    dap_an: 'Phụ thuộc dữ kiện bài toán/câu hỏi cụ thể.',
    giai_thich: lines.join('\n')
  };
}

function buildSimulationExplanation(input: AIRequestInput) {
  const ctx = contextLine(input);
  const simType = typeof input.boCanh?.simulationType === 'string' ? input.boCanh?.simulationType : 'default';
  const params = input.boCanh?.simulationParams;
  const config = input.boCanh?.simulationConfig;
  const text = input.noiDung.trim();
  const lines = [
    ctx,
    '',
    '## Mục tiêu của mô phỏng',
    '- Nhìn **xu hướng** khi đổi 1 tham số (tăng/giảm, tuyến tính/phi tuyến).',
    '- Liên hệ trực tiếp giữa “tham số mô phỏng” và “biến trong công thức”.',
    '',
    '## Cách thao tác đúng (để học ra quy luật)',
    '- Đổi **một** tham số mỗi lần, giữ các tham số còn lại cố định.',
    '- Dự đoán trước → chạy mô phỏng → so với dự đoán → giải thích chênh lệch.',
    '',
    `## Cấu hình mô phỏng (đọc nhanh)\n- type: \`${simType}\`\n- params: \`${JSON.stringify(params ?? {}, null, 0)}\`\n- config: \`${JSON.stringify(config ?? {}, null, 0)}\``,
    '',
    '## Gợi ý quan sát theo scene',
    '- **Vị trí/độ cao**: theo dõi theo thời gian để rút ra dạng \(x(t)\), \(h(t)\).',
    '- **Vectơ**: chú ý hướng mũi tên (v, a, F) và mối quan hệ \(\\vec{F}_{net} = m\\vec{a}\).',
    '- **Quỹ đạo**: xem quỹ đạo tròn/helix và đại lượng hướng tâm/hướng trục.',
    '',
    '## Bẫy hay gặp khi học bằng mô phỏng',
    '- Đổi nhiều tham số cùng lúc → không kết luận được quy luật.',
    '- Nhìn “đẹp mắt” nhưng không gắn vào công thức → học không chắc.',
    '',
    `## Câu hỏi dẫn dắt (tự trả lời)\n- Nếu tăng tham số chính lên 2 lần, đại lượng quan sát tăng bao nhiêu lần?\n- Có ngưỡng/điều kiện nào làm hiện tượng “đổi chế độ” không?\n- Mô phỏng đang giả thiết lý tưởng gì (bỏ qua ma sát, cản, …)?`,
    '',
    `Ghi chú: ${text || 'Bạn có thể hỏi: “Mình cần quan sát gì trong mô phỏng này để làm trắc nghiệm nhanh?”'}`
  ].filter(Boolean);
  return {
    tieu_de: 'KNTech AI nội bộ (giải thích mô phỏng)',
    tom_tat: 'Hướng dẫn quan sát mô phỏng theo tham số và bám sát công thức.',
    noi_dung_chinh: lines,
    goi_y: ['Nếu cần, hãy hỏi tiếp: “Tham số nào tương ứng với biến nào trong công thức?”'],
    dap_an: 'Mục tiêu là rút ra quy luật, không phải một con số cố định.',
    giai_thich: lines.join('\n')
  };
}

function buildQuestions(input: AIRequestInput) {
  const base = String(input.boCanh?.baiHocSlug ?? 'chu-de-tong-hop');
  const amount = Number(input.boCanh?.soLuong ?? 5);
  return {
    tieu_de: `Sinh ${amount} câu hỏi cho ${base}`,
    tom_tat: 'Đã tạo bộ câu hỏi gợi ý bằng AI nội bộ.',
    noi_dung_chinh: Array.from({ length: amount }).map((_, i) => `Câu ${i + 1}: Phát biểu nào đúng với nội dung ${base}?`),
    goi_y: ['Có thể lưu vào ngân hàng câu hỏi và chỉnh sửa trong CMS.'],
    dap_an: 'A',
    giai_thich: 'Đây là bộ câu hỏi gợi ý tự động, giáo viên nên rà soát trước khi dùng chính thức.'
  };
}

function buildLessonChat(input: AIRequestInput) {
  const latestMessage = String(input.boCanh?.latestMessage || input.noiDung || '').trim();
  const lesson = typeof input.boCanh?.lesson === 'string' ? input.boCanh.lesson : 'bai nay';
  const topic = typeof input.boCanh?.topic === 'string' ? input.boCanh.topic : 'Vat ly';

  if (isGreeting(latestMessage)) {
    const greeting = `Chao ban, minh dang o day de hoc cung ban bai ${lesson}. Ban muon on ly thuyet, hoi cong thuc hay lam mot bai cu the?`;
    return {
      tieu_de: 'Nova KNTech',
      tom_tat: greeting,
      noi_dung_chinh: [greeting],
      goi_y: [`Ban co the hoi nhu: "giai thich ngan ${topic}" hoac "cho minh 1 vi du de".`],
      dap_an: '',
      giai_thich: greeting
    };
  }

  const lines = [
    `Minh dang bam ngu canh bai ${lesson}.`,
    '',
    `Ban hoi: ${latestMessage}`,
    '',
    `Tra loi nhanh: neu day la phan thuoc ${topic}, minh se uu tien neu y chinh truoc, roi moi bung cong thuc hoac tung buoc neu ban can.`,
    '',
    'Ban cu nhan tiep theo mot trong cac kieu nay:',
    '- giai ngan gon',
    '- giai tung buoc',
    '- nhac cong thuc',
    '- cho vi du tuong tu'
  ];

  return {
    tieu_de: 'Nova KNTech',
    tom_tat: 'Tra loi theo kieu chat 1-1, tu nhien va ngan gon hon.',
    noi_dung_chinh: lines,
    goi_y: ['Neu ban gui nguyen de hoac anh de, minh se xu ly sat hon.'],
    dap_an: '',
    giai_thich: lines.join('\n')
  };
}

export class LocalAIProvider implements AIProvider {
  async generate(input: AIRequestInput): Promise<AIResponseEnvelope> {
    const du_lieu =
      input.loaiTacVu === 'tao_cau_hoi'
        ? buildQuestions(input)
        : input.loaiTacVu === 'giai_bai' && input.boCanh?.chatMode === 'lesson_1_1'
          ? buildLessonChat(input)
        : input.loaiTacVu === 'giai_thich_mo_phong'
          ? buildSimulationExplanation(input)
          : buildTheoryExplanation(input);
    return {
      loai_tac_vu: input.loaiTacVu,
      nha_cung_cap: 'local',
      trang_thai: 'thanh_cong',
      du_lieu,
      meta: {
        phien_ban_schema: '1.0',
        thoi_gian_xu_ly_ms: 10,
        can_kiem_duyet: input.loaiTacVu === 'tao_cau_hoi',
        used_external: false,
        model: 'kntech-local-fallback'
      }
    };
  }
}
