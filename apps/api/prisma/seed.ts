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
    ['\u0110\u1ed9ng h\u1ecdc ch\u1ea5t \u0111i\u1ec3m', ['Chuy\u1ec3n \u0111\u1ed9ng th\u1eb3ng \u0111\u1ec1u', 'Chuy\u1ec3n \u0111\u1ed9ng th\u1eb3ng bi\u1ebfn \u0111\u1ed5i \u0111\u1ec1u', 'S\u1ef1 r\u01a1i t\u1ef1 do', 'Chuy\u1ec3n \u0111\u1ed9ng tr\u00f2n \u0111\u1ec1u']],
    ['\u0110\u1ed9ng l\u1ef1c h\u1ecdc', ['T\u1ed5ng h\u1ee3p v\u00e0 ph\u00e2n t\u00edch l\u1ef1c', 'Ba \u0111\u1ecbnh lu\u1eadt Newton', 'L\u1ef1c h\u1ea5p d\u1eabn', 'L\u1ef1c ma s\u00e1t', 'L\u1ef1c \u0111\u00e0n h\u1ed3i']],
    ['N\u0103ng l\u01b0\u1ee3ng', ['C\u00f4ng v\u00e0 c\u00f4ng su\u1ea5t', '\u0110\u1ed9ng n\u0103ng', 'Th\u1ebf n\u0103ng', 'C\u01a1 n\u0103ng']],
    ['Ch\u1ea5t kh\u00ed v\u00e0 nhi\u1ec7t', ['C\u1ea5u tr\u00fac ch\u1ea5t', 'Nhi\u1ec7t \u0111\u1ed9 v\u00e0 n\u1ed9i n\u0103ng', 'Qu\u00e1 tr\u00ecnh \u0111\u1eb3ng nhi\u1ec7t', 'Qu\u00e1 tr\u00ecnh \u0111\u1eb3ng \u00e1p', 'Ph\u01b0\u01a1ng tr\u00ecnh tr\u1ea1ng th\u00e1i']],
    ['Ch\u1ea5t r\u1eafn v\u00e0 ch\u1ea5t l\u1ecfng', ['Bi\u1ebfn d\u1ea1ng c\u01a1', 'S\u1ee9c c\u0103ng b\u1ec1 m\u1eb7t', 'L\u1ef1c \u0111\u1ea9y Archimedes', 'S\u1ef1 n\u1ed5i']]
  ],
  11: [
    ['\u0110i\u1ec7n t\u00edch v\u00e0 \u0111i\u1ec7n tr\u01b0\u1eddng', ['\u0110i\u1ec7n t\u00edch', '\u0110\u1ecbnh lu\u1eadt Coulomb', '\u0110i\u1ec7n tr\u01b0\u1eddng \u0111\u1ec1u', 'C\u00f4ng c\u1ee7a l\u1ef1c \u0111i\u1ec7n', '\u0110i\u1ec7n th\u1ebf']],
    ['D\u00f2ng \u0111i\u1ec7n kh\u00f4ng \u0111\u1ed5i', ['C\u01b0\u1eddng \u0111\u1ed9 d\u00f2ng \u0111i\u1ec7n', 'Ngu\u1ed3n \u0111i\u1ec7n', '\u0110\u1ecbnh lu\u1eadt Ohm', 'C\u00f4ng su\u1ea5t \u0111i\u1ec7n', 'M\u1ea1ch \u0111i\u1ec7n h\u1ed7n h\u1ee3p']],
    ['T\u1eeb tr\u01b0\u1eddng', ['C\u1ea3m \u1ee9ng t\u1eeb', 'L\u1ef1c Lorentz', 'L\u1ef1c t\u1eeb t\u00e1c d\u1ee5ng l\u00ean d\u00e2y d\u1eabn', 'T\u1eeb th\u00f4ng', 'Hi\u1ec7n t\u01b0\u1ee3ng c\u1ea3m \u1ee9ng \u0111i\u1ec7n t\u1eeb']],
    ['Quang h\u1ecdc', ['Kh\u00fac x\u1ea1 \u00e1nh s\u00e1ng', 'Ph\u1ea3n x\u1ea1 to\u00e0n ph\u1ea7n', 'Th\u1ea5u k\u00ednh m\u1ecfng', 'M\u1eaft v\u00e0 c\u00e1c t\u1eadt c\u1ee7a m\u1eaft', 'K\u00ednh l\u00fap k\u00ednh hi\u1ec3n vi k\u00ednh thi\u00ean v\u0103n']]
  ],
  12: [
    ['Dao \u0111\u1ed9ng c\u01a1', ['Dao \u0111\u1ed9ng \u0111i\u1ec1u h\u00f2a', 'Con l\u1eafc l\u00f2 xo', 'Con l\u1eafc \u0111\u01a1n', 'N\u0103ng l\u01b0\u1ee3ng dao \u0111\u1ed9ng', 'T\u1ed5ng h\u1ee3p dao \u0111\u1ed9ng']],
    ['S\u00f3ng c\u01a1', ['\u0110\u1ea1i c\u01b0\u01a1ng v\u1ec1 s\u00f3ng', 'Giao thoa s\u00f3ng', 'S\u00f3ng d\u1eebng', '\u00c2m h\u1ecdc']],
    ['\u0110i\u1ec7n xoay chi\u1ec1u', ['D\u00f2ng \u0111i\u1ec7n xoay chi\u1ec1u', 'M\u1ea1ch RLC', 'C\u00f4ng su\u1ea5t \u0111i\u1ec7n xoay chi\u1ec1u', 'M\u00e1y bi\u1ebfn \u00e1p', 'Truy\u1ec1n t\u1ea3i \u0111i\u1ec7n n\u0103ng']],
    ['S\u00f3ng \u0111i\u1ec7n t\u1eeb v\u00e0 l\u01b0\u1ee3ng t\u1eed', ['M\u1ea1ch dao \u0111\u1ed9ng LC', 'S\u00f3ng \u0111i\u1ec7n t\u1eeb', 'Hi\u1ec7n t\u01b0\u1ee3ng quang \u0111i\u1ec7n', 'M\u1eabu nguy\u00ean t\u1eed Bohr', 'Tia X']],
    ['H\u1ea1t nh\u00e2n nguy\u00ean t\u1eed', ['C\u1ea5u t\u1ea1o h\u1ea1t nh\u00e2n', 'Ph\u00f3ng x\u1ea1', 'Ph\u1ea3n \u1ee9ng h\u1ea1t nh\u00e2n', 'N\u0103ng l\u01b0\u1ee3ng li\u00ean k\u1ebft']]
  ]
} as const;

