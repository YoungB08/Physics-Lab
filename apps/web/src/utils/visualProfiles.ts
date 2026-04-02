export type VisualMode = 'simulation' | 'image';

export type VisualProfile = {
  type: string;
  displayLabel: string;
  mode: VisualMode;
  sceneKind: string;
  strategy: string;
  palette: [string, string, string];
  headline: string;
  bullets: string[];
};

const OVERVIEW_PROFILES: Record<string, VisualProfile> = {
  'co-hoc-overview-visual': {
    type: 'co-hoc-overview-visual',
    displayLabel: 'Bo canh co hoc',
    mode: 'image',
    sceneKind: 'overview',
    strategy: 'Nhin luc, chuyen dong va trang thai cua vat trong cung mot khung hinh.',
    palette: ['#0b1120', '#38bdf8', '#e2e8f0'],
    headline: 'Tong hop cac mo hinh co hoc can quan sat nhanh',
    bullets: ['Theo doi vi tri va quy dao cua vat', 'So sanh luc, van toc va gia toc', 'Kiem tra gia thiet vat ly truoc khi ket luan']
  },
  'nhiet-hoc-overview-visual': {
    type: 'nhiet-hoc-overview-visual',
    displayLabel: 'Bo canh nhiet hoc',
    mode: 'image',
    sceneKind: 'overview',
    strategy: 'Tap trung vao ba dai luong p, V, T va dieu kien giu khong doi.',
    palette: ['#1f2937', '#f59e0b', '#fde68a'],
    headline: 'Quan sat su rang buoc giua nhiet do, ap suat va the tich',
    bullets: ['Xac dinh qua trinh dang nhiet, dang ap hay bien doi tong quat', 'Theo doi p-V-T dong thoi', 'Lien he phuong trinh trang thai voi mo phong']
  },
  'dien-tu-overview-visual': {
    type: 'dien-tu-overview-visual',
    displayLabel: 'Bo canh dien tu',
    mode: 'image',
    sceneKind: 'overview',
    strategy: 'Quan sat huong truong, quy dao hat tich dien va gia tri dai luong tren HUD.',
    palette: ['#111827', '#22c55e', '#bbf7d0'],
    headline: 'Tong hop dien truong, tu truong va mach dien',
    bullets: ['Theo doi huong duong suc va vector luc', 'Lien he thong so nguon voi phan ung cua he', 'Kiem tra dau dien tich va chieu dong dien']
  },
  'quang-hoc-overview-visual': {
    type: 'quang-hoc-overview-visual',
    displayLabel: 'Bo canh quang hoc',
    mode: 'image',
    sceneKind: 'overview',
    strategy: 'Quan sat duong di tia sang, mat phan cach va vi tri anh tao thanh.',
    palette: ['#0f172a', '#a855f7', '#e9d5ff'],
    headline: 'Tong hop tia sang, thau kinh va dung cu quang hoc',
    bullets: ['Ve tia dac biet truoc khi tinh', 'Xac dinh vat that, anh that hay anh ao', 'Lien he tieu cu, khoang cach vat va anh']
  },
  'hien-dai-overview-visual': {
    type: 'hien-dai-overview-visual',
    displayLabel: 'Bo canh vat ly hien dai',
    mode: 'image',
    sceneKind: 'overview',
    strategy: 'Tap trung vao qua trinh vi mo, hat thanh phan va can bang nang luong.',
    palette: ['#111827', '#f97316', '#ffedd5'],
    headline: 'Tong hop phong xa, hat nhan va mo hinh nguyen tu',
    bullets: ['Theo doi hat toi va san pham dau ra', 'So sanh nang luong truoc va sau qua trinh', 'Nhan dien quy luat giam va cau truc vi mo']
  }
};

const SIM_SCENE_KIND: Record<string, string> = {
  'linear-motion-3d': 'linearRail',
  'accelerated-motion-3d': 'acceleratedCart',
  'free-fall-3d': 'freeFallTower',
  'circular-motion-3d': 'circularRotor',
  'force-decomposition-3d': 'forceBoard',
  'newton-laws-3d': 'newtonCart',
  'friction-plane-3d': 'inclinedPlane',
  'spring-3d': 'springOscillator',
  'pendulum-3d': 'pendulum',
  'wave-3d': 'waveTank',
  'standing-wave-3d': 'standingString',
  'interference-3d': 'interferenceTank',
  'electric-field-3d': 'electricPlates',
  'coulomb-3d': 'coulombCharges',
  'magnetic-field-lines-3d': 'magnetField',
  'magnetic-helix-3d': 'magneticHelix',
  'induction-3d': 'inductionCoil',
  'transformer-3d': 'transformerCore',
  'rlc-3d': 'rlcPanel',
  'lens-3d': 'lensBench',
  'refraction-3d': 'refractionTank',
  'eye-optics-3d': 'eyeOptics',
  'magnifier-3d': 'microscopeRig',
  'microscope-3d': 'microscopeRig',
  'telescope-3d': 'microscopeRig',
  'thermal-isothermal-3d': 'thermalIsothermal',
  'thermal-isobaric-3d': 'thermalIsobaric',
  'thermal-state-equation-3d': 'thermalState',
  'thermal-kinetic-3d': 'thermalBox',
  'xray-tube-3d': 'xrayTube',
  'bohr-atom-3d': 'bohrAtom',
  'radioactive-decay-3d': 'decayChamber',
  'nuclear-structure-3d': 'nuclearCluster',
  'binding-energy-3d': 'bindingWell',
  'nuclear-reaction-3d': 'nuclearReaction'
};

