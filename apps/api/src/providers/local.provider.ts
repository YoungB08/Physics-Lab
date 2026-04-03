import type { AIGeneratedQuestion, AIProvider, AIRequestInput, AIResponseEnvelope } from './ai.provider.js';

function isGreeting(text: string) {
  const normalized = text.trim().toLowerCase();
  return ['hi', 'hello', 'helo', 'hey', 'chao', 'xin chao'].includes(normalized);
}

function contextLine(input: AIRequestInput) {
  const lesson = typeof input.boCanh?.lesson === 'string' ? input.boCanh.lesson : undefined;
  const topic = typeof input.boCanh?.topic === 'string' ? input.boCanh.topic : undefined;
  const simType = typeof input.boCanh?.simulationType === 'string' ? input.boCanh.simulationType : undefined;
  const tail = [
    lesson ? `Bài: ${lesson}` : null,
    topic ? `Chủ đề: ${topic}` : null,
    simType ? `Mô phỏng: ${simType}` : null
  ].filter(Boolean).join(' | ');
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
    '- Bản chất: nêu hiện tượng và ý nghĩa vật lý trước khi thay công thức.',
    '- Công thức lõi: chọn 1-2 công thức gốc và điều kiện áp dụng.',
    '- Suy luận: chỉ ra đại lượng nào tăng giảm, dấu và chiều nếu có.',
    '- Kết luận: nêu câu chốt và cách kiểm tra nhanh bằng trực giác vật lý.',
    '',
    '## Sai lầm thường gặp',
    '- Nhầm điều kiện áp dụng công thức hoặc sai đơn vị.',
    '- Nhầm dấu và chiều khi chiếu lên trục hoặc khi quy ước.',
    '',
    '## Gợi ý tự kiểm',
    '- Đổi tất cả về hệ SI.',
    '- Kiểm tra thứ nguyên sau mỗi biến đổi.',
    '- So kết quả với trực giác vật lý.'
  ].filter(Boolean);

  return {
    tieu_de: 'KNTech AI nội bộ (fallback)',
    tom_tat: 'Đang dùng AI nội bộ để trả lời theo khung học tập cơ bản.',
    noi_dung_chinh: lines,
    goi_y: ['Nếu cấu hình API key GPT hoặc Gemini, hệ thống sẽ trả lời chi tiết hơn.'],
    dap_an: 'Phụ thuộc dữ kiện bài toán cụ thể.',
    giai_thich: lines.join('\n')
  };
}

function buildSimulationExplanation(input: AIRequestInput) {
  const ctx = contextLine(input);
  const simType = typeof input.boCanh?.simulationType === 'string' ? input.boCanh.simulationType : 'default';
  const params = input.boCanh?.simulationParams;
  const config = input.boCanh?.simulationConfig;
  const text = input.noiDung.trim();
  const lines = [
    ctx,
    '',
    '## Mục tiêu của mô phỏng',
    '- Nhìn xu hướng khi đổi 1 tham số.',
    '- Liên hệ trực tiếp giữa tham số mô phỏng và biến trong công thức.',
    '',
    '## Cách thao tác đúng',
    '- Chỉ đổi một tham số mỗi lần, giữ các tham số còn lại cố định.',
    '- Dự đoán trước, chạy mô phỏng, so với dự đoán, rồi giải thích.',
    '',
    `## Cấu hình mô phỏng\n- type: \`${simType}\`\n- params: \`${JSON.stringify(params ?? {}, null, 0)}\`\n- config: \`${JSON.stringify(config ?? {}, null, 0)}\``,
    '',
    '## Gợi ý quan sát',
    '- Theo dõi vị trí, độ cao, vận tốc và gia tốc theo thời gian.',
    '- Chú ý hướng của các vector và mối quan hệ giữa lực và gia tốc.',
    '- Quan sát quỹ đạo để rút ra quy luật.',
    '',
    '## Bẫy thường gặp',
    '- Đổi nhiều tham số cùng lúc nên không kết luận được.',
    '- Nhìn hiệu ứng nhưng không gắn vào công thức.',
    '',
    `Ghi chú: ${text || 'Bạn có thể hỏi tiếp cần quan sát gì để làm trắc nghiệm nhanh.'}`
  ].filter(Boolean);

  return {
    tieu_de: 'KNTech AI nội bộ (giải thích mô phỏng)',
    tom_tat: 'Hướng dẫn quan sát mô phỏng theo tham số và công thức.',
    noi_dung_chinh: lines,
    goi_y: ['Nếu cần, hãy hỏi tham số nào ứng với biến nào trong công thức.'],
    dap_an: 'Mục tiêu là rút ra quy luật, không phải một con số cố định.',
    giai_thich: lines.join('\n')
  };
}

