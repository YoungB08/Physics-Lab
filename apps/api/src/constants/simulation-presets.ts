export type SimulationPreset = {
  type: string;
  label: string;
  group: string;
  summary: string;
  defaultParams: Record<string, number>;
  match: RegExp[];
};

export const SIMULATION_PRESETS: SimulationPreset[] = [
  { type: 'linear-motion-3d', label: 'Chuyen dong thang deu', group: 'Co hoc', summary: 'Vat chuyen dong deu tren truc voi vector van toc.', defaultParams: { v: 6, t: 10 }, match: [/chuyen dong thang deu/i] },
  { type: 'accelerated-motion-3d', label: 'Chuyen dong thang bien doi deu', group: 'Co hoc', summary: 'Theo doi quang duong va gia toc tuyen tinh.', defaultParams: { v0: 1, a: 2, t: 5 }, match: [/bien doi deu/i] },
  { type: 'free-fall-3d', label: 'Roi tu do', group: 'Co hoc', summary: 'Roi duoi tac dung trong truong.', defaultParams: { g: 9.81, h0: 30, vx: 1 }, match: [/roi tu do/i] },
  { type: 'circular-motion-3d', label: 'Chuyen dong tron deu', group: 'Co hoc', summary: 'Quy dao tron voi gia toc huong tam.', defaultParams: { r: 4, omega: 1.6 }, match: [/tron deu/i] },
  { type: 'newton-laws-3d', label: 'Ba dinh luat Newton', group: 'Co hoc', summary: 'Tuong tac giua luc, khoi luong va gia toc.', defaultParams: { force: 12, mass: 2, friction: 0.15 }, match: [/newton/i] },
  { type: 'friction-plane-3d', label: 'Luc ma sat', group: 'Co hoc', summary: 'Mo hinh truot tren mat phang nghieng.', defaultParams: { angle: 20, mu: 0.25, mass: 2 }, match: [/ma sat/i] },
  { type: 'spring-3d', label: 'Con lac lo xo', group: 'Dao dong', summary: 'Dao dong dieu hoa theo dinh luat Hooke.', defaultParams: { k: 25, m: 0.5, A: 6 }, match: [/lo xo/i] },
  { type: 'pendulum-3d', label: 'Con lac don', group: 'Dao dong', summary: 'Dao dong goc nho voi luc keo ve.', defaultParams: { l: 2, angle: 18, g: 9.81 }, match: [/con lac don/i] },
  { type: 'wave-3d', label: 'Song co', group: 'Dao dong', summary: 'Lan truyen song tren day hoac be mat.', defaultParams: { A: 2, lambda: 4, v: 6 }, match: [/dai cuong ve song/i] },
  { type: 'interference-3d', label: 'Giao thoa song', group: 'Dao dong', summary: 'Hai nguon giao thoa tao cuc dai cuc tieu.', defaultParams: { A: 2, lambda: 4, d: 6 }, match: [/giao thoa/i] },
  { type: 'standing-wave-3d', label: 'Song dung', group: 'Dao dong', summary: 'Nut va bung tren day co dinh.', defaultParams: { A: 3, lambda: 4 }, match: [/song dung/i] },
  { type: 'electric-field-3d', label: 'Dien truong deu', group: 'Dien tu', summary: 'Hat tich dien trong dien truong deu.', defaultParams: { E: 120, q: 1, m: 1 }, match: [/dien truong deu/i] },
  { type: 'coulomb-3d', label: 'Dinh luat Coulomb', group: 'Dien tu', summary: 'Luc hut day giua hai dien tich diem.', defaultParams: { q1: 2, q2: -2, r: 4 }, match: [/coulomb/i] },
  { type: 'ohm-circuit-3d', label: 'Dinh luat Ohm', group: 'Dien tu', summary: 'Quan he giua U, I va R trong mach dien.', defaultParams: { u: 12, r: 6 }, match: [/ohm/i] },
  { type: 'magnetic-field-lines-3d', label: 'Cam ung tu', group: 'Dien tu', summary: 'Duong suc tu quanh day dan hoac nam cham.', defaultParams: { B: 1.4, I: 2 }, match: [/cam ung tu/i] },
  { type: 'magnetic-helix-3d', label: 'Luc Lorentz', group: 'Dien tu', summary: 'Hat tich dien chuyen dong trong tu truong.', defaultParams: { vPerp: 7, vParallel: 3, B: 1.2 }, match: [/lorentz/i] },
  { type: 'induction-3d', label: 'Cam ung dien tu', group: 'Dien tu', summary: 'Bien thien tu thong sinh suat dien dong.', defaultParams: { B: 1.2, area: 0.4, omega: 2 }, match: [/cam ung dien tu/i] },
  { type: 'rlc-3d', label: 'Mach RLC', group: 'Dien tu', summary: 'Pha va cong huong trong mach xoay chieu.', defaultParams: { r: 20, l: 0.1, c: 0.0001 }, match: [/mach rlc/i] },
  { type: 'transformer-3d', label: 'May bien ap', group: 'Dien tu', summary: 'Ti so vong day va dien ap.', defaultParams: { n1: 500, n2: 1000, u1: 220 }, match: [/may bien ap/i] },
  { type: 'refraction-3d', label: 'Khuc xa anh sang', group: 'Quang hoc', summary: 'Duong truyen tia khi doi moi truong.', defaultParams: { n1: 1, n2: 1.5, angle: 35 }, match: [/khuc xa/i] },
  { type: 'lens-3d', label: 'Thau kinh mong', group: 'Quang hoc', summary: 'Vi tri anh va tia dac biet.', defaultParams: { f: 12, doVat: 24 }, match: [/thau kinh/i] },
  { type: 'eye-optics-3d', label: 'Mat va tat khuc xa', group: 'Quang hoc', summary: 'Mo hinh mat va diem cuc can cuc vien.', defaultParams: { f: 17, doVat: 30 }, match: [/mat va cac tat cua mat|kinh lup|kinh hien vi|kinh thien van/i] },
  { type: 'photoelectric-3d', label: 'Hien tuong quang dien', group: 'Hien dai', summary: 'Electron bat ra duoi anh sang kich thich.', defaultParams: { frequency: 8, intensity: 5 }, match: [/quang dien/i] },
  { type: 'bohr-atom-3d', label: 'Mau nguyen tu Bohr', group: 'Hien dai', summary: 'Muc nang luong va quy dao dinh luong.', defaultParams: { n: 2, z: 1 }, match: [/bohr/i] },
  { type: 'radioactive-decay-3d', label: 'Phong xa', group: 'Hien dai', summary: 'Phan ra alpha beta gamma va detector.', defaultParams: { lambda: 0.35, N0: 100, emission: 6 }, match: [/phong xa|phan ra hat nhan/i] },
  { type: 'nuclear-structure-3d', label: 'Cau tao hat nhan', group: 'Hien dai', summary: 'Cum proton neutron va su on dinh hat nhan.', defaultParams: { proton: 6, neutron: 8 }, match: [/cau tao hat nhan|hat nhan|dong vi/i] },
  { type: 'binding-energy-3d', label: 'Nang luong lien ket', group: 'Hien dai', summary: 'Minh hoa gieng the nang va do hut khoi.', defaultParams: { massDefect: 0.2, binding: 8 }, match: [/nang luong lien ket|do hut khoi/i] },
  { type: 'nuclear-reaction-3d', label: 'Phan ung hat nhan', group: 'Hien dai', summary: 'Bieu dien nang luong va cac hat san pham.', defaultParams: { energy: 200, massDefect: 0.2 }, match: [/phan ung hat nhan|phan hach|nhiet hach/i] }
];

