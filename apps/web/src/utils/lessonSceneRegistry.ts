export type LessonSceneRegistryItem = {
  key: string;
  sceneId: string;
  sceneKind: string;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

const REGISTRY: LessonSceneRegistryItem[] = [
  { key: 'chuyen dong thang deu', sceneId: 'scene-mechanics-linear-motion-uniform', sceneKind: 'linearRail' },
  { key: 'chuyen dong thang bien doi deu', sceneId: 'scene-mechanics-linear-motion-accelerated', sceneKind: 'acceleratedCart' },
  { key: 'su roi tu do', sceneId: 'scene-mechanics-free-fall-tower', sceneKind: 'freeFallTower' },
  { key: 'chuyen dong tron deu', sceneId: 'scene-mechanics-circular-rotor', sceneKind: 'circularRotor' },
  { key: 'tong hop va phan tich luc', sceneId: 'scene-mechanics-force-decomposition-board', sceneKind: 'forceBoard' },
  { key: 'ba dinh luat newton', sceneId: 'scene-mechanics-newton-cart-laws', sceneKind: 'newtonCart' },
  { key: 'luc hap dan', sceneId: 'scene-mechanics-gravity-orbit-pair', sceneKind: 'gravityOrbit' },
  { key: 'luc ma sat', sceneId: 'scene-mechanics-friction-incline-plane', sceneKind: 'inclinedPlane' },
  { key: 'luc dan hoi', sceneId: 'scene-mechanics-elastic-hooke-spring', sceneKind: 'springMass' },
  { key: 'cong va cong suat', sceneId: 'scene-mechanics-work-power-cart', sceneKind: 'newtonCart' },
  { key: 'dong nang', sceneId: 'scene-mechanics-kinetic-energy-cart', sceneKind: 'acceleratedCart' },
  { key: 'the nang', sceneId: 'scene-mechanics-potential-energy-orbit', sceneKind: 'gravityOrbit' },
  { key: 'co nang', sceneId: 'scene-mechanics-mechanical-energy-pendulum', sceneKind: 'pendulumArc' },
  { key: 'cau truc chat', sceneId: 'scene-thermal-matter-structure-cluster', sceneKind: 'nuclearCluster' },
  { key: 'nhiet do va noi nang', sceneId: 'scene-thermal-temperature-internal-energy', sceneKind: 'thermalParticles' },
  { key: 'qua trinh dang nhiet', sceneId: 'scene-thermal-isothermal-process', sceneKind: 'isothermalPiston' },
  { key: 'qua trinh dang ap', sceneId: 'scene-thermal-isobaric-process', sceneKind: 'isobaricPiston' },
  { key: 'phuong trinh trang thai', sceneId: 'scene-thermal-state-equation', sceneKind: 'stateEquationChamber' },
  { key: 'bien dang co', sceneId: 'scene-material-deformation-elasticity', sceneKind: 'springMass' },
  { key: 'suc cang be mat', sceneId: 'scene-fluid-surface-tension', sceneKind: 'travelingWave' },
  { key: 'luc day archimedes', sceneId: 'scene-fluid-archimedes-buoyancy', sceneKind: 'gravityOrbit' },
  { key: 'su noi', sceneId: 'scene-fluid-floating-equilibrium', sceneKind: 'freeFallTower' },
  { key: 'dien tich', sceneId: 'scene-electrostatics-charge-interaction', sceneKind: 'coulombCharges' },
  { key: 'dinh luat coulomb', sceneId: 'scene-electrostatics-coulomb-law', sceneKind: 'coulombCharges' },
  { key: 'dien truong deu', sceneId: 'scene-electrostatics-uniform-electric-field', sceneKind: 'electricPlates' },
  { key: 'cong cua luc dien', sceneId: 'scene-electrostatics-electric-work', sceneKind: 'electricPlates' },
  { key: 'dien the', sceneId: 'scene-electrostatics-electric-potential', sceneKind: 'electricPlates' },
  { key: 'cuong do dong dien', sceneId: 'scene-circuit-current-intensity', sceneKind: 'ohmCircuit' },
  { key: 'nguon dien', sceneId: 'scene-circuit-power-source', sceneKind: 'ohmCircuit' },
  { key: 'dinh luat ohm', sceneId: 'scene-circuit-ohm-law', sceneKind: 'ohmCircuit' },
  { key: 'cong suat dien', sceneId: 'scene-circuit-electric-power', sceneKind: 'ohmCircuit' },
  { key: 'mach dien hon hop', sceneId: 'scene-circuit-mixed-network', sceneKind: 'ohmCircuit' },
  { key: 'cam ung tu', sceneId: 'scene-magnetism-field-lines', sceneKind: 'magnetField' },
  { key: 'luc lorentz', sceneId: 'scene-magnetism-lorentz-helix', sceneKind: 'lorentzHelix' },
  { key: 'luc tu tac dung len day dan', sceneId: 'scene-magnetism-force-on-wire', sceneKind: 'magnetField' },
  { key: 'tu thong', sceneId: 'scene-magnetism-magnetic-flux', sceneKind: 'inductionCoil' },
  { key: 'hien tuong cam ung dien tu', sceneId: 'scene-magnetism-electromagnetic-induction', sceneKind: 'inductionCoil' },
  { key: 'khuc xa anh sang', sceneId: 'scene-optics-refraction-tank', sceneKind: 'refractionTank' },
  { key: 'phan xa toan phan', sceneId: 'scene-optics-total-internal-reflection', sceneKind: 'refractionTank' },
  { key: 'thau kinh mong', sceneId: 'scene-optics-thin-lens-bench', sceneKind: 'lensBench' },
  { key: 'mat va cac tat cua mat', sceneId: 'scene-optics-eye-defects', sceneKind: 'eyeOptics' },
  { key: 'kinh lup kinh hien vi kinh thien van', sceneId: 'scene-optics-optical-instruments-suite', sceneKind: 'microscopeRig' },
  { key: 'dao dong dieu hoa', sceneId: 'scene-oscillation-shm-core', sceneKind: 'springMass' },
  { key: 'con lac lo xo', sceneId: 'scene-oscillation-spring-pendulum', sceneKind: 'springMass' },
  { key: 'con lac don', sceneId: 'scene-oscillation-simple-pendulum', sceneKind: 'pendulumArc' },
  { key: 'nang luong dao dong', sceneId: 'scene-oscillation-energy-exchange', sceneKind: 'pendulumArc' },
  { key: 'tong hop dao dong', sceneId: 'scene-oscillation-superposition', sceneKind: 'interferenceField' },
  { key: 'dai cuong ve song', sceneId: 'scene-wave-general-propagation', sceneKind: 'travelingWave' },
  { key: 'giao thoa song', sceneId: 'scene-wave-interference-pattern', sceneKind: 'interferenceField' },
  { key: 'song dung', sceneId: 'scene-wave-standing-nodes-antinode', sceneKind: 'standingWave' },
  { key: 'am hoc', sceneId: 'scene-wave-acoustics-medium', sceneKind: 'travelingWave' },
  { key: 'dong dien xoay chieu', sceneId: 'scene-ac-alternating-current', sceneKind: 'rlcPanel' },
  { key: 'mach rlc', sceneId: 'scene-ac-rlc-resonance', sceneKind: 'rlcPanel' },
  { key: 'cong suat dien xoay chieu', sceneId: 'scene-ac-power-factor', sceneKind: 'rlcPanel' },
  { key: 'may bien ap', sceneId: 'scene-ac-transformer-core', sceneKind: 'transformerCore' },
  { key: 'truyen tai dien nang', sceneId: 'scene-ac-power-transmission', sceneKind: 'transformerCore' },
  { key: 'mach dao dong lc', sceneId: 'scene-ac-lc-oscillation', sceneKind: 'rlcPanel' },
  { key: 'song dien tu', sceneId: 'scene-ac-electromagnetic-wave', sceneKind: 'magnetField' },
  { key: 'hien tuong quang dien', sceneId: 'scene-modern-photoelectric-cell', sceneKind: 'photoelectricCell' },
  { key: 'mau nguyen tu bohr', sceneId: 'scene-modern-bohr-atom-model', sceneKind: 'bohrAtom' },
  { key: 'tia x', sceneId: 'scene-modern-xray-tube', sceneKind: 'xrayTube' },
  { key: 'cau tao hat nhan', sceneId: 'scene-nuclear-structure-cluster', sceneKind: 'nuclearCluster' },
  { key: 'phan ra alpha', sceneId: 'scene-nuclear-alpha-decay', sceneKind: 'decayChamber' },
  { key: 'phan ra beta', sceneId: 'scene-nuclear-beta-decay', sceneKind: 'decayChamber' },
  { key: 'phan ra gamma', sceneId: 'scene-nuclear-gamma-decay', sceneKind: 'decayChamber' },
  { key: 'chu ki ban ra', sceneId: 'scene-nuclear-half-life', sceneKind: 'decayChamber' },
  { key: 'phong xa', sceneId: 'scene-nuclear-radioactive-decay', sceneKind: 'decayChamber' },
  { key: 'phan hach', sceneId: 'scene-nuclear-fission', sceneKind: 'nuclearReaction' },
  { key: 'nhiet hach', sceneId: 'scene-nuclear-fusion', sceneKind: 'nuclearReaction' },
  { key: 'phan ung hat nhan', sceneId: 'scene-nuclear-reaction-products', sceneKind: 'nuclearReaction' },
  { key: 'nang luong lien ket', sceneId: 'scene-nuclear-binding-energy-well', sceneKind: 'bindingWell' }
];

export function resolveLessonScene(input: { title?: string; slug?: string; sceneId?: string | null; fallbackSceneKind?: string }) {
  if (input.sceneId) {
    const found = REGISTRY.find((item) => item.sceneId === input.sceneId);
    if (found) return found;
  }

  const haystack = normalize(`${input.title || ''} ${input.slug || ''}`);
  const found = REGISTRY.find((item) => haystack.includes(item.key));
  if (found) return found;

  return {
    key: haystack || 'default',
    sceneId: input.sceneId || `scene-fallback-${(haystack || 'default').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'default'}`,
    sceneKind: input.fallbackSceneKind || 'linearRail'
  };
}

export function listLessonScenes() {
  return REGISTRY;
}
