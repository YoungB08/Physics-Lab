export type SimulationPreset = {
  type: string;
  label: string;
  group: string;
  summary: string;
  defaultParams: Record<string, number>;
};

export const SIMULATION_LIBRARY: SimulationPreset[] = [
  { type: 'linear-motion-3d', label: 'Chuyen dong thang deu', group: 'Co hoc', summary: 'Theo doi vi tri, quang duong va van toc theo thoi gian.', defaultParams: { v: 6, t: 10 } },
  { type: 'accelerated-motion-3d', label: 'Chuyen dong thang bien doi deu', group: 'Co hoc', summary: 'So sanh van toc, gia toc va quang duong khi vat chuyen dong co gia toc khong doi.', defaultParams: { v0: 1, a: 2, t: 5 } },
  { type: 'free-fall-3d', label: 'Su roi tu do', group: 'Co hoc', summary: 'Quan sat do cao, van toc roi va gia toc trong truong.', defaultParams: { g: 9.81, h0: 30, vx: 1 } },
  { type: 'circular-motion-3d', label: 'Chuyen dong tron deu', group: 'Co hoc', summary: 'Lien he ban kinh, toc do goc, chu ki va gia toc huong tam.', defaultParams: { r: 4, omega: 1.6 } },
  { type: 'force-decomposition-3d', label: 'Tong hop va phan tich luc', group: 'Co hoc', summary: 'Phan tich luc thanh phan va hop luc tac dung len vat.', defaultParams: { f1: 6, f2: 8, angle: 60 } },
  { type: 'newton-laws-3d', label: 'Ba dinh luat Newton', group: 'Co hoc', summary: 'Doi chieu luc tong hop, khoi luong, ma sat va gia toc.', defaultParams: { mass: 2, force: 8, friction: 1 } },
  { type: 'spring-3d', label: 'Con lac lo xo', group: 'Co hoc', summary: 'Theo doi bien do, nang luong va chu ki dao dong.', defaultParams: { k: 20, mass: 0.5, amplitude: 1.2 } },
  { type: 'pendulum-3d', label: 'Con lac don', group: 'Co hoc', summary: 'Quan sat dao dong, chu ki va anh huong cua chieu dai day.', defaultParams: { length: 2, amplitude: 0.5, g: 9.81 } },
  { type: 'wave-3d', label: 'Song co', group: 'Song va dao dong', summary: 'Quan sat nguon song, buoc song va su lan truyen.', defaultParams: { amplitude: 1, wavelength: 3, speed: 2 } },
  { type: 'standing-wave-3d', label: 'Song dung', group: 'Song va dao dong', summary: 'Nhan dien nut, bung song va dieu kien tao song dung.', defaultParams: { mode: 2, tension: 5, length: 6 } },
  { type: 'interference-3d', label: 'Giao thoa song', group: 'Song va dao dong', summary: 'Theo doi van cuc dai, cuc tieu va hieu duong di.', defaultParams: { wavelength: 1.5, distance: 4, screen: 8 } },
  { type: 'electric-field-3d', label: 'Dien truong', group: 'Dien tu', summary: 'Quan sat duong suc dien va quy dao hat mang dien.', defaultParams: { field: 4, charge: 1, velocity: 3 } },
  { type: 'coulomb-3d', label: 'Luc Coulomb', group: 'Dien tu', summary: 'So sanh do lon luc theo khoang cach va dau dien tich.', defaultParams: { q1: 2, q2: -2, r: 3 } },
  { type: 'magnetic-field-lines-3d', label: 'Tu truong', group: 'Dien tu', summary: 'Theo doi duong suc tu va huong cam ung tu.', defaultParams: { current: 3, distance: 2, turns: 8 } },
  { type: 'magnetic-helix-3d', label: 'Hat tich dien trong tu truong', group: 'Dien tu', summary: 'Quan sat quy dao xoan oc duoi tac dung cua luc Lorentz.', defaultParams: { charge: 1, velocity: 4, B: 2 } },
  { type: 'induction-3d', label: 'Cam ung dien tu', group: 'Dien tu', summary: 'Theo doi tu thong va su xuat hien suat dien dong cam ung.', defaultParams: { B: 2, area: 3, speed: 2 } },
  { type: 'transformer-3d', label: 'May bien ap', group: 'Dien tu', summary: 'Lien he so vong day voi dien ap va dong dien.', defaultParams: { n1: 100, n2: 200, u1: 220 } },
  { type: 'rlc-3d', label: 'Mach RLC', group: 'Dien tu', summary: 'Quan sat dien ap, dong dien va cong suat tren mach xoay chieu.', defaultParams: { r: 20, l: 0.2, c: 0.001 } },
  { type: 'lens-3d', label: 'Thau kinh', group: 'Quang hoc', summary: 'Quan sat tia dac biet, anh tao boi thau kinh va tieu cu.', defaultParams: { f: 12, d: 20, h: 3 } },
  { type: 'refraction-3d', label: 'Khuc xa anh sang', group: 'Quang hoc', summary: 'Theo doi tia toi, tia khuc xa va mat phan cach.', defaultParams: { n1: 1, n2: 1.5, angle: 35 } },
  { type: 'eye-optics-3d', label: 'Mat va tat khuc xa', group: 'Quang hoc', summary: 'Lien he khoang vat, tieu cu va vi tri anh tren vong mac.', defaultParams: { f: 2, distance: 25, defect: 1 } },
  { type: 'magnifier-3d', label: 'Kinh lup', group: 'Quang hoc', summary: 'Quan sat cach kinh lup tao anh ao va do boi giac.', defaultParams: { f: 5, distance: 4, height: 2 } },
  { type: 'microscope-3d', label: 'Kinh hien vi', group: 'Quang hoc', summary: 'Mo ta duong di tia sang qua vat kinh va thi kinh.', defaultParams: { f1: 1, f2: 4, tube: 16 } },
  { type: 'telescope-3d', label: 'Kinh thien van', group: 'Quang hoc', summary: 'Quan sat duong di tia song song va do boi goc.', defaultParams: { f1: 20, f2: 5, distance: 40 } },
  { type: 'thermal-isothermal-3d', label: 'Dang nhiet', group: 'Nhiet hoc', summary: 'Theo doi quan he p-V khi nhiet do khong doi.', defaultParams: { pressure: 1.5, volume: 3, temp: 300 } },
  { type: 'thermal-isobaric-3d', label: 'Dang ap', group: 'Nhiet hoc', summary: 'Theo doi quan he V-T khi ap suat khong doi.', defaultParams: { pressure: 1, volume: 2, temp: 320 } },
  { type: 'thermal-state-equation-3d', label: 'Phuong trinh trang thai', group: 'Nhiet hoc', summary: 'Lien he ba dai luong p, V, T trong cung mot he khi.', defaultParams: { pressure: 1, volume: 2.5, temp: 300 } },
  { type: 'thermal-kinetic-3d', label: 'Dong hoc phan tu khi', group: 'Nhiet hoc', summary: 'Quan sat anh huong cua nhiet do den chuyen dong vi mo.', defaultParams: { temp: 320, particles: 24, volume: 4 } },
  { type: 'xray-tube-3d', label: 'Ong tia X', group: 'Vat ly hien dai', summary: 'Mo ta electron gia toc va su phat tia X tren bia kim loai.', defaultParams: { voltage: 40, current: 2, target: 1 } },
  { type: 'bohr-atom-3d', label: 'Mo hinh nguyen tu Bohr', group: 'Vat ly hien dai', summary: 'Theo doi quy dao electron va muc nang luong ro roi.', defaultParams: { n: 2, z: 1 } },
  { type: 'radioactive-decay-3d', label: 'Phong xa', group: 'Vat ly hien dai', summary: 'Quan sat quy luat giam hat nhan phong xa theo thoi gian.', defaultParams: { lambda: 0.35, N0: 100, emission: 6 } },
  { type: 'nuclear-structure-3d', label: 'Cau tao hat nhan', group: 'Vat ly hien dai', summary: 'Hinh dung proton, neutron va cau truc hat nhan.', defaultParams: { proton: 6, neutron: 8 } },
  { type: 'binding-energy-3d', label: 'Nang luong lien ket', group: 'Vat ly hien dai', summary: 'Lien he do hut khoi va nang luong lien ket rieng.', defaultParams: { massDefect: 0.2, binding: 8 } },
  { type: 'nuclear-reaction-3d', label: 'Phan ung hat nhan', group: 'Vat ly hien dai', summary: 'Theo doi hat toi, san pham sau phan ung va can bang nang luong.', defaultParams: { energy: 200, massDefect: 0.2 } }
];