function titleFromType(type: string) {
  return type
    .replace(/-3d$/i, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function paletteFromType(type: string): [string, string, string] {
  const lower = type.toLowerCase();
  if (lower.includes('thermal')) return ['#1f2937', '#f59e0b', '#fde68a'];
  if (lower.includes('electric') || lower.includes('magnetic') || lower.includes('coulomb') || lower.includes('induction') || lower.includes('transformer') || lower.includes('rlc')) return ['#111827', '#22c55e', '#bbf7d0'];
  if (lower.includes('lens') || lower.includes('refraction') || lower.includes('eye') || lower.includes('microscope') || lower.includes('telescope') || lower.includes('magnifier')) return ['#0f172a', '#a855f7', '#e9d5ff'];
  if (lower.includes('bohr') || lower.includes('radioactive') || lower.includes('nuclear') || lower.includes('xray')) return ['#111827', '#f97316', '#ffedd5'];
  return ['#0b1120', '#38bdf8', '#e2e8f0'];
}

function simulationProfile(type?: string): VisualProfile {
  const safeType = String(type || 'default');
  return {
    type: safeType,
    displayLabel: titleFromType(safeType),
    mode: 'simulation',
    sceneKind: SIM_SCENE_KIND[safeType] || 'linearRail',
    strategy: 'Theo doi thong so tren HUD, thay tung tham so va doi chieu voi cong thuc.',
    palette: paletteFromType(safeType),
    headline: 'Mo phong tuong tac theo bai hoc',
    bullets: ['Quan sat xu huong khi doi tung tham so', 'Doc dong thoi hinh anh, vector va so lieu', 'Rut ket luan tu mo hinh va dieu kien ap dung']
  };
}

export function getVisualProfile(type?: string) {
  const safeType = String(type || '');
  if (OVERVIEW_PROFILES[safeType]) return OVERVIEW_PROFILES[safeType];
  return simulationProfile(safeType);
}

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateLessonIllustration(title: string, type?: string, config: Record<string, unknown> = {}) {
  const profile = getVisualProfile(type);
  const [bg, accent, soft] = profile.palette;
  const seedSource = `${title}|${type || ''}|${String(config.sceneVariant || '')}|${String(config.variantKey || '')}`;
  let seed = 0;
  for (let i = 0; i < seedSource.length; i += 1) seed = ((seed << 5) - seed + seedSource.charCodeAt(i)) >>> 0;
  const motifX = 790 + (seed % 180);
  const motifY = 150 + ((seed >> 4) % 140);
  const motifSize = 78 + ((seed >> 8) % 56);
  const strategyLabel = String(config.strategyTitle || 'Chien luoc quan sat');
  const bullets = profile.bullets.slice(0, 3).map((item, index) => `
    <g transform="translate(44 ${220 + index * 54})">
      <circle cx="0" cy="0" r="8" fill="${accent}" opacity="0.9" />
      <text x="20" y="7" font-size="24" fill="#e2e8f0" font-family="Segoe UI,Arial">${esc(item)}</text>
    </g>`).join('');

  const motif = profile.mode === 'image'
    ? `<g opacity="0.9">
        <rect x="${motifX - 145}" y="${motifY - 145}" width="290" height="290" rx="36" fill="${soft}" opacity="0.16" />
        <circle cx="${motifX}" cy="${motifY}" r="${motifSize}" fill="none" stroke="${accent}" stroke-width="14" />
        <path d="M${motifX - 67} ${motifY}h134M${motifX} ${motifY - 67}v134" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.8" />
      </g>`
    : `<g opacity="0.95">
        <path d="M${motifX - 145} ${motifY + 95}c52-146 136-216 252-210" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" />
        <circle cx="${motifX + 120}" cy="${motifY - 114}" r="22" fill="${accent}" />
        <circle cx="${motifX - 92}" cy="${motifY + 49}" r="34" fill="${soft}" stroke="${accent}" stroke-width="10" />
      </g>`;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="card" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${soft}" stop-opacity="0.20" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0.10" />
      </linearGradient>
    </defs>
    <rect width="1200" height="675" fill="url(#g)" />
    <circle cx="1050" cy="88" r="240" fill="${accent}" opacity="0.12" />
    <circle cx="120" cy="600" r="220" fill="${soft}" opacity="0.10" />
    <rect x="32" y="32" width="1136" height="611" rx="32" fill="url(#card)" stroke="rgba(255,255,255,0.12)" />
    <text x="44" y="88" font-size="20" fill="${accent}" font-family="Segoe UI,Arial" letter-spacing="4">KNTECH VISUAL</text>
    <text x="44" y="160" font-size="52" font-weight="700" fill="#f8fafc" font-family="Segoe UI,Arial">${esc(title)}</text>
    <text x="44" y="208" font-size="30" fill="#cbd5e1" font-family="Segoe UI,Arial">${esc(profile.headline)}</text>
    ${bullets}
    <g transform="translate(44 440)">
      <rect width="516" height="126" rx="24" fill="rgba(15,23,42,0.54)" stroke="${accent}" stroke-opacity="0.42" />
      <text x="28" y="42" font-size="20" fill="${accent}" font-family="Segoe UI,Arial">${esc(strategyLabel)}</text>
      <text x="28" y="82" font-size="26" fill="#f8fafc" font-family="Segoe UI,Arial">${esc(profile.strategy)}</text>
    </g>
    ${motif}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
