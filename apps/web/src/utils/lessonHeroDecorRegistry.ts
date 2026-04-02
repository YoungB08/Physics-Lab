import { listLessonScenes, resolveLessonScene } from './lessonSceneRegistry';

export type Vec3Tuple = [number, number, number];

export type LessonHeroDecor = {
  sceneId: string;
  sceneKind: string;
  haloRadius: number;
  ribbonHeight: number;
  ribbonTwist: number;
  satellitePoints: Vec3Tuple[];
  beamPoints: Vec3Tuple[];
  crownPoints: Vec3Tuple[];
};

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

const HERO_DECORS: LessonHeroDecor[] = listLessonScenes().map((item, index) => {
  const p = (Math.PI * 2 * index) / 65;
  const q = (Math.PI * 2 * ((index * 9) % 65)) / 65;
  const r = (Math.PI * 2 * ((index * 13) % 65)) / 65;

  return {
    sceneId: item.sceneId,
    sceneKind: item.sceneKind,
    haloRadius: round(1.2 + (index % 9) * 0.17),
    ribbonHeight: round(0.7 + (index % 7) * 0.14),
    ribbonTwist: round(0.15 + (index % 8) * 0.06),
    satellitePoints: Array.from({ length: 5 }).map((_, offset) => {
      const t = p + offset * 0.95;
      return [
        round(Math.cos(t) * (1.2 + offset * 0.28)),
        round(-0.3 + offset * 0.34 + Math.sin(q + offset * 0.3) * 0.2),
        round(Math.sin(t) * (1.1 + offset * 0.22))
      ];
    }),
    beamPoints: [
      [round(Math.cos(p) * 2.8), round(1.3 + Math.sin(q) * 0.6), round(Math.sin(p) * 1.9)],
      [round(Math.cos(q) * 1.4), round(0.4 + Math.sin(r) * 0.5), round(Math.sin(q) * 1.3)],
      [round(Math.cos(r) * -2.6), round(-0.8 + Math.cos(p) * 0.7), round(Math.sin(r) * 2.2)]
    ],
    crownPoints: Array.from({ length: 4 }).map((_, offset) => {
      const t = r + offset * 0.75;
      return [
        round(Math.cos(t) * (0.7 + offset * 0.18)),
        round(1.6 + offset * 0.28),
        round(Math.sin(t) * (0.7 + offset * 0.16))
      ];
    })
  } satisfies LessonHeroDecor;
});

export function resolveLessonHeroDecor(input: { sceneId?: string | null; title?: string; slug?: string; fallbackSceneKind?: string }) {
  const scene = resolveLessonScene(input);
  const found = HERO_DECORS.find((item) => item.sceneId === scene.sceneId);
  if (found) return found;

  return {
    sceneId: scene.sceneId,
    sceneKind: scene.sceneKind,
    haloRadius: 1.4,
    ribbonHeight: 1,
    ribbonTwist: 0.25,
    satellitePoints: [[1, 0, 0], [0.4, 0.5, 0.7], [-0.5, 0.9, 0.6], [-1, 0.2, -0.1], [0.2, 1.1, -0.8]],
    beamPoints: [[2.4, 1.2, 0], [0.8, 0.5, 0.6], [-2.2, -0.7, 0.2]],
    crownPoints: [[0.3, 1.6, 0.2], [0.8, 1.9, -0.2], [-0.6, 2.2, 0.4], [-0.2, 2.5, -0.5]]
  } satisfies LessonHeroDecor;
}