export function findSimulationPreset(type?: string) {
  return SIMULATION_LIBRARY.find((item) => item.type === type);
}

export function getSimulationLibrary() {
  return SIMULATION_LIBRARY;
}

export const FALLBACK_VISUAL_TYPES = {
  CO_HOC: 'co-hoc-overview-visual',
  NHIET: 'nhiet-hoc-overview-visual',
  DIEN_TU: 'dien-tu-overview-visual',
  QUANG: 'quang-hoc-overview-visual',
  HIEN_DAI: 'hien-dai-overview-visual'
} as const;

function normalize(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/d/g, 'd')
    .replace(/Ð/g, 'D')
    .toLowerCase();
}

export function resolveVisualTypeForLesson(meta: { ten?: string; moTa?: string; chuongTen?: string; chuDeThi?: string }) {
  const haystack = normalize(`${meta.ten ?? ''} ${meta.moTa ?? ''} ${meta.chuongTen ?? ''} ${meta.chuDeThi ?? ''}`);
  if (/(dang nhiet|dang ap|phuong trinh trang thai|nhiet do|noi nang|chat khi|nhiet)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.NHIET;
  if (/(quang|khuc xa|phan xa|thau kinh|mat|kinh lup|kinh hien vi|kinh thien van)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.QUANG;
  if (/(dien truong|dong dien|mach|rlc|cam ung|tu truong|bien ap|coulomb|lorentz)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.DIEN_TU;
  if (/(phong xa|hat nhan|bohr|lien ket|phan ung|tia x|luong tu)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.HIEN_DAI;
  return FALLBACK_VISUAL_TYPES.CO_HOC;
}
