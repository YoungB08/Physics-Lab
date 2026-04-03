export type SimulationPreset = {
  type: string;
  label: string;
  group: string;
  summary: string;
  defaultParams: Record<string, number>;
};

export const SIMULATION_LIBRARY: SimulationPreset[] = [
  { type: 'linear-motion-3d', label: 'Chuyển động thẳng đều', group: 'Cơ học', summary: 'Theo dõi vị trí, quãng đường và vận tốc theo thời gian.', defaultParams: { v: 6, t: 10 } },
  { type: 'accelerated-motion-3d', label: 'Chuyển động thẳng biến đổi đều', group: 'Cơ học', summary: 'So sánh vận tốc, gia tốc và quãng đường khi vật chuyển động có gia tốc không đổi.', defaultParams: { v0: 1, a: 2, t: 5 } },
  { type: 'free-fall-3d', label: 'Sự rơi tự do', group: 'Cơ học', summary: 'Quan sát độ cao, vận tốc rơi và gia tốc trong trường.', defaultParams: { g: 9.81, h0: 30, vx: 1 } },
  { type: 'circular-motion-3d', label: 'Chuyển động tròn đều', group: 'Cơ học', summary: 'Liên hệ bán kính, tốc độ góc, chu kì và gia tốc hướng tâm.', defaultParams: { r: 4, omega: 1.6 } },
  { type: 'force-decomposition-3d', label: 'Tổng hợp và phân tích lực', group: 'Cơ học', summary: 'Phân tích lực thành phần và hợp lực tác dụng lên vật.', defaultParams: { f1: 6, f2: 8, angle: 60 } },
  { type: 'newton-laws-3d', label: 'Ba định luật Newton', group: 'Cơ học', summary: 'Đối chiếu lực tổng hợp, khối lượng, ma sát và gia tốc.', defaultParams: { mass: 2, force: 8, friction: 1 } },
  { type: 'spring-3d', label: 'Con lắc lò xo', group: 'Cơ học', summary: 'Theo dõi biên độ, năng lượng và chu kì dao động.', defaultParams: { k: 20, mass: 0.5, amplitude: 1.2 } },
  { type: 'pendulum-3d', label: 'Con lắc đơn', group: 'Cơ học', summary: 'Quan sát dao động, chu kì và ảnh hưởng của chiều dài dây.', defaultParams: { length: 2, amplitude: 0.5, g: 9.81 } },
  { type: 'wave-3d', label: 'Sóng cơ', group: 'Sóng và dao động', summary: 'Quan sát nguồn sóng, bước sóng và sự lan truyền.', defaultParams: { amplitude: 1, wavelength: 3, speed: 2 } },
  { type: 'standing-wave-3d', label: 'Sóng dừng', group: 'Sóng và dao động', summary: 'Nhận diện nút, bụng sóng và điều kiện tạo sóng dừng.', defaultParams: { mode: 2, tension: 5, length: 6 } },
  { type: 'interference-3d', label: 'Giao thoa sóng', group: 'Sóng và dao động', summary: 'Theo dõi vân cực đại, cực tiểu và hiệu đường đi.', defaultParams: { wavelength: 1.5, distance: 4, screen: 8 } },
  { type: 'electric-field-3d', label: 'Điện trường', group: 'Điện từ', summary: 'Quan sát đường sức điện và quỹ đạo hạt mang điện.', defaultParams: { field: 4, charge: 1, velocity: 3 } },
  { type: 'coulomb-3d', label: 'Lực Coulomb', group: 'Điện từ', summary: 'So sánh độ lớn lực theo khoảng cách và dấu điện tích.', defaultParams: { q1: 2, q2: -2, r: 3 } },
  { type: 'magnetic-field-lines-3d', label: 'Từ trường', group: 'Điện từ', summary: 'Theo dõi đường sức từ và hướng cảm ứng từ.', defaultParams: { current: 3, distance: 2, turns: 8 } },
  { type: 'magnetic-helix-3d', label: 'Hạt tích điện trong từ trường', group: 'Điện từ', summary: 'Quan sát quỹ đạo xoắn ốc dưới tác dụng của lực Lorentz.', defaultParams: { charge: 1, velocity: 4, B: 2 } },
  { type: 'induction-3d', label: 'Cảm ứng điện từ', group: 'Điện từ', summary: 'Theo dõi từ thông và sự xuất hiện suất điện động cảm ứng.', defaultParams: { B: 2, area: 3, speed: 2 } },
  { type: 'transformer-3d', label: 'Máy biến áp', group: 'Điện từ', summary: 'Liên hệ số vòng dây với điện áp và dòng điện.', defaultParams: { n1: 100, n2: 200, u1: 220 } },
  { type: 'rlc-3d', label: 'Mạch RLC', group: 'Điện từ', summary: 'Quan sát điện áp, dòng điện và công suất trên mạch xoay chiều.', defaultParams: { r: 20, l: 0.2, c: 0.001 } },
  { type: 'lens-3d', label: 'Thấu kính', group: 'Quang học', summary: 'Quan sát tia đặc biệt, ảnh tạo bởi thấu kính và tiêu cự.', defaultParams: { f: 12, d: 20, h: 3 } },
  { type: 'refraction-3d', label: 'Khúc xạ ánh sáng', group: 'Quang học', summary: 'Theo dõi tia tới, tia khúc xạ và mặt phân cách.', defaultParams: { n1: 1, n2: 1.5, angle: 35 } },
  { type: 'eye-optics-3d', label: 'Mắt và tật khúc xạ', group: 'Quang học', summary: 'Liên hệ khoảng vật, tiêu cự và vị trí ảnh trên võng mạc.', defaultParams: { f: 2, distance: 25, defect: 1 } },
  { type: 'magnifier-3d', label: 'Kính lúp', group: 'Quang học', summary: 'Quan sát cách kính lúp tạo ảnh ảo và độ bội giác.', defaultParams: { f: 5, distance: 4, height: 2 } },
  { type: 'microscope-3d', label: 'Kính hiển vi', group: 'Quang học', summary: 'Mô tả đường đi tia sáng qua vật kính và thị kính.', defaultParams: { f1: 1, f2: 4, tube: 16 } },
  { type: 'telescope-3d', label: 'Kính thiên văn', group: 'Quang học', summary: 'Quan sát đường đi tia song song và độ bội giác.', defaultParams: { f1: 20, f2: 5, distance: 40 } },
  { type: 'thermal-isothermal-3d', label: 'Đẳng nhiệt', group: 'Nhiệt học', summary: 'Theo dõi quan hệ p-V khi nhiệt độ không đổi.', defaultParams: { pressure: 1.5, volume: 3, temp: 300 } },
  { type: 'thermal-isobaric-3d', label: 'Đẳng áp', group: 'Nhiệt học', summary: 'Theo dõi quan hệ V-T khi áp suất không đổi.', defaultParams: { pressure: 1, volume: 2, temp: 320 } },
  { type: 'thermal-state-equation-3d', label: 'Phương trình trạng thái', group: 'Nhiệt học', summary: 'Liên hệ ba đại lượng p, V, T trong cùng một hệ khí.', defaultParams: { pressure: 1, volume: 2.5, temp: 300 } },
  { type: 'thermal-kinetic-3d', label: 'Động học phân tử khí', group: 'Nhiệt học', summary: 'Quan sát ảnh hưởng của nhiệt độ đến chuyển động vi mô.', defaultParams: { temp: 320, particles: 24, volume: 4 } },
  { type: 'xray-tube-3d', label: 'Ống tia X', group: 'Vật lý hiện đại', summary: 'Mô tả electron gia tốc và sự phát tia X trên bia kim loại.', defaultParams: { voltage: 40, current: 2, target: 1 } },
  { type: 'bohr-atom-3d', label: 'Mô hình nguyên tử Bohr', group: 'Vật lý hiện đại', summary: 'Theo dõi quỹ đạo electron và mức năng lượng rời rạc.', defaultParams: { n: 2, z: 1 } },
  { type: 'radioactive-decay-3d', label: 'Phóng xạ tổng quát', group: 'Vật lý hiện đại', summary: 'Quan sát quy luật giảm số hạt nhân phóng xạ theo thời gian.', defaultParams: { lambda: 0.35, N0: 100, emission: 6 } },
  { type: 'alpha-decay-3d', label: 'Phân rã alpha', group: 'Vật lý hiện đại', summary: 'Theo dõi hạt nhân mẹ phát ra hạt alpha và biến đổi thành hạt nhân con.', defaultParams: { lambda: 0.32, N0: 120, emission: 4 } },
  { type: 'beta-decay-3d', label: 'Phân rã beta', group: 'Vật lý hiện đại', summary: 'Quan sát sự biến đổi proton-neutron kèm electron hoặc positron phát ra.', defaultParams: { lambda: 0.28, N0: 120, emission: 5 } },
  { type: 'gamma-decay-3d', label: 'Phân rã gamma', group: 'Vật lý hiện đại', summary: 'Mô tả hạt nhân chuyển mức năng lượng và phát photon gamma.', defaultParams: { lambda: 0.22, N0: 90, emission: 7 } },
  { type: 'half-life-3d', label: 'Chu kì bán rã', group: 'Vật lý hiện đại', summary: 'Đối chiếu số hạt còn lại với chu kì bán rã và hằng số phóng xạ.', defaultParams: { lambda: 0.35, N0: 160, emission: 6 } },
  { type: 'nuclear-structure-3d', label: 'Cấu tạo hạt nhân', group: 'Vật lý hiện đại', summary: 'Hình dung proton, neutron và cấu trúc hạt nhân.', defaultParams: { proton: 6, neutron: 8 } },
  { type: 'binding-energy-3d', label: 'Năng lượng liên kết', group: 'Vật lý hiện đại', summary: 'Liên hệ độ hụt khối, năng lượng liên kết và độ bền hạt nhân.', defaultParams: { massDefect: 0.2, binding: 8 } },
  { type: 'nuclear-reaction-3d', label: 'Phản ứng hạt nhân', group: 'Vật lý hiện đại', summary: 'Theo dõi hạt tới, sản phẩm sau phản ứng và cân bằng năng lượng.', defaultParams: { energy: 200, massDefect: 0.2 } },
  { type: 'nuclear-fission-3d', label: 'Phân hạch', group: 'Vật lý hiện đại', summary: 'Mô tả hạt nhân nặng vỡ thành hai mảnh và giải phóng năng lượng.', defaultParams: { energy: 220, massDefect: 0.24 } },
  { type: 'nuclear-fusion-3d', label: 'Nhiệt hạch', group: 'Vật lý hiện đại', summary: 'Theo dõi hai hạt nhân nhẹ hợp lại thành hạt nhân nặng hơn.', defaultParams: { energy: 260, massDefect: 0.18 } }
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
    .replace(/đ/g, 'd')
    .replace(/Ð/g, 'D')
    .toLowerCase();
}

export function resolveVisualTypeForLesson(meta: { ten?: string; moTa?: string; chuongTen?: string; chuDeThi?: string }) {
  const haystack = normalize(`${meta.ten ?? ''} ${meta.moTa ?? ''} ${meta.chuongTen ?? ''} ${meta.chuDeThi ?? ''}`);
  if (/(dang nhiet|dang ap|phuong trinh trang thai|nhiet do|noi nang|chat khi|nhiet)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.NHIET;
  if (/(quang|khuc xa|phan xa|thau kinh|mat|kinh lup|kinh hien vi|kinh thien van)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.QUANG;
  if (/(dien truong|dong dien|mach|rlc|cam ung|tu truong|bien ap|coulomb|lorentz)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.DIEN_TU;
  if (/(phong xa|hat nhan|bohr|lien ket|phan ung|phan ha.ch|nhiet ha.ch|tia x|luong tu|alpha|beta|gamma|ban ra)/i.test(haystack)) return FALLBACK_VISUAL_TYPES.HIEN_DAI;
  return FALLBACK_VISUAL_TYPES.CO_HOC;
}
