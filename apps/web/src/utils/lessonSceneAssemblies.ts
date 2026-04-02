import { listLessonScenes, resolveLessonScene } from './lessonSceneRegistry';

export type Vec3Tuple = [number, number, number];

export type LessonSceneAssembly = {
  sceneId: string;
  sceneKind: string;
  orbitAnchor: Vec3Tuple;
  orbitScale: Vec3Tuple;
  orbitRotation: Vec3Tuple;
  accentLine: [Vec3Tuple, Vec3Tuple];
  sideClusterA: Vec3Tuple[];
  sideClusterB: Vec3Tuple[];
  motionEnvelope: {
    swingX: number;
    swingY: number;
    swingZ: number;
    yaw: number;
    pitch: number;
    roll: number;
  };
};

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

const ASSEMBLIES: LessonSceneAssembly[] = listLessonScenes().map((item, index) => {
  const a = (Math.PI * 2 * index) / 65;
  const b = (Math.PI * 2 * ((index * 7) % 65)) / 65;
  const c = (Math.PI * 2 * ((index * 11) % 65)) / 65;

  const orbitAnchor: Vec3Tuple = [round(Math.cos(a) * 0.75), round(-0.1 + Math.sin(b) * 0.55), round(Math.sin(a) * 0.75)];
  const orbitScale: Vec3Tuple = [round(0.92 + (index % 5) * 0.07), round(0.9 + (index % 4) * 0.08), round(0.92 + (index % 6) * 0.06)];
  const orbitRotation: Vec3Tuple = [round(Math.sin(a) * 0.22), round(Math.cos(b) * 0.28), round(Math.sin(c) * 0.18)];
  const accentLine: [Vec3Tuple, Vec3Tuple] = [
    [round(Math.cos(a) * 4.2), round(1.4 + Math.sin(b) * 1.1), round(Math.sin(a) * 2.8)],
    [round(Math.cos(c) * -4.6), round(-1.2 + Math.cos(a) * 1.2), round(Math.sin(c) * 3.4)]
  ];
  const sideClusterA: Vec3Tuple[] = Array.from({ length: 4 }).map((_, offset) => {
    const t = a + offset * 0.6;
    return [round(Math.cos(t) * (2.2 + offset * 0.45)), round(-0.8 + offset * 0.38), round(Math.sin(t) * (2 + offset * 0.3))];
  });
  const sideClusterB: Vec3Tuple[] = Array.from({ length: 4 }).map((_, offset) => {
    const t = b + offset * 0.55;
    return [round(Math.cos(t) * (-2.6 - offset * 0.4)), round(0.2 + offset * 0.34), round(Math.sin(t) * (2.4 + offset * 0.25))];
  });

  return {
    sceneId: item.sceneId,
    sceneKind: item.sceneKind,
    orbitAnchor,
    orbitScale,
    orbitRotation,
    accentLine,
    sideClusterA,
    sideClusterB,
    motionEnvelope: {
      swingX: round(0.08 + (index % 6) * 0.024),
      swingY: round(0.06 + (index % 5) * 0.02),
      swingZ: round(0.05 + (index % 4) * 0.018),
      yaw: round(0.12 + (index % 7) * 0.025),
      pitch: round(0.08 + (index % 6) * 0.02),
      roll: round(0.06 + (index % 5) * 0.018)
    }
  } satisfies LessonSceneAssembly;
});

export function resolveLessonSceneAssembly(input: { sceneId?: string | null; title?: string; slug?: string; fallbackSceneKind?: string }) {
  const scene = resolveLessonScene(input);
  const found = ASSEMBLIES.find((item) => item.sceneId === scene.sceneId);
  if (found) return found;

  return {
    sceneId: scene.sceneId,
    sceneKind: scene.sceneKind,
    orbitAnchor: [0, 0, 0],
    orbitScale: [1, 1, 1],
    orbitRotation: [0, 0, 0],
    accentLine: [[-3, 1, 0], [3, -1, 0]],
    sideClusterA: [[-2, -0.5, 1], [-1.2, -0.1, 1.4], [-0.8, 0.3, 1.8], [-0.4, 0.7, 2.2]],
    sideClusterB: [[2, -0.2, -1], [1.3, 0.2, -1.4], [0.7, 0.6, -1.8], [0.1, 1, -2.2]],
    motionEnvelope: { swingX: 0.12, swingY: 0.08, swingZ: 0.06, yaw: 0.16, pitch: 0.1, roll: 0.08 }
  } satisfies LessonSceneAssembly;
}
