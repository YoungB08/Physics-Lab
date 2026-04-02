import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';
import { ensureSystemSettings, logSystem } from '../src/services/system.service.js';
import { resolveSimulationPreset } from '../src/constants/simulation-presets.js';
import { content10 } from './data/content10.js';
import { content11 } from './data/content11.js';
import { content12 } from './data/content12.js';

const allContents: Record<string, { tongQuan: string; phanTich: string }> = { ...content10, ...content11, ...content12 };

type LessonSeed = {
  lop: number;
  chapterOrder: number;
  chapterName: string;
  chapterSlug: string;
  thuTu: number;
  ten: string;
  slug: string;
  moTa: string;
  loaiBai: 'SIMULATION' | 'THEORY';
  simulationType?: string;
  simulationParams?: Record<string, number>;
  chuDeThi?: string;
  tagsJson?: string[];
  simulationWeight?: number;
};



type TopicInfo = { key: string; label: string; weight: number };

const TOPIC_RULES: Array<{ match: RegExp; topic: TopicInfo }> = [
  { match: /(newton|rơi|chuyển động|ma sát|đàn hồi|công|động năng|thế năng|cơ năng|archimedes|biến dạng)/i, topic: { key: 'co-hoc', label: 'Cơ học', weight: 70 } },
  { match: /(dao động|con lắc|lò xo|sóng|giao thoa|âm)/i, topic: { key: 'dao-dong-song', label: 'Dao động và sóng', weight: 75 } },
  { match: /(điện|coulomb|ohm|mạch|từ|lorentz|cảm ứng|biến áp|truyền tải|lc|điện từ)/i, topic: { key: 'dien-tu', label: 'Điện từ', weight: 72 } },
  { match: /(khúc xạ|phản xạ|thấu kính|mắt|kính|quang|tia x)/i, topic: { key: 'quang-hoc', label: 'Quang học', weight: 62 } },
  { match: /(quang điện|bohr|phóng xạ|hạt nhân|liên kết|phản ứng)/i, topic: { key: 'hat-nhan-luong-tu', label: 'Lượng tử và hạt nhân', weight: 78 } }
];

function resolveTopic(name: string): TopicInfo {
  return TOPIC_RULES.find((item) => item.match.test(name))?.topic ?? { key: 'tong-hop', label: 'Tổng hợp', weight: 55 };
}

const curriculum = {
  10: [
    ['Động học chất điểm', ['Chuyển động thẳng đều', 'Chuyển động thẳng biến đổi đều', 'Sự rơi tự do', 'Chuyển động tròn đều']],
    ['Động lực học', ['Tổng hợp và phân tích lực', 'Ba định luật Newton', 'Lực hấp dẫn', 'Lực ma sát', 'Lực đàn hồi']],
    ['Năng lượng', ['Công và công suất', 'Động năng', 'Thế năng', 'Cơ năng']],
    ['Chất khí và nhiệt', ['Cấu trúc chất', 'Nhiệt độ và nội năng', 'Quá trình đẳng nhiệt', 'Quá trình đẳng áp', 'Phương trình trạng thái']],
    ['Chất rắn và chất lỏng', ['Biến dạng cơ', 'Sức căng bề mặt', 'Lực đẩy Archimedes', 'Sự nổi']]
  ],
  11: [
    ['Điện tích và điện trường', ['Điện tích', 'Định luật Coulomb', 'Điện trường đều', 'Công của lực điện', 'Điện thế']],
    ['Dòng điện không đổi', ['Cường độ dòng điện', 'Nguồn điện', 'Định luật Ohm', 'Công suất điện', 'Mạch điện hỗn hợp']],
    ['Từ trường', ['Cảm ứng từ', 'Lực Lorentz', 'Lực từ tác dụng lên dây dẫn', 'Từ thông', 'Hiện tượng cảm ứng điện từ']],
    ['Quang học', ['Khúc xạ ánh sáng', 'Phản xạ toàn phần', 'Thấu kính mỏng', 'Mắt và các tật của mắt', 'Kính lúp kính hiển vi kính thiên văn']]
  ],
  12: [
    ['Dao động cơ', ['Dao động điều hòa', 'Con lắc lò xo', 'Con lắc đơn', 'Năng lượng dao động', 'Tổng hợp dao động']],
    ['Sóng cơ', ['Đại cương về sóng', 'Giao thoa sóng', 'Sóng dừng', 'Âm học']],
    ['Điện xoay chiều', ['Dòng điện xoay chiều', 'Mạch RLC', 'Công suất điện xoay chiều', 'Máy biến áp', 'Truyền tải điện năng']],
    ['Sóng điện từ và lượng tử', ['Mạch dao động LC', 'Sóng điện từ', 'Hiện tượng quang điện', 'Mẫu nguyên tử Bohr', 'Tia X']],
    ['Hạt nhân nguyên tử', ['Cấu tạo hạt nhân', 'Phóng xạ', 'Phản ứng hạt nhân', 'Năng lượng liên kết']]
  ]
} as const;