const simulationMap: Record<string, { type: string; params: Record<string, number> }> = {
  'chuyen-dong-thang-deu': { type: 'linear-motion-3d', params: { v: 6, t: 10 } },
  'chuyen-dong-thang-bien-doi-deu': { type: 'accelerated-motion-3d', params: { v0: 1, a: 2, t: 5 } },
  'tong-hop-va-phan-tich-luc': { type: 'force-decomposition-3d', params: { f1: 6, f2: 8, angle: 60 } },
  'luc-hap-dan': { type: 'gravity-orbit-3d', params: { m1: 8, m2: 3, r: 6 } },
  'nhiet-do-va-noi-nang': { type: 'thermal-energy-3d', params: { temp: 320, particles: 24 } },
  'phuong-trinh-trang-thai': { type: 'gas-state-3d', params: { pressure: 1.2, volume: 5, temp: 300 } },
  'dien-tich': { type: 'charge-distribution-3d', params: { q1: 1, q2: -1, spacing: 3 } },
  'dien-the': { type: 'electric-potential-3d', params: { q: 2, r: 4 } },
  'cam-ung-tu': { type: 'magnetic-field-lines-3d', params: { B: 1.4, I: 2 } },
  'cong-suat-dien': { type: 'electric-power-3d', params: { u: 220, i: 2 } },
  'dong-dien-khong-doi': { type: 'dc-current-3d', params: { u: 9, r: 3 } },
  'nguon-dien': { type: 'battery-source-3d', params: { emf: 12, r: 1 } },
  'cuong-do-dong-dien': { type: 'current-flow-3d', params: { i: 2, n: 10 } },
  'tu-thong': { type: 'magnetic-flux-3d', params: { B: 0.8, area: 0.4, angle: 45 } },
  'mat-va-cac-tat-cua-mat': { type: 'eye-optics-3d', params: { f: 17, doVat: 30 } },
  'mach-dao-dong-lc': { type: 'lc-3d', params: { l: 0.05, c: 0.000002, q0: 3 } },
  'cau-tao-hat-nhan': { type: 'nucleus-3d', params: { protons: 26, neutrons: 30 } },
  'nang-luong-lien-ket': { type: 'binding-energy-3d', params: { massDefect: 0.12, A: 56 } },
  'su-roi-tu-do': { type: 'free-fall-3d', params: { g: 9.81, h0: 45, vx: 1.5 } },
  'chuyen-dong-tron-deu': { type: 'circular-motion-3d', params: { r: 4, omega: 1.6 } },
  'ba-dinh-luat-newton': { type: 'newton-laws-3d', params: { force: 12, mass: 2, friction: 0.15 } },
  'luc-ma-sat': { type: 'friction-plane-3d', params: { angle: 20, mu: 0.25, mass: 2 } },
  'luc-dan-hoi': { type: 'spring-3d', params: { k: 25, m: 0.5, A: 6 } },
  'cong-va-cong-suat': { type: 'work-energy-3d', params: { force: 20, distance: 8, angle: 30 } },
  'dong-nang': { type: 'kinetic-energy-3d', params: { mass: 2, velocity: 5 } },
  'the-nang': { type: 'potential-energy-3d', params: { mass: 2, height: 6 } },
  'co-nang': { type: 'energy-conservation-3d', params: { mass: 1, height: 8, velocity: 2 } },
  'qua-trinh-dang-nhiet': { type: 'gas-isothermal-3d', params: { pressure: 2, volume: 6 } },
  'qua-trinh-dang-ap': { type: 'gas-isobaric-3d', params: { pressure: 1, temp: 300 } },
  'luc-day-archimedes': { type: 'buoyancy-3d', params: { density: 1000, volume: 0.003, mass: 2 } },
  'dinh-luat-coulomb': { type: 'coulomb-3d', params: { q1: 2, q2: -2, r: 4 } },
  'dien-truong-deu': { type: 'electric-field-3d', params: { E: 120, q: 1, m: 1 } },
  'cong-cua-luc-dien': { type: 'electric-work-3d', params: { q: 1, d: 2, E: 100 } },
  'dinh-luat-ohm': { type: 'ohm-circuit-3d', params: { u: 12, r: 6 } },
  'mach-dien-hon-hop': { type: 'circuit-network-3d', params: { u: 12, r1: 4, r2: 8, r3: 6 } },
  'luc-lorentz': { type: 'magnetic-helix-3d', params: { vPerp: 7, vParallel: 3, B: 1.2 } },
  'luc-tu-tac-dung-len-day-dan': { type: 'magnetic-force-wire-3d', params: { I: 2, B: 1.5, l: 0.5 } },
  'hien-tuong-cam-ung-dien-tu': { type: 'induction-3d', params: { B: 1.2, area: 0.4, omega: 2 } },
  'khuc-xa-anh-sang': { type: 'refraction-3d', params: { n1: 1, n2: 1.5, angle: 35 } },
  'phan-xa-toan-phan': { type: 'total-internal-reflection-3d', params: { n1: 1.5, n2: 1, angle: 50 } },
  'thau-kinh-mong': { type: 'lens-3d', params: { f: 12, doVat: 24 } },
  'dao-dong-dieu-hoa': { type: 'harmonic-oscillation-3d', params: { A: 4, omega: 1.8 } },
  'con-lac-lo-xo': { type: 'spring-3d', params: { k: 25, m: 0.5, A: 6 } },
  'con-lac-don': { type: 'pendulum-3d', params: { l: 2, angle: 18, g: 9.81 } },
  'nang-luong-dao-dong': { type: 'oscillation-energy-3d', params: { A: 5, k: 20, m: 0.5 } },
  'tong-hop-dao-dong': { type: 'superposition-3d', params: { A1: 3, A2: 2, w1: 1.4, w2: 1.8 } },
  'dai-cuong-ve-song': { type: 'wave-3d', params: { A: 2, lambda: 4, v: 6 } },
  'giao-thoa-song': { type: 'interference-3d', params: { A: 2, lambda: 4, d: 6 } },
  'song-dung': { type: 'standing-wave-3d', params: { A: 3, lambda: 4 } },
  'dong-dien-xoay-chieu': { type: 'ac-current-3d', params: { u0: 220, omega: 100 } },
  'mach-rlc': { type: 'rlc-3d', params: { r: 20, l: 0.1, c: 0.0001 } },
  'may-bien-ap': { type: 'transformer-3d', params: { n1: 500, n2: 1000, u1: 220 } },
  'truyen-tai-dien-nang': { type: 'power-grid-3d', params: { p: 1000, u: 5000, r: 10 } },
  'song-dien-tu': { type: 'electromagnetic-wave-3d', params: { E0: 2, B0: 1 } },
  'hien-tuong-quang-dien': { type: 'photoelectric-3d', params: { frequency: 8, intensity: 5 } },
  'mau-nguyen-tu-bohr': { type: 'bohr-atom-3d', params: { n: 2, z: 1 } },
  'phong-xa': { type: 'radioactive-decay-3d', params: { lambda: 0.35, N0: 100 } },
  'phan-ung-hat-nhan': { type: 'nuclear-reaction-3d', params: { energy: 200, massDefect: 0.2 } }
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
    '## Khái niệm trọng tâm',
    `- Nêu bản chất vật lý của ${lesson.ten.toLowerCase()} trong chương trình lớp ${lesson.lop}.`,
    '- Liên hệ biểu diễn đồ thị, đại lượng đặc trưng và điều kiện áp dụng.',
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
    where: { email: 'root@kntech.vn' },
    update: { tenHienThi: 'CMS Root', hoTen: 'CMS Root', matKhauHash: rootHash, vaiTro: 'CMS_ROOT', trangThai: 'HOAT_DONG' },
    create: { email: 'root@kntech.vn', tenHienThi: 'CMS Root', hoTen: 'CMS Root', matKhauHash: rootHash, vaiTro: 'CMS_ROOT', trangThai: 'HOAT_DONG' }
  });

  const suspiciousPattern = /(Ã|Ä|Æ|áº|á»|â€|Ð|�)/;
  const allLessons = await prisma.baiHoc.findMany({
    select: { id: true, chuongId: true, ten: true, slug: true }
  });
  const badLessons = allLessons.filter((item) => suspiciousPattern.test(item.ten) || suspiciousPattern.test(item.slug));
  if (badLessons.length) {
    const badLessonIds = badLessons.map((item) => item.id);
    const badChapterIds = Array.from(new Set(badLessons.map((item) => item.chuongId).filter(Boolean)));
    await prisma.phanKienThuc.deleteMany({ where: { baiHocId: { in: badLessonIds } } });
    await prisma.moPhong.deleteMany({ where: { baiHocId: { in: badLessonIds } } });
    await prisma.cauHoi.deleteMany({ where: { baiHocId: { in: badLessonIds } } });
    await prisma.baiHoc.deleteMany({ where: { id: { in: badLessonIds } } });
    if (badChapterIds.length) {
      await prisma.chuong.deleteMany({
        where: {
          id: { in: badChapterIds },
          baiHoc: { none: {} }
        }
      });
    }
  }

  const adminHash = await bcrypt.hash('123456', 10);
  await prisma.nguoiDung.upsert({
    where: { email: 'admin@kntech.vn' },
    update: { tenHienThi: 'Admin vận hành', hoTen: 'Admin vận hành', matKhauHash: adminHash, vaiTro: 'QUAN_TRI_VIEN', trangThai: 'HOAT_DONG' },
    create: { email: 'admin@kntech.vn', tenHienThi: 'Admin vận hành', hoTen: 'Admin vận hành', matKhauHash: adminHash, vaiTro: 'QUAN_TRI_VIEN', trangThai: 'HOAT_DONG' }
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