function normalize(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function resolveSimulationPreset(input: { lessonName?: string; chapterName?: string; topicName?: string }) {
  const haystack = normalize(`${input.lessonName ?? ''} ${input.chapterName ?? ''} ${input.topicName ?? ''}`);
  const direct = SIMULATION_PRESETS.find((preset) => preset.match.some((re) => re.test(haystack)));
  if (direct) return direct;

  // 100% coverage: ensure every lesson has at least one stable visual type
  // even when no dedicated 3D scene is available yet.
  if (/(chat khi|nhiet do|noi nang|dang nhiet|dang ap|phuong trinh trang thai|nhiet)/i.test(haystack)) {
    return { type: 'nhiet-hoc-overview-visual', label: 'Nhiet hoc overview', group: 'Nhiet hoc', summary: 'So do/anh minh hoa theo loai qua trinh (P–V, T–V) va PV=nRT.', defaultParams: {}, match: [] };
  }
  if (/(quang|khuc xa|phan xa|thau kinh|mat|kinh lup|kinh hien vi|kinh thien van)/i.test(haystack)) {
    return { type: 'quang-hoc-overview-visual', label: 'Quang hoc overview', group: 'Quang hoc', summary: 'So do tia dac biet, quy uoc dau va ket luan anh that/ao.', defaultParams: {}, match: [] };
  }
  if (/(dien|tu truong|cam ung|mach|rlc|bien ap|coulomb|lorentz|dong dien)/i.test(haystack)) {
    return { type: 'dien-tu-overview-visual', label: 'Dien tu overview', group: 'Dien tu', summary: 'Anh minh hoa vector E/B/F, duong suc va thu tu suy luan.', defaultParams: {}, match: [] };
  }
  if (/(quang dien|bohr|phong xa|hat nhan|lien ket|phan ung|luong tu|tia x)/i.test(haystack)) {
    return { type: 'hien-dai-overview-visual', label: 'Vat ly hien dai overview', group: 'Hien dai', summary: 'Anh minh hoa don vi, suy giam mu, bao toan A-Z va lien ket.', defaultParams: {}, match: [] };
  }
  return { type: 'co-hoc-overview-visual', label: 'Co hoc overview', group: 'Co hoc', summary: 'So do luc/chuyen dong va checklist chon cong thuc.', defaultParams: {}, match: [] };
}