const simulationMap: Record<string, { type: string; params: Record<string, number> }> = {

  'chuyển-động-thẳng-đều': { type: 'linear-motion-3d', params: { v: 6, t: 10 } },
  'chuyển-động-thẳng-biến-đổi-đều': { type: 'accelerated-motion-3d', params: { v0: 1, a: 2, t: 5 } },
  'tổng-hợp-và-phân-tích-lực': { type: 'force-decomposition-3d', params: { f1: 6, f2: 8, angle: 60 } },
  'lực-hấp-dẫn': { type: 'gravity-orbit-3d', params: { m1: 8, m2: 3, r: 6 } },
  'nhiệt-độ-và-nội-năng': { type: 'thermal-energy-3d', params: { temp: 320, particles: 24 } },
  'phương-trình-trạng-thái': { type: 'gas-state-3d', params: { pressure: 1.2, volume: 5, temp: 300 } },
  'điện-tích': { type: 'charge-distribution-3d', params: { q1: 1, q2: -1, spacing: 3 } },
  'điện-thế': { type: 'electric-potential-3d', params: { q: 2, r: 4 } },
  'cảm-ứng-từ': { type: 'magnetic-field-lines-3d', params: { B: 1.4, I: 2 } },
  'công-suất-điện': { type: 'electric-power-3d', params: { u: 220, i: 2 } },
  'dòng-điện-không-đổi': { type: 'dc-current-3d', params: { u: 9, r: 3 } },
  'nguồn-điện': { type: 'battery-source-3d', params: { emf: 12, r: 1 } },
  'cường-độ-dòng-điện': { type: 'current-flow-3d', params: { i: 2, n: 10 } },
  'từ-thông': { type: 'magnetic-flux-3d', params: { B: 0.8, area: 0.4, angle: 45 } },
  'mắt-và-các-tật-của-mắt': { type: 'eye-optics-3d', params: { f: 17, doVat: 30 } },
  'mạch-dao-động-lc': { type: 'lc-3d', params: { l: 0.05, c: 0.000002, q0: 3 } },
  'cấu-tạo-hạt-nhân': { type: 'nucleus-3d', params: { protons: 26, neutrons: 30 } },
  'năng-lượng-liên-kết': { type: 'binding-energy-3d', params: { massDefect: 0.12, A: 56 } },
  'sự-rơi-tự-do': { type: 'free-fall-3d', params: { g: 9.81, h0: 45, vx: 1.5 } },
  'chuyển-động-tròn-đều': { type: 'circular-motion-3d', params: { r: 4, omega: 1.6 } },
  'ba-định-luật-newton': { type: 'newton-laws-3d', params: { force: 12, mass: 2, friction: 0.15 } },
  'lực-ma-sát': { type: 'friction-plane-3d', params: { angle: 20, mu: 0.25, mass: 2 } },
  'lực-đàn-hồi': { type: 'spring-3d', params: { k: 25, m: 0.5, A: 6 } },
  'công-và-công-suất': { type: 'work-energy-3d', params: { force: 20, distance: 8, angle: 30 } },
  'động-năng': { type: 'kinetic-energy-3d', params: { mass: 2, velocity: 5 } },
  'thế-năng': { type: 'potential-energy-3d', params: { mass: 2, height: 6 } },
  'cơ-năng': { type: 'energy-conservation-3d', params: { mass: 1, height: 8, velocity: 2 } },
  'quá-trình-đẳng-nhiệt': { type: 'gas-isothermal-3d', params: { pressure: 2, volume: 6 } },
  'quá-trình-đẳng-áp': { type: 'gas-isobaric-3d', params: { pressure: 1, temp: 300 } },
  'lực-đẩy-archimedes': { type: 'buoyancy-3d', params: { density: 1000, volume: 0.003, mass: 2 } },
  'định-luật-coulomb': { type: 'coulomb-3d', params: { q1: 2, q2: -2, r: 4 } },
  'điện-trường-đều': { type: 'electric-field-3d', params: { E: 120, q: 1, m: 1 } },
  'công-của-lực-điện': { type: 'electric-work-3d', params: { q: 1, d: 2, E: 100 } },
  'định-luật-ohm': { type: 'ohm-circuit-3d', params: { u: 12, r: 6 } },
  'mạch-điện-hỗn-hợp': { type: 'circuit-network-3d', params: { u: 12, r1: 4, r2: 8, r3: 6 } },
  'lực-lorentz': { type: 'magnetic-helix-3d', params: { vPerp: 7, vParallel: 3, B: 1.2 } },
  'lực-từ-tác-dụng-lên-dây-dẫn': { type: 'magnetic-force-wire-3d', params: { I: 2, B: 1.5, l: 0.5 } },
  'hiện-tượng-cảm-ứng-điện-từ': { type: 'induction-3d', params: { B: 1.2, area: 0.4, omega: 2 } },
  'khúc-xạ-ánh-sáng': { type: 'refraction-3d', params: { n1: 1, n2: 1.5, angle: 35 } },
  'phản-xạ-toàn-phần': { type: 'total-internal-reflection-3d', params: { n1: 1.5, n2: 1, angle: 50 } },
  'thấu-kính-mỏng': { type: 'lens-3d', params: { f: 12, doVat: 24 } },
  'dao-động-điều-hòa': { type: 'harmonic-oscillation-3d', params: { A: 4, omega: 1.8 } },
  'con-lắc-lò-xo': { type: 'spring-3d', params: { k: 25, m: 0.5, A: 6 } },
  'con-lắc-đơn': { type: 'pendulum-3d', params: { l: 2, angle: 18, g: 9.81 } },
  'năng-lượng-dao-động': { type: 'oscillation-energy-3d', params: { A: 5, k: 20, m: 0.5 } },
  'tổng-hợp-dao-động': { type: 'superposition-3d', params: { A1: 3, A2: 2, w1: 1.4, w2: 1.8 } },
  'đại-cương-về-sóng': { type: 'wave-3d', params: { A: 2, lambda: 4, v: 6 } },
  'giao-thoa-sóng': { type: 'interference-3d', params: { A: 2, lambda: 4, d: 6 } },
  'sóng-dừng': { type: 'standing-wave-3d', params: { A: 3, lambda: 4 } },
  'dòng-điện-xoay-chiều': { type: 'ac-current-3d', params: { u0: 220, omega: 100 } },
  'mạch-rlc': { type: 'rlc-3d', params: { r: 20, l: 0.1, c: 0.0001 } },
  'máy-biến-áp': { type: 'transformer-3d', params: { n1: 500, n2: 1000, u1: 220 } },
  'truyền-tải-điện-năng': { type: 'power-grid-3d', params: { p: 1000, u: 5000, r: 10 } },
  'mạch-dao-động-lc': { type: 'lc-3d', params: { l: 0.05, c: 0.000002, q0: 3 } },
  'sóng-điện-từ': { type: 'electromagnetic-wave-3d', params: { E0: 2, B0: 1 } },
  'hiện-tượng-quang-điện': { type: 'photoelectric-3d', params: { frequency: 8, intensity: 5 } },
  'mẫu-nguyên-tử-bohr': { type: 'bohr-atom-3d', params: { n: 2, z: 1 } },
  'phóng-xạ': { type: 'radioactive-decay-3d', params: { lambda: 0.35, N0: 100 } },
  'phản-ứng-hạt-nhân': { type: 'nuclear-reaction-3d', params: { energy: 200, massDefect: 0.2 } }
};

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateLessons(): LessonSeed[] {
  const items: LessonSeed[] = [];
  for (const [lopText, chapters] of Object.entries(curriculum)) {
    const lop = Number(lopText);
    chapters.forEach(([chapterName, lessonNames], chapterIndex) => {
      const chapterSlug = `lop-${lop}-${slugify(chapterName)}`;
      lessonNames.forEach((ten, lessonIndex) => {
        const lessonSlug = slugify(ten);
        const sim = simulationMap[lessonSlug] ?? (() => { const preset = resolveSimulationPreset({ lessonName: ten, chapterName, topicName: resolveTopic(`${chapterName} ${ten}`).label }); return preset ? { type: preset.type, params: preset.defaultParams, label: preset.label } : undefined; })();
        const topic = resolveTopic(`${chapterName} ${ten}`);
        // 100% coverage: every lesson must have at least one visual simulation/illustration.
        const loaiBai = 'SIMULATION';
        items.push({
          lop,
          chapterOrder: chapterIndex + 1,
          chapterName,
          chapterSlug,
          thuTu: lessonIndex + 1,
          ten,
          slug: `lop-${lop}-${lessonSlug}`,
          moTa: `Bài ${ten} lớp ${lop}. ${sim ? 'Có mô phỏng 3D và phân tích tham số.' : 'Trình bày lý thuyết có cấu trúc và AI minh họa.'}`,
          loaiBai,
          simulationType: sim?.type,
          simulationParams: sim?.params,
          chuDeThi: topic.label,
          tagsJson: [`lop_${lop}`, topic.key],
          simulationWeight: sim ? topic.weight : 0
        });
      });
    });
  }
  return items;
}

