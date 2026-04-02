import { listLessonScenes, resolveLessonScene } from './lessonSceneRegistry';

export type Vec3Tuple = [number, number, number];

export type LessonHeroStructure = {
  sceneId: string;
  sceneKind: string;
  frameType: 'tripod' | 'portal' | 'spline' | 'fins' | 'lattice' | 'radial';
  anchorA: Vec3Tuple;
  anchorB: Vec3Tuple;
  anchorC: Vec3Tuple;
  scaleA: number;
  scaleB: number;
  scaleC: number;
  tiltA: number;
  tiltB: number;
  tiltC: number;
};

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

const HERO_STRUCTURES: LessonHeroStructure[] = listLessonScenes().map((item, index) => {
  const t = (Math.PI * 2 * index) / 65;
  const u = (Math.PI * 2 * ((index * 5) % 65)) / 65;
  const v = (Math.PI * 2 * ((index * 17) % 65)) / 65;
  const frameTypes: LessonHeroStructure['frameType'][] = ['tripod', 'portal', 'spline', 'fins', 'lattice', 'radial'];
  return {
    sceneId: item.sceneId,
    sceneKind: item.sceneKind,
    frameType: frameTypes[index % frameTypes.length],
    anchorA: [round(Math.cos(t) * 1.6), round(-0.4 + Math.sin(u) * 0.8), round(Math.sin(t) * 1.4)],
    anchorB: [round(Math.cos(u) * 1.2), round(0.1 + Math.sin(v) * 0.9), round(Math.sin(u) * 1.8)],
    anchorC: [round(Math.cos(v) * 1.9), round(0.6 + Math.sin(t) * 0.7), round(Math.sin(v) * 1.1)],
    scaleA: round(0.45 + (index % 7) * 0.08),
    scaleB: round(0.4 + (index % 6) * 0.09),
    scaleC: round(0.5 + (index % 5) * 0.1),
    tiltA: round(-24 + (index % 9) * 6),
    tiltB: round(-18 + (index % 8) * 5),
    tiltC: round(-12 + (index % 7) * 4)
  } satisfies LessonHeroStructure;
});

export function resolveLessonHeroStructure(input: { sceneId?: string | null; title?: string; slug?: string; fallbackSceneKind?: string }) {
  const scene = resolveLessonScene(input);
  const found = HERO_STRUCTURES.find((item) => item.sceneId === scene.sceneId);
  if (found) return found;

  return {
    sceneId: scene.sceneId,
    sceneKind: scene.sceneKind,
    frameType: 'tripod',
    anchorA: [-1.2, -0.3, 0.8],
    anchorB: [0.8, 0.4, -1],
    anchorC: [1.4, 1, 0.6],
    scaleA: 0.6,
    scaleB: 0.55,
    scaleC: 0.65,
    tiltA: -12,
    tiltB: 8,
    tiltC: 16
  } satisfies LessonHeroStructure;
}
