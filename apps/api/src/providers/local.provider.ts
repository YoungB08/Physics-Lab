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
    lesson ? `Bai: ${lesson}` : null,
    topic ? `Chu de: ${topic}` : null,
    simType ? `Mo phong: ${simType}` : null
  ].filter(Boolean).join(' | ');
  return tail ? `Ngu canh: ${tail}` : '';
}

function buildTheoryExplanation(input: AIRequestInput) {
  const text = input.noiDung.trim();
  const ctx = contextLine(input);
  const lines = [
    ctx,
    `Yeu cau: ${text}`,
    '',
    '## Khung giai thich chuan THPT',
    '- Ban chat: neu hien tuong va y nghia vat ly truoc khi thay cong thuc.',
    '- Cong thuc loi: chon 1-2 cong thuc goc va dieu kien ap dung.',
    '- Suy luan: chi ra dai luong nao tang giam, dau va chieu neu co.',
    '- Ket luan: neu cau chot va cach kiem tra nhanh bang truc giac vat ly.',
    '',
    '## Sai lam thuong gap',
    '- Nhap dieu kien ap dung cong thuc hoac sai don vi.',
    '- Nhap dau va chieu khi chieu len truc hoac khi quy uoc.',
    '',
    '## Goi y tu kiem',
    '- Doi tat ca ve he SI.',
    '- Kiem tra thu nguyen sau moi bien doi.',
    '- So ket qua voi truc giac vat ly.'
  ].filter(Boolean);

  return {
    tieu_de: 'KNTech AI noi bo (fallback)',
    tom_tat: 'Dang dung AI noi bo de tra loi theo khung hoc tap co ban.',
    noi_dung_chinh: lines,
    goi_y: ['Neu cau hinh API key GPT hoac Gemini, he thong se tra loi chi tiet hon.'],
    dap_an: 'Phu thuoc du kien bai toan cu the.',
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
    '## Muc tieu cua mo phong',
    '- Nhin xu huong khi doi 1 tham so.',
    '- Lien he truc tiep giua tham so mo phong va bien trong cong thuc.',
    '',
    '## Cach thao tac dung',
    '- Chi doi mot tham so moi lan, giu cac tham so con lai co dinh.',
    '- Du doan truoc, chay mo phong, so voi du doan, roi giai thich.',
    '',
    `## Cau hinh mo phong\n- type: \`${simType}\`\n- params: \`${JSON.stringify(params ?? {}, null, 0)}\`\n- config: \`${JSON.stringify(config ?? {}, null, 0)}\``,
    '',
    '## Goi y quan sat',
    '- Theo doi vi tri, do cao, van toc va gia toc theo thoi gian.',
    '- Chu y huong cua cac vector va moi quan he giua luc va gia toc.',
    '- Quan sat quy dao de rut ra quy luat.',
    '',
    '## Bay thuong gap',
    '- Doi nhieu tham so cung luc nen khong ket luan duoc.',
    '- Nhin hieu ung nhung khong gan vao cong thuc.',
    '',
    `Ghi chu: ${text || 'Ban co the hoi tiep can quan sat gi de lam trac nghiem nhanh.'}`
  ].filter(Boolean);

  return {
    tieu_de: 'KNTech AI noi bo (giai thich mo phong)',
    tom_tat: 'Huong dan quan sat mo phong theo tham so va cong thuc.',
    noi_dung_chinh: lines,
    goi_y: ['Neu can, hay hoi tham so nao ung voi bien nao trong cong thuc.'],
    dap_an: 'Muc tieu la rut ra quy luat, khong phai mot con so co dinh.',
    giai_thich: lines.join('\n')
  };
}

function buildQuestions(input: AIRequestInput) {
  const base = String(input.boCanh?.baiHocTen ?? input.boCanh?.baiHocSlug ?? 'chu de tong hop');
  const amount = Number(input.boCanh?.soLuong ?? 5);
  const level = String(input.boCanh?.mucDo ?? 'TRUNG_BINH') as 'DE' | 'TRUNG_BINH' | 'KHO';
  const generated_questions: AIGeneratedQuestion[] = Array.from({ length: amount }).map((_, i) => ({
    stem: `Phat bieu nao dung nhat ve ${base} o cau ${i + 1}?`,
    level,
    kind: 'MOT_DAP_AN',
    options: [
      { key: 'A', text: `${base} can duoc xet dung theo ban chat vat ly va dieu kien ap dung.` },
      { key: 'B', text: `${base} luon dung trong moi truong hop ma khong can xet du kien.` },
      { key: 'C', text: `${base} chi can nho cong thuc, khong can xet gia thiet bai toan.` },
      { key: 'D', text: `${base} khong phu thuoc mo hinh va gioi han ap dung.` }
    ],
    correctAnswers: ['A'],
    explanation: `Dap an dung la A vi can bam dung ban chat vat ly va dieu kien ap dung cua ${base}.`
  }));

  return {
    title: `Bo cau hoi ${base}`,
    summary: `Da sinh ${amount} cau hoi theo schema chuan.`,
    generated_questions,
    tieu_de: `Sinh ${amount} cau hoi cho ${base}`,
    tom_tat: 'Da tao bo cau hoi goi y bang AI noi bo.',
    noi_dung_chinh: Array.from({ length: amount }).map((_, i) => `Cau ${i + 1}: Phat bieu nao dung voi noi dung ${base}?`),
    goi_y: ['Co the luu vao ngan hang cau hoi va chinh sua trong CMS.'],
    dap_an: 'A',
    giai_thich: 'Day la bo cau hoi goi y tu dong, giao vien nen ra soat truoc khi dung chinh thuc.'
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