const LESSONS = generateLessons();

function theoryMarkdown(lesson: LessonSeed) {
  return [
    `# ${lesson.ten}`,
    '',
    `## Khái niệm trọng tâm`,
    `- Nêu bản chất vật lý của ${lesson.ten.toLowerCase()} trong chương trình lớp ${lesson.lop}.`,
    `- Liên hệ biểu diễn đồ thị, đại lượng đặc trưng và điều kiện áp dụng.`,
    '',
    '## Công thức cốt lõi',
    '- Liệt kê công thức, đại lượng, đơn vị SI và cách suy luận nhanh.',
    '- Nhấn mạnh mối liên hệ giữa mô hình toán học và hiện tượng quan sát.',
    '',
    '## Kỹ năng giải bài',
    '- Tóm tắt dạng bài chuẩn, lỗi thường gặp và mẹo kiểm tra thứ nguyên.',
    '- Kết nối trực tiếp giữa tham số mô phỏng và biến số trong công thức.'
  ].join('\n');
}

async function main() {
  await ensureSystemSettings();

  const rootHash = await bcrypt.hash('123456', 10);
  await prisma.nguoiDung.upsert({
    where: { email: 'root@vatly.vn' },
    update: { tenHienThi: 'CMS Root', hoTen: 'CMS Root', matKhauHash: rootHash, vaiTro: 'CMS_ROOT', trangThai: 'HOAT_DONG' },
    create: { email: 'root@vatly.vn', tenHienThi: 'CMS Root', hoTen: 'CMS Root', matKhauHash: rootHash, vaiTro: 'CMS_ROOT', trangThai: 'HOAT_DONG' }
  });

  const adminHash = await bcrypt.hash('123456', 10);
  await prisma.nguoiDung.upsert({
    where: { email: 'admin@vatly.vn' },
    update: { tenHienThi: 'Admin vận hành', hoTen: 'Admin vận hành', matKhauHash: adminHash, vaiTro: 'QUAN_TRI_VIEN', trangThai: 'HOAT_DONG' },
    create: { email: 'admin@vatly.vn', tenHienThi: 'Admin vận hành', hoTen: 'Admin vận hành', matKhauHash: adminHash, vaiTro: 'QUAN_TRI_VIEN', trangThai: 'HOAT_DONG' }
  });

  for (const lesson of LESSONS) {
    const chapter = await prisma.chuong.upsert({
      where: { slug: lesson.chapterSlug },
      update: { lop: lesson.lop, ten: lesson.chapterName, thuTu: lesson.chapterOrder },
      create: { lop: lesson.lop, ten: lesson.chapterName, slug: lesson.chapterSlug, thuTu: lesson.chapterOrder }
    });

    const bai = await prisma.baiHoc.upsert({
      where: { slug: lesson.slug },
      update: { chuongId: chapter.id, ten: lesson.ten, moTa: lesson.moTa, loaiBai: lesson.loaiBai, chuDeThi: lesson.chuDeThi ?? null, tagsJson: (lesson.tagsJson ?? []) as any, simulationType: lesson.simulationType ?? null, simulationLabel: lesson.simulationType ? (resolveSimulationPreset({ lessonName: lesson.ten, chapterName: lesson.chapterName, topicName: lesson.chuDeThi })?.label ?? lesson.simulationType) : null, coMoPhong: lesson.loaiBai === 'SIMULATION', coAI: true, thuTu: lesson.thuTu },
      create: { chuongId: chapter.id, ten: lesson.ten, slug: lesson.slug, moTa: lesson.moTa, loaiBai: lesson.loaiBai, chuDeThi: lesson.chuDeThi ?? null, tagsJson: (lesson.tagsJson ?? []) as any, simulationType: lesson.simulationType ?? null, simulationLabel: lesson.simulationType ? (resolveSimulationPreset({ lessonName: lesson.ten, chapterName: lesson.chapterName, topicName: lesson.chuDeThi })?.label ?? lesson.simulationType) : null, coMoPhong: lesson.loaiBai === 'SIMULATION', coAI: true, thuTu: lesson.thuTu }
    });

    const content = allContents[lesson.ten];
    const tongQuanMd = content ? `# ${lesson.ten}\n\n${content.tongQuan.trim()}` : theoryMarkdown(lesson);
    const phanTichMd = content ? `# Phân tích chuyên sâu - ${lesson.ten}\n\n${content.phanTich.trim()}` : `${theoryMarkdown(lesson)}\n\n## Phân tích chuyên sâu\n- So sánh giữa mô hình lý tưởng và điều kiện thực nghiệm.\n- Giải thích cách chọn công thức phù hợp cho từng bài toán.`;

    await prisma.phanKienThuc.deleteMany({ where: { baiHocId: bai.id } });
    await prisma.phanKienThuc.createMany({
      data: [
        { baiHocId: bai.id, tieuDe: 'Tổng quan kiến thức', mucDo: 'DE', noiDungMarkdown: tongQuanMd, thuTu: 1 },
        { baiHocId: bai.id, tieuDe: 'Phân tích chuyên sâu', mucDo: 'TRUNG_BINH', noiDungMarkdown: phanTichMd, thuTu: 2 }
      ]
    });

    // 100% coverage: always create/update a MoPhong record.
    // If simulationType is missing, use an overview visual based on topic.
    const derivedPreset = lesson.simulationType
      ? resolveSimulationPreset({ lessonName: lesson.ten, chapterName: lesson.chapterName, topicName: lesson.chuDeThi }) ?? null
      : resolveSimulationPreset({ lessonName: lesson.ten, chapterName: lesson.chapterName, topicName: lesson.chuDeThi }) ?? null;
    const simulationType = lesson.simulationType ?? (derivedPreset?.type ?? 'co-hoc-overview-visual');
    const simulationParams = (lesson.simulationParams ?? derivedPreset?.defaultParams ?? {}) as any;

    if (simulationType) {
      await prisma.moPhong.upsert({
        where: { baiHocId: bai.id },
        update: { loaiMoPhong: simulationType, cauHinhJson: { quality: 'high', camera: 'orbit', renderer: 'canvas-3d' } as any, thamSoJson: simulationParams },
        create: { baiHocId: bai.id, loaiMoPhong: simulationType, cauHinhJson: { quality: 'high', camera: 'orbit', renderer: 'canvas-3d' } as any, thamSoJson: simulationParams }
      });
    }

    const choices = ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
    const existingQuestion = await prisma.cauHoi.findFirst({ where: { baiHocId: bai.id, noiDung: { contains: lesson.ten } } });
    if (!existingQuestion) {
      await prisma.cauHoi.create({
        data: {
          baiHocId: bai.id,
          nguon: 'NGAN_HANG',
          mucDo: 'TRUNG_BINH',
          loai: 'MOT_DAP_AN',
          noiDung: `Khẳng định nào đúng nhất về ${lesson.ten.toLowerCase()}?`,
          luaChonJson: choices as any,
          dapAnDungJson: ['Phương án A'] as any,
          giaiThich: `Câu hỏi gợi ý cho bài ${lesson.ten}. Giáo viên/CMS Root có thể biên tập thêm trong CMS.`,
          trangThaiDuyet: 'DA_DUYET'
        }
      });
    }
  }

  await prisma.trangNoiDung.upsert({
    where: { slug: 'gioi-thieu-he-thong' },
    update: { tieuDe: 'Giới thiệu hệ thống', noiDungMarkdown: '# Vật lý THPT 3D\n\n- CMS Root quản trị toàn hệ thống\n- Admin vận hành học vụ\n- Giáo viên tạo đề, học sinh học và hỏi AI' },
    create: { tieuDe: 'Giới thiệu hệ thống', slug: 'gioi-thieu-he-thong', moTa: 'Trang giới thiệu mặc định', noiDungMarkdown: '# Vật lý THPT 3D\n\nCMS đã sẵn sàng.', trangThai: 'XUAT_BAN' }
  });

  await logSystem({ nhom: 'seed', hanhDong: 'seed_curriculum', doiTuong: 'all', duLieuJson: { lessons: LESSONS.length } });
  console.log({ lessons: LESSONS.length, chapters: Object.values(curriculum).reduce((a, b) => a + b.length, 0) });
}

main().finally(async () => prisma.$disconnect());
