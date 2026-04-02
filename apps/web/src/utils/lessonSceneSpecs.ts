import { listLessonScenes, resolveLessonScene } from './lessonSceneRegistry';

export type LessonSceneSpec = {
  sceneId: string;
  sceneKind: string;
  stageShape: 'disc' | 'runway' | 'slab' | 'basin' | 'vault' | 'spire';
  backdropStyle: 'arches' | 'panels' | 'columns' | 'rings' | 'helix' | 'constellation';
  heroShape: 'orb' | 'prism' | 'tower' | 'gate' | 'coil' | 'cradle';
  motionMode: 'drift' | 'pulse' | 'orbit' | 'sweep' | 'tilt' | 'helix';
  pedestalRadius: number;
  pedestalHeight: number;
  accentTilt: number;
  orbitLift: number;
  detailDensity: number;
};

const STAGE_SHAPES: LessonSceneSpec['stageShape'][] = ['disc', 'runway', 'slab', 'basin', 'vault', 'spire'];
const BACKDROP_STYLES: LessonSceneSpec['backdropStyle'][] = ['arches', 'panels', 'columns', 'rings', 'helix', 'constellation'];
const HERO_SHAPES: LessonSceneSpec['heroShape'][] = ['orb', 'prism', 'tower', 'gate', 'coil', 'cradle'];
const MOTION_MODES: LessonSceneSpec['motionMode'][] = ['drift', 'pulse', 'orbit', 'sweep', 'tilt', 'helix'];

const SCENE_SPECS = listLessonScenes().map((item, index) => {
  const family = Math.floor(index / STAGE_SHAPES.length);
  return {
    sceneId: item.sceneId,
    sceneKind: item.sceneKind,
    stageShape: STAGE_SHAPES[index % STAGE_SHAPES.length],
    backdropStyle: BACKDROP_STYLES[(index + family) % BACKDROP_STYLES.length],
    heroShape: HERO_SHAPES[(index + family * 2) % HERO_SHAPES.length],
    motionMode: MOTION_MODES[(index + family * 3) % MOTION_MODES.length],
    pedestalRadius: 2.4 + (index % 7) * 0.28,
    pedestalHeight: 0.22 + (index % 5) * 0.08,
    accentTilt: -18 + (index % 9) * 4,
    orbitLift: -0.4 + (index % 6) * 0.18,
    detailDensity: 5 + (index % 8)
  } satisfies LessonSceneSpec;
});

export function resolveLessonSceneSpec(input: { sceneId?: string | null; title?: string; slug?: string; fallbackSceneKind?: string }) {
  const scene = resolveLessonScene(input);
  const found = SCENE_SPECS.find((item) => item.sceneId === scene.sceneId);
  if (found) return found;

  return {
    sceneId: scene.sceneId,
    sceneKind: scene.sceneKind,
    stageShape: 'disc',
    backdropStyle: 'arches',
    heroShape: 'orb',
    motionMode: 'drift',
    pedestalRadius: 2.8,
    pedestalHeight: 0.24,
    accentTilt: 0,
    orbitLift: 0,
    detailDensity: 6
  } satisfies LessonSceneSpec;
}