function buildQuestions(input: AIRequestInput) {
  const base = String(input.boCanh?.baiHocTen ?? input.boCanh?.baiHocSlug ?? 'chủ đề tổng hợp');
  const amount = Number(input.boCanh?.soLuong ?? 5);
  const level = String(input.boCanh?.mucDo ?? 'TRUNG_BINH') as 'DE' | 'TRUNG_BINH' | 'KHO';
  const focusByIndex = [
    'bản chất hiện tượng',
    'điều kiện áp dụng',
    'mối liên hệ giữa các đại lượng',
    'sai lầm thường gặp',
    'suy luận từ công thức',
    'nhận xét khi đổi tham số'
  ];
  const stemTemplates: Record<typeof level, string[]> = {
    DE: [
      'Phát biểu nào đúng nhất về {topic}?',
      'Nhận định nào phù hợp nhất với {topic}?',
      'Khi học {topic}, kết luận nào sau đây đúng?'
    ],
    TRUNG_BINH: [
      'Với {topic}, kết luận nào đúng nhất khi xét {focus}?',
      'Trong chủ đề {topic}, phát biểu nào đúng khi phân tích {focus}?',
      'Nếu xét {topic} theo {focus}, nhận định nào hợp lý nhất?'
    ],
    KHO: [
      'Trong bài toán tổng quát về {topic}, nhận định nào đúng nhất khi xét {focus}?',
      'Với {topic}, mệnh đề nào vẫn đúng khi đổi điều kiện và dữ liệu?',
      'Khi tổng hợp kiến thức về {topic}, kết luận nào chặt chẽ nhất?'
    ]
  };
  const correctPool = [
    '{topic} chỉ được kết luận đúng khi bám sát bản chất vật lý và điều kiện áp dụng.',
    'Cần đối chiếu dữ kiện, đơn vị và chiều của đại lượng trước khi kết luận về {topic}.',
    'Với {topic}, thay đổi dữ kiện ban đầu có thể làm thay đổi kết quả và cách suy luận.',
    'Muốn xử lý {topic} đúng, phải gắn công thức với ý nghĩa vật lý thay vì học thuộc máy móc.'
  ];
  const distractorPool = [
    '{topic} luôn đúng giống nhau trong mọi tình huống nên không cần xét giả thiết.',
    'Chỉ cần nhớ công thức của {topic}, không cần quan tâm đơn vị hay chiều đại lượng.',
    '{topic} không đổi dù dữ kiện ban đầu thay đổi thế nào.',
    'Chỉ cần nhìn kết quả cuối cùng của {topic}, không cần phân tích quá trình vật lý.',
    'Mọi bài {topic} đều có thể suy ra ngay bằng một mẹo nhỏ cố định.',
    '{topic} không liên quan đến giới hạn áp dụng của mô hình bài toán.'
  ];
  const answerKeys = ['A', 'B', 'C', 'D'] as const;
  const generated_questions: AIGeneratedQuestion[] = Array.from({ length: amount }).map((_, i) => {
    const focus = focusByIndex[i % focusByIndex.length];
    const template = stemTemplates[level][i % stemTemplates[level].length];
    const stem = template.replaceAll('{topic}', base).replaceAll('{focus}', focus);
    const correctText = correctPool[i % correctPool.length]
      .replaceAll('{topic}', base)
      .replaceAll('{focus}', focus);
    const wrongTexts = Array.from({ length: 3 }).map((__, wrongIndex) =>
      distractorPool[(i + wrongIndex) % distractorPool.length]
        .replaceAll('{topic}', base)
        .replaceAll('{focus}', focus)
    );
    const correctIndex = i % 4;
    const optionTexts = [...wrongTexts];
    optionTexts.splice(correctIndex, 0, correctText);
    const correctKey = answerKeys[correctIndex];
    return {
      stem,
      level,
      kind: 'MOT_DAP_AN',
      options: optionTexts.map((text, optionIndex) => ({ key: answerKeys[optionIndex], text })),
      correctAnswers: [correctKey],
      explanation: `Đáp án đúng là ${correctKey} vì câu hỏi này cần xử lý ${base} theo ${focus}, bám sát điều kiện và ý nghĩa vật lý thay vì nhớ máy móc.`
    };
  });

  return {
    title: `Bộ câu hỏi ${base}`,
    summary: `Đã sinh ${amount} câu hỏi theo schema chuẩn.`,
    generated_questions,
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
  const lesson = typeof input.boCanh?.lesson === 'string' ? input.boCanh.lesson : 'bài này';
  const topic = typeof input.boCanh?.topic === 'string' ? input.boCanh.topic : 'Vật lý';

  if (isGreeting(latestMessage)) {
    const greeting = `Chào bạn, mình đang ở đây để học cùng bạn bài ${lesson}. Bạn muốn ôn lý thuyết, hỏi công thức hay làm một bài cụ thể?`;
    return {
      tieu_de: 'Nova KNTech',
      tom_tat: greeting,
      noi_dung_chinh: [greeting],
      goi_y: [`Bạn có thể hỏi như: "giải thích ngắn ${topic}" hoặc "cho mình 1 ví dụ dễ".`],
      dap_an: '',
      giai_thich: greeting
    };
  }

  const lines = [
    `Mình đang bám ngữ cảnh bài ${lesson}.`,
    '',
    `Bạn hỏi: ${latestMessage}`,
    '',
    `Trả lời nhanh: nếu đây là phần thuộc ${topic}, mình sẽ ưu tiên nêu ý chính trước, rồi mới bung công thức hoặc từng bước nếu bạn cần.`,
    '',
    'Bạn cứ nhắn tiếp theo một trong các kiểu này:',
    '- giải ngắn gọn',
    '- giải từng bước',
    '- nhắc công thức',
    '- cho ví dụ tương tự'
  ];

  return {
    tieu_de: 'Nova KNTech',
    tom_tat: 'Trả lời theo kiểu chat 1-1, tự nhiên và ngắn gọn hơn.',
    noi_dung_chinh: lines,
    goi_y: ['Nếu bạn gửi nguyên đề hoặc ảnh đề, mình sẽ xử lý sát hơn.'],
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
