import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, Rewind, FastForward, RotateCcw, RotateCw, ArrowUpCircle, ArrowDownCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { generateLessonIllustration, getVisualProfile } from '../utils/visualProfiles';
import { resolveLessonScene } from '../utils/lessonSceneRegistry';
import { resolveLessonSceneSpec } from '../utils/lessonSceneSpecs';
import { resolveLessonSceneAssembly } from '../utils/lessonSceneAssemblies';
import { resolveLessonHeroDecor } from '../utils/lessonHeroDecorRegistry';
import { resolveLessonHeroStructure } from '../utils/lessonHeroStructures';
import { repairVietnameseText } from '../utils/repairVietnameseText';

type Props = {
  type?: string;
  params?: Record<string, number | string>;
  title: string;
  config?: Record<string, number | string | boolean | null | undefined>;
};

type CameraState = {
  yaw: number;
  pitch: number;
  distance: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
};

type StageHandles = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  motion: THREE.Group;
  orbit: THREE.Group;
  themeAccent: string;
};

type StageVariant = {
  seed: number;
  amplitude: number;
  speedFactor: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  hueShift: number;
  detail: number;
};

type SceneAnnotation = {
  label: string;
  note: string;
};

type ResolvedLessonScene = ReturnType<typeof resolveLessonScene>;

type SceneContext = {
  profile: ReturnType<typeof getVisualProfile>;
  sceneDef: ResolvedLessonScene;
  sceneKind: string;
  sceneId: string;
  sceneSpec: ReturnType<typeof resolveLessonSceneSpec>;
  sceneAssembly: ReturnType<typeof resolveLessonSceneAssembly>;
  heroDecor: ReturnType<typeof resolveLessonHeroDecor>;
  heroStructure: ReturnType<typeof resolveLessonHeroStructure>;
};

type ScenePresentation = {
  ringCount: number;
  sparkCount: number;
  showLabelBar: boolean;
  showBackdrop: boolean;
  showSignature: boolean;
  showAssemblyFrame: boolean;
  showHeroStructure: boolean;
  showHeroDecor: boolean;
  showMicroDetails: boolean;
  lessonMarkerCount: number;
};

type SimMetric = {
  label: string;
  value: string;
  hint: string;
};

type CameraPreset = {
  key: string;
  label: string;
  yaw: number;
  pitch: number;
  distance: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
};

type ParamControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
};

type OverlayChip = {
  key: string;
  label: string;
  value: string;
  x: number;
  y: number;
  color?: string;
};

type SimulationState = {
  time: number;
  duration: number;
  metrics: SimMetric[];
  overlays: OverlayChip[];
  vectors: Array<{ label: string; value: string; color: string }>;
};

function looksCorruptedText(value: unknown) {
  if (typeof value !== 'string') return false;
  return /Aƒ|A†|A¢|i¿½|\bundefined\b|\bnull\b/i.test(value);
}

function cleanUiText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || looksCorruptedText(trimmed)) return fallback;
  return trimmed;
}

function sceneLabelFor(sceneKind: string) {
  switch (sceneKind) {
    case 'linearRail': return 'Chuyen dong thang deu';
    case 'acceleratedCart': return 'Chuyen dong thang bien doi deu';
    case 'freeFallTower': return 'Su roi tu do';
    case 'circularRotor': return 'Chuyen dong tron deu';
    case 'forceBoard': return 'Tong hop luc';
    case 'newtonCart': return 'Dinh luat Newton';
    case 'inclinedPlane': return 'Mat phang nghieng';
    case 'springOscillator': return 'Con lac lo xo';
    case 'pendulum': return 'Con lac don';
    case 'waveTank': return 'Song co';
    case 'interferenceTank': return 'Giao thoa song';
    case 'standingString': return 'Song dung';
    case 'electricPlates': return 'Dien truong deu';
    case 'coulombCharges': return 'Luc Coulomb';
    case 'ohmCircuit': return 'Mach dien Ohm';
    case 'magneticHelix': return 'Luc Lorentz';
    case 'lensBench': return 'Thau kinh';
    case 'refractionTank': return 'Khuc xa anh sang';
    case 'eyeOptics': return 'Quang hoc mat';
    case 'thermalBox': return 'Nhiet hoc';
    case 'thermalIsothermal': return 'Qua trinh dang nhiet';
    case 'thermalIsobaric': return 'Qua trinh dang ap';
    case 'thermalState': return 'Phuong trinh trang thai';
    default: return 'Mo phong vat ly';
  }
}

function sceneFocusFor(sceneKind: string) {
  switch (sceneKind) {
    case 'linearRail': return 'Theo doi vi tri, van toc va do doc truc x theo thoi gian.';
    case 'acceleratedCart': return 'So sanh van toc tuc thoi voi gia toc khong doi.';
    case 'freeFallTower': return 'Quan sat do cao, van toc roi va moc thoi gian.';
    case 'circularRotor': return 'Lien he giua toc do dai, toc do goc va gia toc huong tam.';
    case 'forceBoard': return 'Phan tich cac luc thanh phan va hop luc.';
    case 'newtonCart': return 'Doi chieu hop luc, khoi luong va gia toc.';
    case 'inclinedPlane': return 'Tach trong luc thanh hai thanh phan theo mat phang.';
    case 'springOscillator': return 'Theo doi x, v, a va chu ki dao dong.';
    case 'pendulum': return 'Quan sat goc lech, chu ki va bien doi nang luong.';
    case 'waveTank': return 'Theo doi pha, buoc song va huong truyen song.';
    case 'interferenceTank': return 'So sanh hieu duong di va vi tri cuc dai, cuc tieu.';
    case 'standingString': return 'Xac dinh nut, bung va so bung song.';
    case 'electricPlates': return 'Quan sat huong dien truong va quy dao hat mang dien.';
    case 'coulombCharges': return 'Doi chieu dau dien tich, khoang cach va do lon luc.';
    case 'ohmCircuit': return 'Lien he giua U, I va R tren mach dien.';
    case 'magneticHelix': return 'Quan sat huong van toc, cam ung tu va luc Lorentz.';
    case 'lensBench': return 'Theo doi vi tri vat, anh, tieu cu va do phong dai.';
    case 'refractionTank': return 'So sanh goc toi, goc khuc xa va su doi huong tia sang.';
    case 'eyeOptics': return 'Theo doi vi tri anh tren mang luoi va cach dieu tiet.';
    case 'thermalBox': return 'Quan sat vi mo chat khi va su bien doi nhiet do.';
    case 'thermalIsothermal': return 'Theo doi quan he nghich giua p va V khi T khong doi.';
    case 'thermalIsobaric': return 'Theo doi su bien doi the tich khi ap suat duoc giu khong doi.';
    case 'thermalState': return 'Lien he giua p, V va T trong trang thai khi li tuong.';
    default: return 'Tap trung vao dai luong vat ly chinh va cach chung bien doi theo thoi gian.';
  }
}

function num(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function formatMetricValue(value: number, unit = '') {
  if (!Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${value.toFixed(digits)}${unit}`;
}

function firstString(input: unknown, fallback: string) {
  return typeof input === 'string' && input.trim() ? input.trim() : fallback;
}

function defaultCameraState(): CameraState {
  return { yaw: 0.84, pitch: 0.4, distance: 14, targetX: 0, targetY: 0, targetZ: 0 };
}

function cameraBoundsFor(sceneKind: string) {
  switch (sceneKind) {
    case 'linearRail':
    case 'acceleratedCart':
    case 'freeFallTower':
    case 'inclinedPlane':
    case 'ohmCircuit':
    case 'electricPlates':
    case 'coulombCharges':
    case 'refractionTank':
    case 'lensBench':
    case 'eyeOptics':
    case 'xrayTube':
      return {
        minDistance: 7,
        maxDistance: 20,
        panX: 7,
        panY: 4,
        panZ: 7
      };
    default:
      return {
        minDistance: 8,
        maxDistance: 22,
        panX: 6,
        panY: 4.5,
        panZ: 6
      };
  }
}

function cameraPresetsFor(sceneKind: string, bounds: ReturnType<typeof cameraBoundsFor>): CameraPreset[] {
  const home = defaultCameraState();
  const shared: CameraPreset[] = [
    { key: 'home', label: 'Mac dinh', ...home },
    { key: 'top', label: 'Top', yaw: 0.01, pitch: 1.08, distance: clamp(bounds.minDistance + 3, bounds.minDistance, bounds.maxDistance), targetX: 0, targetY: 0, targetZ: 0 },
    { key: 'side', label: 'Side', yaw: 1.57, pitch: 0.15, distance: clamp(bounds.minDistance + 4, bounds.minDistance, bounds.maxDistance), targetX: 0, targetY: 0.4, targetZ: 0 },
    { key: 'focus', label: 'Focus', yaw: 0.46, pitch: 0.32, distance: clamp(bounds.minDistance + 1.5, bounds.minDistance, bounds.maxDistance), targetX: 0, targetY: 0.6, targetZ: 0 }
  ];

  switch (sceneKind) {
    case 'freeFallTower':
      return [
        shared[0],
        { key: 'tower', label: 'Theo chieu cao', yaw: 0.28, pitch: 0.78, distance: clamp(bounds.minDistance + 6, bounds.minDistance, bounds.maxDistance), targetX: 0, targetY: 5, targetZ: 0 },
        shared[2],
        shared[3]
      ];
    case 'linearRail':
    case 'acceleratedCart':
    case 'inclinedPlane':
      return [
        shared[0],
        { key: 'track', label: 'Doc ray', yaw: 1.5, pitch: 0.2, distance: clamp(bounds.minDistance + 5, bounds.minDistance, bounds.maxDistance), targetX: 0, targetY: 0.8, targetZ: 0 },
        shared[1],
        shared[3]
      ];
    case 'lensBench':
    case 'refractionTank':
    case 'eyeOptics':
      return [
        shared[0],
        { key: 'optics', label: 'Mat phang quang', yaw: 1.57, pitch: 0.05, distance: clamp(bounds.minDistance + 2, bounds.minDistance, bounds.maxDistance), targetX: 0.8, targetY: 0.2, targetZ: 0 },
        shared[1],
        shared[3]
      ];
    default:
      return shared;
  }
}

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function createVariant(type: string, title: string, config: Record<string, unknown> = {}): StageVariant {
  const base = `${type}|${title}|${String(config.sceneVariant || '')}|${String(config.variantKey || '')}`;
  const seed = hashString(base || 'kntech-default');
  return {
    seed,
    amplitude: 0.78 + (seed % 9) * 0.06,
    speedFactor: 0.84 + ((seed >> 3) % 8) * 0.07,
    offsetX: (((seed >> 5) % 7) - 3) * 0.22,
    offsetY: (((seed >> 8) % 7) - 3) * 0.14,
    offsetZ: (((seed >> 11) % 7) - 3) * 0.18,
    hueShift: (seed % 45) - 22,
    detail: 8 + ((seed >> 14) % 10)
  };
}

function shiftColor(color: string, deg: number) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL((hsl.h + deg / 360 + 1) % 1, clamp(hsl.s * 0.98 + 0.01, 0, 1), clamp(hsl.l, 0.18, 0.82));
  return `#${c.getHexString()}`;
}

function themeFor(type: string, title: string, config: Record<string, unknown> = {}) {
  const profile = getVisualProfile(type);
  const variant = createVariant(type, title, config);
  const [bg, accent, soft] = profile.palette;
  return {
    bg: shiftColor(bg, Math.round(variant.hueShift * 0.55)),
    fog: shiftColor(soft, Math.round(variant.hueShift * 0.35)),
    accent: shiftColor(accent, variant.hueShift),
    accent2: shiftColor('#e2e8f0', Math.round(variant.hueShift * 0.2)),
    label: profile.displayLabel,
    variant
  };
}

function resolveSceneContext(type: string, title: string, config: Record<string, unknown> = {}): SceneContext {
  const profile = getVisualProfile(type);
  const sceneDef = resolveLessonScene({
    title: typeof config.lessonTitle === 'string' ? config.lessonTitle : title,
    slug: typeof config.lessonSlug === 'string' ? config.lessonSlug : undefined,
    sceneId: typeof config.sceneId === 'string' ? config.sceneId : null,
    fallbackSceneKind: profile.sceneKind
  });

  return {
    profile,
    sceneDef,
    sceneKind: sceneDef.sceneKind || profile.sceneKind,
    sceneId: sceneDef.sceneId,
    sceneSpec: resolveLessonSceneSpec({
      sceneId: sceneDef.sceneId,
      title: typeof config.lessonTitle === 'string' ? config.lessonTitle : title,
      slug: typeof config.lessonSlug === 'string' ? config.lessonSlug : undefined,
      fallbackSceneKind: sceneDef.sceneKind || profile.sceneKind
    }),
    sceneAssembly: resolveLessonSceneAssembly({
      sceneId: sceneDef.sceneId,
      title: typeof config.lessonTitle === 'string' ? config.lessonTitle : title,
      slug: typeof config.lessonSlug === 'string' ? config.lessonSlug : undefined,
      fallbackSceneKind: sceneDef.sceneKind || profile.sceneKind
    }),
    heroDecor: resolveLessonHeroDecor({
      sceneId: sceneDef.sceneId,
      title: typeof config.lessonTitle === 'string' ? config.lessonTitle : title,
      slug: typeof config.lessonSlug === 'string' ? config.lessonSlug : undefined,
      fallbackSceneKind: sceneDef.sceneKind || profile.sceneKind
    }),
    heroStructure: resolveLessonHeroStructure({
      sceneId: sceneDef.sceneId,
      title: typeof config.lessonTitle === 'string' ? config.lessonTitle : title,
      slug: typeof config.lessonSlug === 'string' ? config.lessonSlug : undefined,
      fallbackSceneKind: sceneDef.sceneKind || profile.sceneKind
    })
  };
}

function scenePresentation(sceneKind: string): ScenePresentation {
  switch (sceneKind) {
    case 'magnetField':
    case 'linearRail':
    case 'acceleratedCart':
    case 'freeFallTower':
    case 'inclinedPlane':
    case 'ohmCircuit':
    case 'electricPlates':
    case 'coulombCharges':
    case 'refractionTank':
    case 'lensBench':
    case 'eyeOptics':
    case 'xrayTube':
      return {
        ringCount: 0,
        sparkCount: 0,
        showLabelBar: false,
        showBackdrop: false,
        showSignature: false,
        showAssemblyFrame: false,
        showHeroStructure: false,
        showHeroDecor: false,
        showMicroDetails: false,
        lessonMarkerCount: 0
      };
    default:
      return {
        ringCount: 0,
        sparkCount: 0,
        showLabelBar: false,
        showBackdrop: false,
        showSignature: false,
        showAssemblyFrame: false,
        showHeroStructure: false,
        showHeroDecor: false,
        showMicroDetails: false,
        lessonMarkerCount: 0
      };
  }
}

function sceneAnnotations(sceneKind: string, config: Record<string, unknown> = {}): SceneAnnotation[] {
  if (Array.isArray(config.lessonComponents) && config.lessonComponents.length) {
    return (config.lessonComponents as Array<{ label?: string; note?: string }>)
      .map((item) => ({
        label: String(item.label || 'ThAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A nh phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n'),
        note: String(item.note || '')
      }))
      .filter((item) => item.label.trim() && item.note.trim());
  }
  switch (sceneKind) {
    case 'linearRail':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¡AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ Ray & xe', note: 'Xe chAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡y AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn ray. KhoAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ch tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc tAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng theo vAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ MAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A¦AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©i tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc v', note: 'VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc khAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¢i, quAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng: x = xAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬ + vAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t.' }
      ];
    case 'acceleratedCart':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ MAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A¦AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©i vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc (xanh)', note: 'VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc tAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n theo thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ai gian: v = vAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬ + aAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ MAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A¦AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©i gia tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc (cam)', note: 'Gia tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc khAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¢i vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºn: a = const. HAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng theo lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¢ng hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£p.' }
      ];
    case 'freeFallTower':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aº ThAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡p & thang AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œo h', note: 'MAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc chiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au cao chia AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ theo dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµi quAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang rAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡ VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t rAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i', note: 'RAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± do: h = AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A½gAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·tAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A², v = gAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t. BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A qua ma sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t khAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng khAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­.' }
      ];
    case 'circularRotor':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²n quAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o', note: 'BAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡n kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh r cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹nh. TAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A i v = AƒÆ’A†a€™Aƒa€sA‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A°AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·r.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t chuyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢n AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²n', note: 'Gia tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m a_ht = AƒÆ’A†a€™Aƒa€sA‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A°AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·r luAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´n hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A o tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m.' }
      ];
    case 'forceBoard':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ FAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A FAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ (xanh/lam)', note: 'Hai lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c thAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A nh phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡c dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ng thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ai lAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ F hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£p lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c (cam)', note: 'HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£p lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c = FAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A+FAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ (quy tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯c hAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¬nh bAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¬nh hAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A nh). GAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢y gia tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc.' }
      ];
    case 'newtonCart':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ LAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©o F (xanh)', note: 'LAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡c dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ng lAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t theo AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AL 2 Newton: a = F_net/m.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A LAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c ma sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t F_ms (cam)', note: 'Ma sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n chiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au chuyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢n AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng. AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AL 3: phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥t.' }
      ];
    case 'inclinedPlane':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ TrAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c P = mg', note: 'PhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ch thAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A nh PAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·sinAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± (dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ac mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng) vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A  PAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·cosAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± (vuAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng gAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³c).' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ PhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c N', note: 'N = PAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·cosAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±. LAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c ma sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t F_ms = AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¼N tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡c dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ng dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ac mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng.' }
      ];
    case 'gravityOrbit':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­AƒÆ’A¢a‚¬A¡Aƒa€sA‚A NgAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´i sao AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ khAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œi lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºn', note: 'LAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A  nguAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“n gAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A§a lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c hAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºt F = GmAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AmAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡/rAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A². AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¾ gAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m quay.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A HAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A nh tinh quAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o', note: 'LAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥p dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A«n cung cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥p lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ duy trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¬ quAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²n.' }
      ];
    case 'springMass':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A¢a‚¬A¡Aƒa€sA‚A° LAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A² xo (co giAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n)', note: 'F_dh = AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“kAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·x (AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AL Hooke). LAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c luAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´n hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n bAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A±ng.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A…a€œAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t nAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·ng m', note: 'Dao AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng SHM: x = AAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·cos(AƒÆ’A†a€™Aƒa€sA‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A°t), AƒÆ’A†a€™Aƒa€sA‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° = AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¡(k/m). BiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ A cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹nh.' }
      ];
    case 'pendulumArc':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ QuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ nAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·ng (con lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯c)', note: 'TAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i biAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn: v=0, thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿ nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng max. TAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡y: v=vmax, AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng max.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A¢a‚¬A¦AƒA¢A¢a€sA¬A…a€œ Cung AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang dao AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng', note: 'T = 2AƒÆ’A†a€™Aƒa€sA‚AAƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¡(l/g) AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A khAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ thuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢c m vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A  A (khi A nhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A).' }
      ];
    case 'travelingWave':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A¢a‚¬A¦AƒA¢A¢a€sA¬A…a€œ SAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng lan truyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚An', note: 'Pha sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng lan tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« nguAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“n. MAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚Ai AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢m dao AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng theo phAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ng ngang.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A BAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºc sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»', note: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A» = v/f. KhoAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ch giAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯a 2 AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢m cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ng pha liAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚An kAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A.' }
      ];
    case 'interferenceField':
      return [
        { label: 'SAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A SAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A hai nguAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“n', note: 'CAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ng tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ f, cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ng biAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢. PhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ng thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ai.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¦AƒA¢A¢a€sA¬A…a€œAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¦ VAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i/tiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢u', note: 'CAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i: dAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹AƒA¢A¢a€sA¬A‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢dAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A = kAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A». CAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c tiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢u: dAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹AƒA¢A¢a€sA¬A‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢dAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A = (k+AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A½)AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A».' }
      ];
    case 'standingWave':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ NAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºt sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng', note: 'AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢m biAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ bAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A±ng 0, AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©ng yAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn. Hai AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§u dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢y cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹nh lAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A  nAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºt.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ng sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng', note: 'AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢m dao AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡nh nhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥t. ChiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A i dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢y: L = nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»/2.' }
      ];
    case 'electricPlates':
      return [
        { label: '+ BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c dAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ng / AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n AƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m', note: 'AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n trAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang E AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« + sang AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“. E = U/d.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ch AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n q', note: 'BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c F = qAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·E theo chiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au trAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang nAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿u q>0. QuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o parabol.' }
      ];
    case 'coulombCharges':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ qAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A (AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A) / AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµ qAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ (lam)', note: 'KhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡c dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥u AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ hAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºt. CAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ng dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥u AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A©y. TAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡ 1/rAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A².' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A VectAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c F', note: 'F = kqAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AqAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡/rAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A². NAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A±m trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang nAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œi hai AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ch.' }
      ];
    case 'ohmCircuit':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ NguAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“n AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n EMF', note: 'Cung cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥p hiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡u AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿ U. DAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n I = U/R.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¨n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£i (AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n trAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸)', note: 'TiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªu thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng suAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥t P = UAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·I = IAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²R. AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ng ~ I.' }
      ];
    case 'magnetField':
      return [
        { label: 'N AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ S (cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c nam chAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m)', note: 'AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©c tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œi ra tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯c (N), AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œi vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A o cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c Nam (S).' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A¢a‚¬A¦AƒA¢A¢a€sA¬A…a€œ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©c tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A«', note: 'KhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©p kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­n. MAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©c biAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢u thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡nh |B|.' }
      ];
    case 'lorentzHelix':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ B tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« trAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang nAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚An', note: 'TAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« trAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ac trAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥c. CAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£m AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©ng tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« B = const.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A¢a‚¬A¦AƒA¢A¢a€sA¬A…a€œ HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ch AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n xoAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯n AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œc', note: 'F = qvAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AB. ThAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A nh phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n vAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¦Aƒa€sA‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥B tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²n, vAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥B tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o tiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿n dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ac.' }
      ];
    case 'inductionCoil':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡ CuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢n dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢y (solenoid)', note: 'Khi tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« thAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¦ biAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿n thiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ xuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥t hiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n suAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥t AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµ.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A¢a‚¬A¡Aƒa€sA‚A§AƒÆ’A¢a‚¬A¡Aƒa€sA‚A² Nam chAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m di chuyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢n', note: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµ = AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“dAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¦/dt (AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AL Faraday). ChiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²ng I theo quy tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯c Lenz.' }
      ];
    case 'rlcPanel':
      return [
        { label: 'R AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ L AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ C ba phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­', note: 'R tiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªu thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥; L vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A  C lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°u nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng; cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸ng khi Z_L = Z_C.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A¢a‚¬A¦AƒA¢A¢a€sA¬A…a€œ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ dao AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng', note: 'Khi cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸ng: I max, Z min = R. Pha AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n AƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡p = pha dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²ng.' }
      ];
    case 'transformerCore':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ LAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµi sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯t tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A«', note: 'DAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A«n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« thAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¦ giAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯a hai cuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢n. KhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n tiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿p xAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºc trAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c tiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿p.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡AƒÆ’A†a€™Aƒa€sA‚A£AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡ CuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢n sAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥p / thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A© cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥p', note: 'NAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A/NAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ = UAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A/UAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡. MAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡y lAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A½ tAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸ng: PAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A = PAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡.' }
      ];
    case 'refractionTank':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A MAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ch hai mAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´i trAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang', note: 'nAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AsinAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¸AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A = nAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡sinAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¸AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡. Tia gAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£y nhiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡n khi vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A o mt cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ n lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºn hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡n.' },
        { label: '| PhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡p tuyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿n', note: 'GAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³c tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºi AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¸AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A  gAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³c khAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºc xAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¸AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œo tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡p tuyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿n.' }
      ];
    case 'lensBench':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° ThAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥u kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢i tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ (f>0)', note: 'Tia qua quang tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œi thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng. Tia song song hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢i tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i F.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t / AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢nh', note: '1/f = 1/d + 1/d\'. AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢nh thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t khi d>f. AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢nh AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£o khi d<f.' }
      ];
    case 'eyeOptics':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ ThAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A§y tinh thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ (lens)', note: 'AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au tiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿t AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ dAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ch tiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªu AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢m. CAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­n thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹: f quAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ ngAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯n AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£nh trAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºc VM.' },
        { label: '| VAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµng mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡c (retina)', note: 'AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢nh rAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµ khi AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢m hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢i tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¡NG trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn vAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµng mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡c. CAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh bAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ nAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿u lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡ch.' }
      ];
    case 'magnifierLens':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° KAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh lAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºp (thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥u kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢i tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥)', note: 'VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·t trong tiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªu cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± (d < f). Tia lAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n kAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢nh AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£o phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i', note: 'AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢nh lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºn hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡n, cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ng chiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Au vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºi vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t. G = AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚A/f (mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯t thAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A° giAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n).' }
      ];
    case 'microscopeRig':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh (tiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªu cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A nhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A)', note: 'TAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£nh thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t AAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚ABAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºn cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A§a vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t nhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° ThAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh (tiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªu cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºn hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡n)', note: 'LAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A m kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh lAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºp quan sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t AAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚ABAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A. G = LAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚A/(fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡).' }
      ];
    case 'telescopeRig':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh (fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A rAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥t lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºn)', note: 'Thu chAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹m tia song song tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A« vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t xa AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£nh thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i tiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªu AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢m.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° ThAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh (fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ nhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A)', note: 'NgAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯m AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£nh trung gian. BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢i giAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡c G = fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A/fAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡ (mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯t thAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A° giAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n).' }
      ];
    case 'photoelectricCell':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¼ Catot kim loAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i', note: 'Electron bAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©t ra khi nhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­n photon cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ hAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A½ AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A°AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ A (cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng thoAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t).' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹Aƒa€¦A¢a‚¬A“AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¡Aƒa€sA‚A¬ Photon AƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡nh sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ng', note: 'NAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng: AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµ = hAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A½. ChAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A° tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ quyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿t AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹nh khAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng bAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©t eAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A».' }
      ];
    case 'bohrAtom':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n (proton+neutron)', note: 'Mang AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n dAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ng Ze. HAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºt electron theo lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c Coulomb.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ QuAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡o electron n=1,2,3...', note: 'Electron nhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£y mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©c phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t/hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥p thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥ photon: hAƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A½ = E_n2 AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹AƒA¢A¢a€sA¬A‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ E_n1.' }
      ];
    case 'decayChamber':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A…a€œAƒÆ’A¢a‚¬A¡Aƒa€sA‚A  HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng xAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¹', note: 'HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n khAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ng bAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚An. PhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n rAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ alpha, beta hoAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·c gamma.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ng xAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t ra', note: 'HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± (AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A´AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A‚A¡He), AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A» (eAƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A»), AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ (photon nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng cao).' }
      ];
    case 'nuclearReaction':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t bAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¯n phAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡', note: 'HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºi va chAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡m vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºi hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ch. PhAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£i cAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A³ ngAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ng nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¦AƒA¢A¢a€sA¬A…a€œAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¦ SAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A©m phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£n AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©ng', note: 'BAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A£o toAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A n sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ khAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œi A, sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ch Z, nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng, AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng.' }
      ];
    case 'nuclearCluster':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A°AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ Proton (AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A)', note: 'HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t mang AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡n +e trong hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n. SAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ proton Z = nguyAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ sAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œ.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aª Neutron (xAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡m)', note: 'HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t trung hAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²a. N = A AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A¢a‚¬A¹AƒA¢A¢a€sA¬A‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a‚¬A¾A‚A¢ Z. GiAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aºp AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¢n AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹nh hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n qua lAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A±c mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡nh.' }
      ];
    case 'bindingWell':
      return [
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¦A¢a‚¬A“ GiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿ng thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿ nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng', note: 'HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t liAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn kAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿t nAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A±m AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¦Aƒa€sA‚A¸ mAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©c nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng AƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m so vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºi trAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ng thAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i tAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A± do.' },
        { label: 'AƒÆ’A†a€™Aƒa€sA‚A¢AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬AƒA¢A¢a€sA¬A‚AAƒÆ’A¢a‚¬A¡Aƒa€sA‚A HAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t liAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn kAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿t', note: 'CAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A§n nAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ng lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng liAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aªn kAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¿t AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AE = AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚AmAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A·cAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A² AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡ch khAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ai hAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t nhAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢n.' }
      ];
    default:
      return [
        { label: 'VAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A­t thAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢ chAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­nh', note: 'AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A¢a‚¬A¡Aƒa€sA‚AAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡i lAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A£ng trung tAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¢m cAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚A§a mAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A´ phAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A¡Aƒa€sA‚Ang.' },
        { label: 'DAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A¥u hiAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡u quan sAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¡t', note: 'Theo dAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚Aµi hAƒÆ’A†a€™AƒA¢A¢a€sA¬A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°AƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Aºng chuyAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A¢a‚¬A AƒA¢A¢a€sA¬A¢a€zA¢n AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a€sA¬A…A¾Aƒa€sA‚A¢ng, chu kAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¬ hoAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·c vAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¹ trAƒÆ’A†a€™Aƒa€ A¢a‚¬a„¢AƒÆ’A¢a‚¬A¡Aƒa€sA‚A­ AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¾AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€¹A…a€œAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚AºAƒÆ’A¢a‚¬A¡Aƒa€sA‚A·c biAƒÆ’A†a€™Aƒa€sA‚A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚A¡t.' }
      ];
  }
}

function sceneAnnotationsSafe(sceneKind: string): SceneAnnotation[] {
  switch (sceneKind) {
    case 'linearRail':
      return [
        { label: 'Xe vA  ray', note: 'Vaº­t chuya»ƒn A‘a»™ng da»c theo ma»™t tra»¥c cA³ ma»‘c chia A‘a»ƒ A‘a»c va»‹ trA­.' },
        { label: 'Vaº­n ta»‘c khA´ng A‘a»•i', note: 'Ma»—i khoaº£ng tha»i gian baº±ng nhau thA¬ vaº­t A‘i A‘Æ°a»£c quA£ng A‘Æ°a»ng baº±ng nhau.' }
      ];
    case 'acceleratedCart':
      return [
        { label: 'MA©i tAªn vaº­n ta»‘c', note: 'Aa»™ dA i mA©i tAªn thay A‘a»•i theo v = v0 + a.t.' },
        { label: 'Gia ta»‘c', note: 'Gia ta»‘c A‘Æ°a»£c gia»¯ khA´ng A‘a»•i trong sua»‘t quA¡ trA¬nh mA´ pha»ng.' }
      ];
    case 'freeFallTower':
      return [
        { label: 'Vaº­t rÆ¡i', note: 'Ba» qua sa»©c caº£n khA´ng khA­, vaº­n ta»‘c tAƒng A‘a»u theo tha»i gian.' },
        { label: 'ThA¡p A‘a»™ cao', note: 'Ma»‘c chia»u cao giAºp A‘a»‘i chiaº¿u quA£ng A‘Æ°a»ng rÆ¡i vA  A‘a»™ cao cA²n laº¡i.' }
      ];
    case 'circularRotor':
      return [
        { label: 'BA¡n kA­nh quay', note: 'BA¡n kA­nh quyaº¿t A‘a»‹nh ma»‘i liAªn ha»‡ gia»¯a omega, v vA  a hÆ°a»›ng tA¢m.' },
        { label: 'Gia ta»‘c hÆ°a»›ng tA¢m', note: 'Vector gia ta»‘c luA´n hÆ°a»›ng va» tA¢m quay, khA´ng cA¹ng hÆ°a»›ng va»›i v.' }
      ];
    case 'springOscillator':
      return [
        { label: 'Va»‹ trA­ cA¢n baº±ng', note: 'Aa»™ la»‡ch kha»i va»‹ trA­ cA¢n baº±ng quyaº¿t A‘a»‹nh la»±c ha»“i pha»¥c.' },
        { label: 'NAƒng lÆ°a»£ng dao A‘a»™ng', note: 'Aa»™ng nAƒng vA  thaº¿ nAƒng biaº¿n A‘a»•i qua laº¡i theo chu kA¬.' }
      ];
    case 'pendulum':
      return [
        { label: 'GA³c la»‡ch', note: 'BiAªn A‘a»™ gA³c nha» cho phA©p dA¹ng cA´ng tha»©c xaº¥p xa»‰ dao A‘a»™ng A‘ia»u hA²a.' },
        { label: 'Chu kA¬', note: 'Chu kA¬ pha»¥ thua»™c cha»§ yaº¿u vA o chia»u dA i dA¢y vA  gia ta»‘c tra»ng trÆ°a»ng.' }
      ];
    case 'waveTank':
      return [
        { label: 'Ngua»“n sA³ng', note: 'Ngua»“n dao A‘a»™ng taº¡o ra cA¡c maº·t sA³ng lan truya»n trong mA´i trÆ°a»ng.' },
        { label: 'Pha sA³ng', note: 'CA¡c A‘ia»ƒm cA¹ng pha cA¡ch nhau ma»™t sa»‘ nguyAªn laº§n bÆ°a»›c sA³ng.' }
      ];
    case 'interferenceTank':
      return [
        { label: 'Hai ngua»“n kaº¿t ha»£p', note: 'Hai ngua»“n cA¹ng taº§n sa»‘ vA  A‘a»™ la»‡ch pha a»•n A‘a»‹nh taº¡o giao thoa.' },
        { label: 'Vaº¡ch ca»±c A‘aº¡i ca»±c tia»ƒu', note: 'Hia»‡u A‘Æ°a»ng A‘i quyaº¿t A‘a»‹nh va»‹ trA­ tAƒng cÆ°a»ng hay tria»‡t tiAªu.' }
      ];
    case 'standingString':
      return [
        { label: 'NAºt sA³ng', note: 'NAºt lA  A‘ia»ƒm luA´n cA³ biAªn A‘a»™ baº±ng 0.' },
        { label: 'Ba»¥ng sA³ng', note: 'Ba»¥ng lA  A‘ia»ƒm cA³ biAªn A‘a»™ dao A‘a»™ng ca»±c A‘aº¡i.' }
      ];
    case 'electricPlates':
      return [
        { label: 'Baº£n ca»±c', note: 'Aia»‡n trÆ°a»ng A‘a»u gia»¯a hai baº£n song song hÆ°a»›ng ta»« dÆ°Æ¡ng sang A¢m.' },
        { label: 'Haº¡t mang A‘ia»‡n', note: 'Qua»¹ A‘aº¡o pha»¥ thua»™c daº¥u A‘ia»‡n tA­ch, vaº­n ta»‘c A‘aº§u vA  cÆ°a»ng A‘a»™ A‘ia»‡n trÆ°a»ng.' }
      ];
    case 'coulombCharges':
      return [
        { label: 'Hai A‘ia»‡n tA­ch A‘ia»ƒm', note: 'La»±c Coulomb tAƒng khi A‘ia»‡n tA­ch la»›n hÆ¡n vA  khoaº£ng cA¡ch nha» hÆ¡n.' },
        { label: 'HÆ°a»›ng la»±c', note: 'CA¹ng daº¥u A‘aº©y nhau, khA¡c daº¥u hAºt nhau trAªn A‘Æ°a»ng na»‘i tA¢m.' }
      ];
    case 'ohmCircuit':
      return [
        { label: 'Ngua»“n vA  A‘ia»‡n tra»Y', note: 'Aa»™ la»›n dA²ng A‘ia»‡n thay A‘a»•i theo I = U/R.' },
        { label: 'Aa»“ tha»‹ A‘aº¡i lÆ°a»£ng', note: 'Theo dAµi A‘a»“ng tha»i hia»‡u A‘ia»‡n thaº¿, dA²ng A‘ia»‡n vA  cA´ng suaº¥t.' }
      ];
    case 'magneticHelix':
      return [
        { label: 'Vaº­n ta»‘c ban A‘aº§u', note: 'ThA nh phaº§n song song B gia»¯ chuya»ƒn A‘a»™ng thaº³ng, thA nh phaº§n vuA´ng gA³c taº¡o quay trA²n.' },
        { label: 'La»±c Lorentz', note: 'La»±c ta»« luA´n vuA´ng gA³c va»›i caº£ v vA  B nAªn khA´ng sinh cA´ng.' }
      ];
    case 'lensBench':
      return [
        { label: 'Vaº­t vA  aº£nh', note: 'Va»‹ trA­ aº£nh thay A‘a»•i theo cA´ng tha»©c 1/f = 1/d + 1/dphaº©y.' },
        { label: 'TiAªu ca»±', note: 'TiAªu ca»± quyaº¿t A‘a»‹nh khaº£ nAƒng ha»™i ta»¥ hay phA¢n kA¬ ca»§a ha»‡ quang ha»c.' }
      ];
    case 'refractionTank':
      return [
        { label: 'Maº·t phA¢n cA¡ch', note: 'Tia sA¡ng A‘a»•i hÆ°a»›ng khi A‘i qua hai mA´i trÆ°a»ng cA³ chiaº¿t suaº¥t khA¡c nhau.' },
        { label: 'Aa»‹nh luaº­t Snell', note: 'n1 sin i = n2 sin r cho phA©p tA­nh gA³c khAºc xaº¡.' }
      ];
    case 'thermalIsothermal':
      return [
        { label: 'Nhia»‡t A‘a»™ khA´ng A‘a»•i', note: 'Trong sua»‘t quA¡ trA¬nh, T A‘Æ°a»£c gia»¯ ca»‘ A‘a»‹nh A‘a»ƒ quan sA¡t quan ha»‡ p-V.' },
        { label: 'Ap suaº¥t vA  tha»ƒ tA­ch', note: 'Khi V tAƒng thA¬ p giaº£m theo quy luaº­t Boyle-Mariotte.' }
      ];
    case 'thermalIsobaric':
      return [
        { label: 'Ap suaº¥t khA´ng A‘a»•i', note: 'Ha»‡ A‘Æ°a»£c A‘ia»u khia»ƒn A‘a»ƒ gia»¯ p khA´ng A‘a»•i trong khi T biaº¿n thiAªn.' },
        { label: 'Aa»™ na»Y nhia»‡t', note: 'Tha»ƒ tA­ch tAƒng khi nhia»‡t A‘a»™ tuya»‡t A‘a»‘i tAƒng.' }
      ];
    case 'thermalState':
      return [
        { label: 'Traº¡ng thA¡i khA­', note: 'Ba A‘aº¡i lÆ°a»£ng p, V, T rA ng bua»™c nhau trong cA¹ng ma»™t ha»‡.' },
        { label: 'Biaº¿n A‘a»•i thA´ng sa»‘', note: 'Thay A‘a»•i ma»™t A‘aº¡i lÆ°a»£ng saº½ lA m cA¡c A‘aº¡i lÆ°a»£ng cA²n laº¡i phaº£n a»©ng theo mA´ hA¬nh.' }
      ];
    default:
      return [
        { label: 'Vaº­t tha»ƒ chA­nh', note: 'ThA nh phaº§n trung tA¢m ca»§a mA´ pha»ng A‘Æ°a»£c theo dAµi baº±ng overlay vA  metric.' },
        { label: 'Aaº¡i lÆ°a»£ng caº§n quan sA¡t', note: 'Taº­p trung vA o cA¡c vector, tham sa»‘ vA  timeline a»Y bAªn dÆ°a»›i canvas.' }
      ];
  }
}

function simulationMetrics(sceneKind: string, params: Record<string, number | string>, speed: number, camera: CameraState, running: boolean): SimMetric[] {
  const base: SimMetric[] = [
    { label: 'Trang thai', value: running ? 'Dang chay' : 'Tam dung', hint: 'Doi ngay khi ban pause/play mo phong.' },
    { label: 'Toc do', value: `x${speed.toFixed(2)}`, hint: 'Nhanh/cham chi anh huong nhip xem, khong doi cong thuc vat ly goc.' },
    { label: 'Camera', value: formatMetricValue(camera.distance), hint: 'Khoang cach camera den tam scene hien tai.' }
  ];

  switch (sceneKind) {
    case 'linearRail': {
      const v = num(params.v, 6);
      return [
        { label: 'Van toc v', value: formatMetricValue(v, ' m/s'), hint: 'Chuyen dong thang deu nen v khong doi theo thoi gian.' },
        { label: 'Quang duong/giay', value: formatMetricValue(v, ' m'), hint: 'Moi 1 giay vat di them mot doan bang v.' },
        ...base
      ];
    }
    case 'acceleratedCart': {
      const v0 = num(params.v0, 1);
      const a = num(params.a, 2);
      return [
        { label: 'Van toc dau', value: formatMetricValue(v0, ' m/s'), hint: 'Gia tri van toc tai t = 0.' },
        { label: 'Gia toc a', value: formatMetricValue(a, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), hint: 'Gia toc khong doi trong chuyen dong bien doi deu.' },
        { label: 'Tang v moi giay', value: formatMetricValue(a, ' m/s'), hint: 'Moi giay van toc tang them a.' },
        ...base
      ];
    }
    case 'freeFallTower': {
      const g = num(params.g, 9.81);
      const h0 = num(params.h0, 30);
      return [
        { label: 'Do cao h0', value: formatMetricValue(h0, ' m'), hint: 'Moc chieu cao ban dau cua vat truoc khi roi.' },
        { label: 'Gia toc g', value: formatMetricValue(g, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), hint: 'Neu bo qua can khong khi thi vat tang toc deu theo g.' },
        ...base
      ];
    }
    case 'thermalParticles': {
      const temperature = num(params.temperature, 300);
      const particles = Math.round(num(params.particles, 18));
      const volume = Math.max(num(params.volume, 1.2), 0.4);
      return [
        { label: 'Nhiet do T', value: formatMetricValue(temperature, ' K'), hint: 'Nhiet do cao hon nghia la dong nang trung binh cua phan tu lon hon.' },
        { label: 'So phan tu', value: String(particles), hint: 'Tang mat do hat giup nhin ro hon tan suat va cham.' },
        { label: 'The tich V', value: formatMetricValue(volume, ' m^3'), hint: 'The tich binh chua quy dinh mat do va quang duong tu do trung binh.' },
        ...base
      ];
    }
    case 'isothermalPiston': {
      const temperature = num(params.temperature, 300);
      const volume = Math.max(num(params.volume, 1.4), 0.4);
      const pressure = temperature / volume;
      return [
        { label: 'Nhiet do T', value: formatMetricValue(temperature, ' K'), hint: 'Qua trinh dang nhiet giu T khong doi.' },
        { label: 'The tich V', value: formatMetricValue(volume, ' m^3'), hint: 'Piston thay doi V trong khi nhiet do duoc khoa.' },
        { label: 'Ap suat p', value: formatMetricValue(pressure, ' arb'), hint: 'Khi T khong doi, p bien thien ty le nghich voi V.' },
        ...base
      ];
    }
    case 'isobaricPiston': {
      const pressure = Math.max(num(params.pressure, 1), 0.2);
      const temperature = num(params.temperature, 320);
      const volume = Math.max(num(params.volume, 1.3), 0.4);
      return [
        { label: 'Ap suat p', value: formatMetricValue(pressure, ' atm'), hint: 'Qua trinh dang ap giu p gan nhu khong doi.' },
        { label: 'Nhiet do T', value: formatMetricValue(temperature, ' K'), hint: 'Tang T se day piston di len neu p duoc giu on dinh.' },
        { label: 'The tich V', value: formatMetricValue(volume, ' m^3'), hint: 'V ty le thuan voi T tuyet doi khi p va n khong doi.' },
        ...base
      ];
    }
    case 'stateEquationChamber': {
      const pressure = Math.max(num(params.pressure, 1.1), 0.2);
      const temperature = num(params.temperature, 320);
      const volume = Math.max(num(params.volume, 1.2), 0.3);
      const moles = Math.max(num(params.moles, 1), 0.1);
      return [
        { label: 'Ap suat p', value: formatMetricValue(pressure, ' atm'), hint: 'Ap suat den tu va cham vi mo len thanh binh.' },
        { label: 'The tich V', value: formatMetricValue(volume, ' m^3'), hint: 'Thong so hinh hoc cua buong khi.' },
        { label: 'pV/(nT)', value: formatMetricValue((pressure * volume) / (moles * Math.max(temperature, 1))), hint: 'Gia tri nay on dinh khi mo phong bam theo pV = nRT.' },
        ...base
      ];
    }
    case 'springMass': {
      const k = num(params.k, 25);
      const m = num(params.m, 0.5);
      const A = num(params.A, 6);
      const omega = Math.sqrt(Math.max(k / Math.max(m, 0.001), 0));
      return [
        { label: 'Bien do A', value: formatMetricValue(A, ' cm'), hint: 'Do lech lon nhat cua vat so voi vi tri can bang.' },
        { label: 'Tan so goc', value: formatMetricValue(omega, ' rad/s'), hint: 'Con lac lo xo ly tuong co omega = sqrt(k/m).' },
        { label: 'Chu ki T', value: formatMetricValue((2 * Math.PI) / Math.max(omega, 0.001), ' s'), hint: 'Thoi gian de vat lap lai trang thai dao dong.' },
        ...base
      ];
    }
    case 'pendulumArc': {
      const l = num(params.l, 2);
      const g = num(params.g, 9.81);
      return [
        { label: 'Chieu dai l', value: formatMetricValue(l, ' m'), hint: 'Thong so chinh chi phoi chu ki con lac don.' },
        { label: 'Chu ki T', value: formatMetricValue(2 * Math.PI * Math.sqrt(Math.max(l, 0.001) / Math.max(g, 0.001)), ' s'), hint: 'Dung khi goc lech nho, bo qua luc can.' },
        ...base
      ];
    }
    case 'electricPlates': {
      const e = num(params.E, 120);
      const q = num(params.q, 1);
      return [
        { label: 'Cuong do E', value: formatMetricValue(e, ' V/m'), hint: 'Dien truong deu giua hai ban cuc song song.' },
        { label: 'Luc dien qE', value: formatMetricValue(q * e, ' N'), hint: 'Luc tac dung len hat mang dien trong mo phong ly tuong.' },
        ...base
      ];
    }
    case 'coulombCharges': {
      const q1 = num(params.q1, 2);
      const q2 = num(params.q2, -2);
      const r = Math.max(num(params.r, 4), 0.3);
      return [
        { label: 'Khoang cach r', value: formatMetricValue(r, ' m'), hint: 'Luc Coulomb giam rat nhanh khi r tang.' },
        { label: 'Dau q1.q2', value: q1 * q2 >= 0 ? 'Cung dau' : 'Trai dau', hint: 'Cung dau day, trai dau hut.' },
        { label: 'Ti le luc', value: formatMetricValue((q1 * q2) / (r * r)), hint: 'Gia tri ty le voi q1q2/rAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A², bo qua hang so k de doc xu huong.' },
        ...base
      ];
    }
    case 'ohmCircuit': {
      const u = num(params.u, 12);
      const r = Math.max(num(params.r, 6), 0.1);
      const i = u / r;
      return [
        { label: 'Hieu dien the U', value: formatMetricValue(u, ' V'), hint: 'Nguon cung cap su chenh lech dien the cho mach.' },
        { label: 'Dong dien I', value: formatMetricValue(i, ' A'), hint: 'Theo dinh luat Ohm: I = U/R.' },
        { label: 'Cong suat P', value: formatMetricValue(u * i, ' W'), hint: 'Cong suat tieu thu tren tai cua mach.' },
        ...base
      ];
    }
    case 'lensBench': {
      const f = num(params.f, 12);
      const d = Math.max(num(params.doVat, 24), 0.2);
      const imageDistance = Math.abs(d - f) < 0.001 ? Infinity : (f * d) / (d - f);
      return [
        { label: 'Tieu cu f', value: formatMetricValue(f, ' cm'), hint: 'Dau moc de dung cac tia dac biet khi dung anh.' },
        { label: 'Khoang vat d', value: formatMetricValue(d, ' cm'), hint: 'Khoang cach tu vat den thau kinh.' },
        { label: 'Khoang anh dAƒÆ’A†a€™Aƒa€¦A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¼', value: Number.isFinite(imageDistance) ? formatMetricValue(imageDistance, ' cm') : 'Vo cuc', hint: 'Tinh theo cong thuc thau kinh mong 1/f = 1/d + 1/dAƒÆ’A†a€™Aƒa€¦A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¼.' },
        ...base
      ];
    }
    default:
      return base;
  }
}

function interactionTips(sceneKind: string): string[] {
  const shared = [
    'Lan chuot de zoom, keo chuot trai de orbit, Shift hoac chuot phai de pan.',
    'Doi goc nhin Top/Side/Focus de doc nhanh quy luat theo tung bai.'
  ];
  switch (sceneKind) {
    case 'linearRail':
    case 'acceleratedCart':
      return [...shared, 'Canh ben giup doc chuyen dong theo truc x ro hon so voi goc mac dinh.'];
    case 'freeFallTower':
      return [...shared, 'Goc Theo chieu cao giup so sanh vi tri vat voi thap do va moc h0.'];
    case 'lensBench':
    case 'refractionTank':
    case 'eyeOptics':
      return [...shared, 'Goc Mat phang quang hoc giup theo doi tia toi, phap tuyen va diem hoi tu chinh xac hon.'];
    default:
      return shared;
  }
}

function parameterControlsFor(sceneKind: string): ParamControl[] {
  switch (sceneKind) {
    case 'linearRail':
      return [{ key: 'v', label: 'Van toc', min: 1, max: 20, step: 0.5, unit: 'm/s' }];
    case 'acceleratedCart':
      return [
        { key: 'v0', label: 'v0', min: 0, max: 12, step: 0.5, unit: 'm/s' },
        { key: 'a', label: 'Gia toc', min: 0.2, max: 8, step: 0.1, unit: 'm/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²' }
      ];
    case 'freeFallTower':
      return [
        { key: 'h0', label: 'Do cao', min: 5, max: 60, step: 1, unit: 'm' },
        { key: 'g', label: 'g', min: 1, max: 20, step: 0.1, unit: 'm/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²' }
      ];
    case 'circularRotor':
      return [
        { key: 'r', label: 'Ban kinh', min: 1, max: 8, step: 0.2, unit: 'm' },
        { key: 'omega', label: 'Omega', min: 0.2, max: 4, step: 0.1, unit: 'rad/s' }
      ];
    case 'thermalParticles':
      return [
        { key: 'temperature', label: 'Nhiet do', min: 200, max: 700, step: 10, unit: 'K' },
        { key: 'particles', label: 'So hat', min: 8, max: 30, step: 1, unit: '' },
        { key: 'volume', label: 'The tich', min: 0.6, max: 2.2, step: 0.1, unit: 'm^3' }
      ];
    case 'isothermalPiston':
      return [
        { key: 'temperature', label: 'Nhiet do', min: 250, max: 500, step: 10, unit: 'K' },
        { key: 'volume', label: 'The tich', min: 0.6, max: 2.6, step: 0.1, unit: 'm^3' },
        { key: 'moles', label: 'So mol', min: 0.5, max: 2, step: 0.1, unit: 'mol' }
      ];
    case 'isobaricPiston':
      return [
        { key: 'pressure', label: 'Ap suat', min: 0.6, max: 2, step: 0.1, unit: 'atm' },
        { key: 'temperature', label: 'Nhiet do', min: 250, max: 650, step: 10, unit: 'K' },
        { key: 'volume', label: 'The tich', min: 0.6, max: 2.6, step: 0.1, unit: 'm^3' }
      ];
    case 'stateEquationChamber':
      return [
        { key: 'pressure', label: 'Ap suat', min: 0.6, max: 2.2, step: 0.1, unit: 'atm' },
        { key: 'temperature', label: 'Nhiet do', min: 220, max: 700, step: 10, unit: 'K' },
        { key: 'volume', label: 'The tich', min: 0.5, max: 2.4, step: 0.1, unit: 'm^3' },
        { key: 'moles', label: 'So mol', min: 0.5, max: 2, step: 0.1, unit: 'mol' }
      ];
    case 'springMass':
      return [
        { key: 'A', label: 'Bien do', min: 1, max: 12, step: 0.5, unit: 'cm' },
        { key: 'k', label: 'Do cung k', min: 5, max: 50, step: 1, unit: 'N/m' },
        { key: 'm', label: 'Khoi luong', min: 0.1, max: 2, step: 0.1, unit: 'kg' }
      ];
    case 'pendulumArc':
      return [
        { key: 'l', label: 'Chieu dai', min: 0.5, max: 4, step: 0.1, unit: 'm' },
        { key: 'angle', label: 'Goc lech', min: 4, max: 35, step: 1, unit: 'deg' }
      ];
    case 'travelingWave':
      return [
        { key: 'A', label: 'Bien do', min: 0.5, max: 4, step: 0.1, unit: 'cm' },
        { key: 'lambda', label: 'Buoc song', min: 1, max: 8, step: 0.2, unit: 'm' },
        { key: 'v', label: 'Toc do song', min: 1, max: 10, step: 0.2, unit: 'm/s' }
      ];
    case 'interferenceField':
      return [
        { key: 'A', label: 'Bien do', min: 0.5, max: 4, step: 0.1, unit: 'cm' },
        { key: 'lambda', label: 'Buoc song', min: 1, max: 8, step: 0.2, unit: 'm' },
        { key: 'd', label: 'Khoang hai nguon', min: 1, max: 10, step: 0.2, unit: 'm' }
      ];
    case 'standingWave':
      return [
        { key: 'A', label: 'Bien do', min: 0.5, max: 4, step: 0.1, unit: 'cm' },
        { key: 'lambda', label: 'Buoc song', min: 1, max: 8, step: 0.2, unit: 'm' }
      ];
    case 'electricPlates':
      return [
        { key: 'E', label: 'Dien truong', min: 20, max: 240, step: 5, unit: 'V/m' },
        { key: 'q', label: 'Dien tich', min: -3, max: 3, step: 0.5, unit: 'C' }
      ];
    case 'coulombCharges':
      return [
        { key: 'q1', label: 'q1', min: -5, max: 5, step: 0.5, unit: 'C' },
        { key: 'q2', label: 'q2', min: -5, max: 5, step: 0.5, unit: 'C' },
        { key: 'r', label: 'Khoang cach', min: 1, max: 10, step: 0.2, unit: 'm' }
      ];
    case 'ohmCircuit':
      return [
        { key: 'u', label: 'Dien ap', min: 1, max: 24, step: 0.5, unit: 'V' },
        { key: 'r', label: 'Dien tro', min: 1, max: 20, step: 0.5, unit: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A©' }
      ];
    case 'lensBench':
      return [
        { key: 'f', label: 'Tieu cu', min: 4, max: 24, step: 0.5, unit: 'cm' },
        { key: 'doVat', label: 'Khoang vat', min: 5, max: 50, step: 0.5, unit: 'cm' }
      ];
    default:
      return [];
  }
}

function simulationDuration(sceneKind: string, params: Record<string, number | string>) {
  switch (sceneKind) {
    case 'freeFallTower':
      return clamp(Math.sqrt((2 * Math.max(num(params.h0, 30), 1)) / Math.max(num(params.g, 9.81), 0.1)) * 1.2, 2, 12);
    case 'circularRotor':
      return clamp((2 * Math.PI) / Math.max(num(params.omega, 1.6), 0.1) * 2, 3, 18);
    case 'thermalParticles':
    case 'isothermalPiston':
    case 'isobaricPiston':
    case 'stateEquationChamber':
      return 12;    case 'springMass': {
      const omega = Math.sqrt(Math.max(num(params.k, 25) / Math.max(num(params.m, 0.5), 0.05), 0.1));
      return clamp((2 * Math.PI) / omega * 2, 3, 14);
    }
    case 'pendulumArc':
      return clamp(2 * Math.PI * Math.sqrt(Math.max(num(params.l, 2), 0.2) / 9.81) * 2, 3, 16);
    case 'travelingWave':
    case 'interferenceField':
    case 'standingWave':
      return 12;
    default:
      return 10;
  }
}

function simulationStateFor(sceneKind: string, params: Record<string, number | string>, time: number, speed: number, running: boolean, camera: CameraState): SimulationState {
  const duration = simulationDuration(sceneKind, params);
  const t = clamp(time, 0, duration);
  const baseMetrics: SimMetric[] = [
    { label: 'Trang thai', value: running ? 'Dang chay' : 'Tam dung', hint: 'Ban co the pause, scrub timeline hoac doi tham so ngay tren bai hoc.' },
    { label: 'Timeline', value: `${formatMetricValue(t, ' s')} / ${formatMetricValue(duration, ' s')}`, hint: 'Thoi diem hien tai cua mo phong vat ly.' },
    { label: 'Toc do', value: `x${speed.toFixed(2)}`, hint: 'He so tua nhanh/cham cho nhin hien tuong de hon.' }
  ];

  switch (sceneKind) {
    case 'linearRail': {
      const v = num(params.v, 6);
      const x = v * t;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Vi tri x', value: formatMetricValue(x, ' m'), hint: 'Chuyen dong thang deu: x = v.t neu chon x0 = 0.' },
          { label: 'Van toc v', value: formatMetricValue(v, ' m/s'), hint: 'Do lon va huong khong doi trong suot qua trinh.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'v', value: formatMetricValue(v, ' m/s'), color: '#2563eb' }],
        overlays: [
          { key: 'object', label: 'Xe', value: `x = ${formatMetricValue(x, ' m')}`, x: 22 + clamp((x / Math.max(v * duration, 1)) * 56, 0, 56), y: 62, color: '#2563eb' },
          { key: 'velocity', label: 'v', value: formatMetricValue(v, ' m/s'), x: 72, y: 28, color: '#0f172a' }
        ]
      };
    }
    case 'acceleratedCart': {
      const v0 = num(params.v0, 1);
      const a = num(params.a, 2);
      const v = v0 + a * t;
      const x = v0 * t + 0.5 * a * t * t;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Vi tri x', value: formatMetricValue(x, ' m'), hint: 'x = v0.t + 1/2.a.tAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A² khi chon moc x0 = 0.' },
          { label: 'Van toc v', value: formatMetricValue(v, ' m/s'), hint: 'Van toc tang deu theo t: v = v0 + a.t.' },
          { label: 'Gia toc a', value: formatMetricValue(a, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), hint: 'Gia toc duoc giu hang trong mo phong nay.' },
          ...baseMetrics
        ],
        vectors: [
          { label: 'v', value: formatMetricValue(v, ' m/s'), color: '#2563eb' },
          { label: 'a', value: formatMetricValue(a, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), color: '#f97316' }
        ],
        overlays: [
          { key: 'cart', label: 'Xe', value: `x = ${formatMetricValue(x, ' m')}`, x: 18 + clamp((x / Math.max(v0 * duration + 0.5 * a * duration * duration, 1)) * 60, 0, 60), y: 64, color: '#2563eb' },
          { key: 'accel', label: 'a', value: formatMetricValue(a, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), x: 76, y: 26, color: '#f97316' }
        ]
      };
    }
    case 'freeFallTower': {
      const h0 = Math.max(num(params.h0, 30), 1);
      const g = Math.max(num(params.g, 9.81), 0.1);
      const h = Math.max(h0 - 0.5 * g * t * t, 0);
      const v = g * t;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Do cao h', value: formatMetricValue(h, ' m'), hint: 'h = h0 - 1/2.g.tAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A² khi vat roi xuong.' },
          { label: 'Van toc roi', value: formatMetricValue(v, ' m/s'), hint: 'Do lon van toc tang deu: v = g.t.' },
          { label: 'Gia toc g', value: formatMetricValue(g, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), hint: 'Gia toc trong truong duoc coi la khong doi.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'g', value: formatMetricValue(g, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), color: '#f97316' }],
        overlays: [
          { key: 'ball', label: 'Vat roi', value: `h = ${formatMetricValue(h, ' m')}`, x: 62, y: 18 + (1 - h / h0) * 56, color: '#2563eb' },
          { key: 'velocity', label: 'v', value: formatMetricValue(v, ' m/s'), x: 78, y: 62, color: '#0f172a' }
        ]
      };
    }
    case 'circularRotor': {
      const r = Math.max(num(params.r, 4), 0.2);
      const omega = Math.max(num(params.omega, 1.6), 0.1);
      const angle = omega * t;
      const v = omega * r;
      const aHt = omega * omega * r;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Goc quay', value: formatMetricValue(angle, ' rad'), hint: 'Goc quay bien thien deu theo theta = omega.t.' },
          { label: 'Toc do dai', value: formatMetricValue(v, ' m/s'), hint: 'v = omega.r trong chuyen dong tron deu.' },
          { label: 'Gia toc huong tam', value: formatMetricValue(aHt, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), hint: 'a_ht = omegaAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A².r va luon huong ve tam quay.' },
          ...baseMetrics
        ],
        vectors: [
          { label: 'v', value: formatMetricValue(v, ' m/s'), color: '#2563eb' },
          { label: 'a_ht', value: formatMetricValue(aHt, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), color: '#f97316' }
        ],
        overlays: [
          { key: 'rotor', label: 'Vat quay', value: `AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¸ = ${formatMetricValue(angle, ' rad')}`, x: 50 + Math.cos(angle) * 20, y: 50 + Math.sin(angle) * 20, color: '#2563eb' },
          { key: 'radius', label: 'r', value: formatMetricValue(r, ' m'), x: 50, y: 24, color: '#0f172a' }
        ]
      };
    }
    case 'springMass': {
      const a = num(params.A, 6) / 100;
      const k = num(params.k, 25);
      const m = Math.max(num(params.m, 0.5), 0.05);
      const omega = Math.sqrt(k / m);
      const x = a * Math.cos(omega * t);
      const v = -a * omega * Math.sin(omega * t);
      const acc = -omega * omega * x;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Li do x', value: formatMetricValue(x * 100, ' cm'), hint: 'x = A.cos(omega.t).' },
          { label: 'Van toc v', value: formatMetricValue(v, ' m/s'), hint: 'v lech pha pi/2 so voi li do.' },
          { label: 'Gia toc a', value: formatMetricValue(acc, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), hint: 'a = -omegaAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A².x, huong ve vi tri can bang.' },
          { label: 'Chu ki T', value: formatMetricValue((2 * Math.PI) / omega, ' s'), hint: 'T = 2.pi.sqrt(m/k).' },
          ...baseMetrics
        ],
        vectors: [
          { label: 'v', value: formatMetricValue(v, ' m/s'), color: '#2563eb' },
          { label: 'a', value: formatMetricValue(acc, ' m/sAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A²'), color: '#f97316' }
        ],
        overlays: [
          { key: 'mass', label: 'Vat m', value: `x = ${formatMetricValue(x * 100, ' cm')}`, x: 50 + x * 380, y: 62, color: '#2563eb' },
          { key: 'spring', label: 'Lo xo', value: `T = ${formatMetricValue((2 * Math.PI) / omega, ' s')}`, x: 18, y: 28, color: '#0f172a' }
        ]
      };
    }
    case 'pendulumArc': {
      const l = Math.max(num(params.l, 2), 0.2);
      const theta0 = num(params.angle, 18) * Math.PI / 180;
      const omega = Math.sqrt(9.81 / l);
      const theta = theta0 * Math.cos(omega * t);
      const linearV = l * theta0 * omega * Math.sin(omega * t);
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Goc lech', value: formatMetricValue(theta * 180 / Math.PI, ' deg'), hint: 'Gan dung goc nho: theta = theta0.cos(omega.t).' },
          { label: 'Van toc cung', value: formatMetricValue(linearV, ' m/s'), hint: 'Do lon van toc lon nhat khi qua vi tri can bang.' },
          { label: 'Chu ki T', value: formatMetricValue((2 * Math.PI) / omega, ' s'), hint: 'T = 2.pi.sqrt(l/g), khong phu thuoc khoi luong.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'v', value: formatMetricValue(linearV, ' m/s'), color: '#2563eb' }],
        overlays: [
          { key: 'bob', label: 'Qua nang', value: `AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¸ = ${formatMetricValue(theta * 180 / Math.PI, 'AƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A°')}`, x: 50 + Math.sin(theta) * 24, y: 42 + (1 - Math.cos(theta)) * 28, color: '#2563eb' },
          { key: 'period', label: 'T', value: formatMetricValue((2 * Math.PI) / omega, ' s'), x: 14, y: 24, color: '#0f172a' }
        ]
      };
    }
    case 'travelingWave': {
      const amplitude = num(params.A, 2);
      const lambda = Math.max(num(params.lambda, 4), 0.2);
      const waveSpeed = Math.max(num(params.v, 6), 0.1);
      const frequency = waveSpeed / lambda;
      const phase = (2 * Math.PI * (t * frequency)) / 1;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Bien do A', value: formatMetricValue(amplitude, ' cm'), hint: 'Do lech cuc dai cua moi phan tu moi truong.' },
          { label: 'Tan so f', value: formatMetricValue(frequency, ' Hz'), hint: 'f = v/lambda cho song co truyen deu.' },
          { label: 'Pha nguon', value: formatMetricValue(phase, ' rad'), hint: 'Pha song dich chuyen theo thoi gian va huong truyen.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'v_song', value: formatMetricValue(waveSpeed, ' m/s'), color: '#2563eb' }],
        overlays: [
          { key: 'source', label: 'Nguon song', value: `A = ${formatMetricValue(amplitude, ' cm')}`, x: 16, y: 52, color: '#2563eb' },
          { key: 'lambda', label: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»', value: formatMetricValue(lambda, ' m'), x: 48, y: 24, color: '#0f172a' },
          { key: 'speed', label: 'v', value: formatMetricValue(waveSpeed, ' m/s'), x: 80, y: 60, color: '#f97316' }
        ]
      };
    }
    case 'interferenceField': {
      const amplitude = num(params.A, 2);
      const lambda = Math.max(num(params.lambda, 4), 0.2);
      const d = Math.max(num(params.d, 6), 0.2);
      const pathDiff = Math.abs(Math.sin((2 * Math.PI * t) / duration)) * d * 0.5;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Khoang hai nguon', value: formatMetricValue(d, ' m'), hint: 'd chi phoi khoang van va mien giao thoa.' },
          { label: 'Hieu duong di', value: formatMetricValue(pathDiff, ' m'), hint: 'Dung de so sanh dieu kien cuc dai/cuc tieu giao thoa.' },
          { label: 'Dieu kien cuc dai', value: `AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Ad = k.${formatMetricValue(lambda, ' m')}`, hint: 'Hai song den cung pha tao cuc dai giao thoa.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Ad', value: formatMetricValue(pathDiff, ' m'), color: '#2563eb' }],
        overlays: [
          { key: 's1', label: 'S1', value: `A = ${formatMetricValue(amplitude, ' cm')}`, x: 28, y: 48, color: '#2563eb' },
          { key: 's2', label: 'S2', value: `A = ${formatMetricValue(amplitude, ' cm')}`, x: 72, y: 48, color: '#2563eb' },
          { key: 'delta', label: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A‚A¢AƒA¢A¢a‚¬A¡A‚A¬Aƒa€sA‚Ad', value: formatMetricValue(pathDiff, ' m'), x: 50, y: 20, color: '#f97316' }
        ]
      };
    }
    case 'standingWave': {
      const amplitude = num(params.A, 3);
      const lambda = Math.max(num(params.lambda, 4), 0.2);
      const nodeSpacing = lambda / 2;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Khoang nut', value: formatMetricValue(nodeSpacing, ' m'), hint: 'Hai nut lien tiep cach nhau lambda/2.' },
          { label: 'Khoang nut-bung', value: formatMetricValue(lambda / 4, ' m'), hint: 'Tu nut den bung gan nhat la lambda/4.' },
          { label: 'Bien do cuc dai', value: formatMetricValue(amplitude, ' cm'), hint: 'Bung song dat bien do dao dong lon nhat.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»/2', value: formatMetricValue(nodeSpacing, ' m'), color: '#2563eb' }],
        overlays: [
          { key: 'node', label: 'Nut', value: formatMetricValue(nodeSpacing, ' m'), x: 26, y: 55, color: '#0f172a' },
          { key: 'antinode', label: 'Bung', value: formatMetricValue(amplitude, ' cm'), x: 50, y: 38, color: '#2563eb' },
          { key: 'lambda', label: 'AƒÆ’A†a€™Aƒa€¦A‚A½AƒÆ’A¢a‚¬A¡Aƒa€sA‚A»', value: formatMetricValue(lambda, ' m'), x: 76, y: 20, color: '#f97316' }
        ]
      };
    }
    case 'electricPlates': {
      const e = num(params.E, 120);
      const q = num(params.q, 1);
      const force = q * e;
      const y = 0.5 * force * 0.002 * t * t;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Luc dien', value: formatMetricValue(force, ' N'), hint: 'Luc dien trong mo hinh ly tuong: F = q.E.' },
          { label: 'Lech quy dao', value: formatMetricValue(y, ' m'), hint: 'Hat lech theo chieu cua luc dien tac dung.' },
          { label: 'Cuong do E', value: formatMetricValue(e, ' V/m'), hint: 'Gia tri dien truong giua hai ban song song.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'F = qE', value: formatMetricValue(force, ' N'), color: '#f97316' }],
        overlays: [
          { key: 'particle', label: 'Hat q', value: `F = ${formatMetricValue(force, ' N')}`, x: 38 + t / duration * 34, y: 50 - clamp(y * 20, -18, 18), color: '#2563eb' },
          { key: 'field', label: 'E', value: formatMetricValue(e, ' V/m'), x: 80, y: 20, color: '#0f172a' }
        ]
      };
    }
    case 'coulombCharges': {
      const q1 = num(params.q1, 2);
      const q2 = num(params.q2, -2);
      const r = Math.max(num(params.r, 4), 0.2);
      const forceRatio = (q1 * q2) / (r * r);
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Khoang cach r', value: formatMetricValue(r, ' m'), hint: 'Luc dien giam theo quy luat 1/rAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A².' },
          { label: 'Xu huong', value: q1 * q2 >= 0 ? 'Day nhau' : 'Hut nhau', hint: 'Cung dau day nhau, trai dau hut nhau.' },
          { label: 'Ty le luc', value: formatMetricValue(forceRatio), hint: 'Gia tri ty le voi q1.q2/rAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A², dung de so sanh xu huong.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'F', value: formatMetricValue(forceRatio), color: '#f97316' }],
        overlays: [
          { key: 'q1', label: 'q1', value: formatMetricValue(q1, ' C'), x: 28, y: 56, color: '#ef4444' },
          { key: 'q2', label: 'q2', value: formatMetricValue(q2, ' C'), x: 72, y: 56, color: '#2563eb' },
          { key: 'r', label: 'r', value: formatMetricValue(r, ' m'), x: 50, y: 26, color: '#0f172a' }
        ]
      };
    }
    case 'ohmCircuit': {
      const u = num(params.u, 12);
      const r = Math.max(num(params.r, 6), 0.1);
      const i = u / r;
      const p = u * i;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Dong dien I', value: formatMetricValue(i, ' A'), hint: 'Theo dinh luat Ohm: I = U/R.' },
          { label: 'Cong suat P', value: formatMetricValue(p, ' W'), hint: 'P = U.I = IAƒÆ’A†a€™AƒA¢A¢a€sA¬A…A¡AƒÆ’A¢a‚¬A¡Aƒa€sA‚A².R.' },
          { label: 'Hieu dien the U', value: formatMetricValue(u, ' V'), hint: 'Nguon cap dien cho toan mach.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'I', value: formatMetricValue(i, ' A'), color: '#2563eb' }],
        overlays: [
          { key: 'source', label: 'Nguon', value: formatMetricValue(u, ' V'), x: 20, y: 24, color: '#0f172a' },
          { key: 'load', label: 'Tai', value: `P = ${formatMetricValue(p, ' W')}`, x: 70, y: 58, color: '#2563eb' }
        ]
      };
    }
    case 'lensBench': {
      const f = num(params.f, 12);
      const d = Math.max(num(params.doVat, 24), 0.2);
      const imageDistance = Math.abs(d - f) < 0.001 ? Number.POSITIVE_INFINITY : (f * d) / (d - f);
      const magnification = Number.isFinite(imageDistance) ? -imageDistance / d : 0;
      return {
        time: t,
        duration,
        metrics: [
          { label: 'Khoang anh dAƒÆ’A†a€™Aƒa€¦A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¼', value: Number.isFinite(imageDistance) ? formatMetricValue(imageDistance, ' cm') : 'Vo cuc', hint: 'Tinh tu cong thuc thau kinh mong.' },
          { label: 'Do boi giac', value: Number.isFinite(magnification) ? formatMetricValue(magnification) : '--', hint: 'k = -dAƒÆ’A†a€™Aƒa€¦A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¼/d cho anh that/ao trong quy uoc co ban.' },
          { label: 'Tieu cu f', value: formatMetricValue(f, ' cm'), hint: 'Thong so quang hoc cot loi cua thau kinh.' },
          ...baseMetrics
        ],
        vectors: [{ label: 'Tia toi', value: `f = ${formatMetricValue(f, ' cm')}`, color: '#2563eb' }],
        overlays: [
          { key: 'object', label: 'Vat', value: `d = ${formatMetricValue(d, ' cm')}`, x: 24, y: 60, color: '#0f172a' },
          { key: 'lens', label: 'Thau kinh', value: `f = ${formatMetricValue(f, ' cm')}`, x: 50, y: 26, color: '#2563eb' },
          { key: 'image', label: 'Anh', value: Number.isFinite(imageDistance) ? `dAƒÆ’A†a€™Aƒa€¦A‚A AƒÆ’A¢a‚¬A¡Aƒa€sA‚A¼ = ${formatMetricValue(imageDistance, ' cm')}` : 'Anh o vo cuc', x: 74, y: 52, color: '#f97316' }
        ]
      };
    }
    default:
      return { time: t, duration, metrics: baseMetrics, overlays: [], vectors: [] };
  }
}


function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children[0] as THREE.Mesh | THREE.Group;
    group.remove(child);
    const mesh = child as THREE.Mesh;
    if ((mesh as any).geometry?.dispose) (mesh as any).geometry.dispose();
    const material = (mesh as any).material;
    if (Array.isArray(material)) material.forEach((m) => m?.dispose?.());
    else material?.dispose?.();
  }
}

function material(color: string, emissive = '#000000', metalness = 0.22, roughness = 0.42) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive });
}

function addArrow(parent: THREE.Group, color: string, position: [number, number, number], rotation: [number, number, number], scale = 1) {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 1.1 * scale, 12), material(color));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, 0.45 * scale, 18), material(color));
  head.position.y = 0.72 * scale;
  const g = new THREE.Group();
  g.add(shaft, head);
  g.position.set(...position);
  g.rotation.set(...rotation);
  parent.add(g);
}

function tubeFromPoints(points: THREE.Vector3[], color: string, radius = 0.08) {
  return new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 140, radius, 14, false),
    material(color, '#000000', 0.15, 0.28)
  );
}

function addFloor(motion: THREE.Group, theme: ReturnType<typeof themeFor>, presentation: ScenePresentation) {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 72),
    new THREE.MeshStandardMaterial({ color: theme.fog, roughness: 0.95, metalness: 0.04 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.1;
  motion.add(floor);

  const ringCount = presentation.ringCount;
  for (let i = 0; i < ringCount; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.2 + i * 1.55, 0.025, 10, 80),
      material(i % 2 === 0 ? shiftColor(theme.accent, 18) : shiftColor(theme.accent2, -8), '#000000', 0.04, 0.95)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.02 + i * 0.002;
    motion.add(ring);
  }

  const grid = new THREE.GridHelper(24, 16, Number('0x94a3b8'), Number('0xe2e8f0'));
  grid.position.y = -2.04;
  motion.add(grid);
}

function addLabelBar(motion: THREE.Group, theme: ReturnType<typeof themeFor>) {
  const axis = new THREE.AxesHelper(4.8);
  axis.position.set(-8.5, -2.03, -8.2);
  motion.add(axis);
  const labelBar = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.18, 0.8), material(theme.accent));
  labelBar.position.set(0, 3.25, -7.8);
  motion.add(labelBar);
}

function addSparkField(motion: THREE.Group, theme: ReturnType<typeof themeFor>, presentation: ScenePresentation) {
  const count = presentation.sparkCount;
  for (let i = 0; i < count; i += 1) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 + (i % 3) * 0.015, 8, 8),
      material(i % 2 === 0 ? shiftColor(theme.accent, 14) : shiftColor(theme.accent2, -12), '#000000', 0.05, 0.7)
    );
    particle.position.set(
      -6 + (i % 6) * 2.2 + theme.variant.offsetX,
      -0.8 + ((i * 7) % 6) * 0.6 + theme.variant.offsetY,
      -4 + ((i * 13) % 7) * 1.2 + theme.variant.offsetZ
    );
    motion.add(particle);
  }
}

function sceneSeed(sceneId: string) {
  return hashString(sceneId || 'scene-default');
}

function sceneBand(sceneId: string, modulo: number, shift = 0) {
  return ((sceneSeed(sceneId) >> shift) % modulo + modulo) % modulo;
}

function addScenePedestal(motion: THREE.Group, sceneContext: SceneContext, theme: ReturnType<typeof themeFor>) {
  const spec = sceneContext.sceneSpec;
  switch (spec.stageShape) {
    case 'runway': {
      const platform = new THREE.Mesh(new THREE.BoxGeometry(10.5, spec.pedestalHeight, 3.4), material(shiftColor(theme.fog, -8)));
      platform.position.set(0, -1.92 + spec.pedestalHeight / 2, 0);
      platform.rotation.y = THREE.MathUtils.degToRad(spec.accentTilt * 0.3);
      motion.add(platform);
      break;
    }
    case 'slab': {
      const platform = new THREE.Mesh(new THREE.BoxGeometry(7.8, spec.pedestalHeight, 7.8), material(shiftColor(theme.fog, 8)));
      platform.position.set(0, -1.92 + spec.pedestalHeight / 2, 0);
      platform.rotation.y = THREE.MathUtils.degToRad(spec.accentTilt * 0.4);
      motion.add(platform);
      break;
    }
    case 'basin': {
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(spec.pedestalRadius + 1.2, spec.pedestalRadius + 0.5, spec.pedestalHeight + 0.3, 40, 1, true),
        new THREE.MeshPhysicalMaterial({ color: shiftColor(theme.fog, -12), transmission: 0.18, transparent: true, opacity: 0.18, roughness: 0.18 })
      );
      platform.position.set(0, -1.72, 0);
      motion.add(platform);
      break;
    }
    case 'vault': {
      const platform = new THREE.Mesh(
        new THREE.TorusGeometry(spec.pedestalRadius + 0.8, spec.pedestalHeight * 0.4 + 0.12, 14, 52),
        material(shiftColor(theme.fog, 16))
      );
      platform.rotation.x = Math.PI / 2;
      platform.position.y = -1.7;
      motion.add(platform);
      break;
    }
    case 'spire': {
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(spec.pedestalRadius * 0.9, spec.pedestalRadius * 1.35, spec.pedestalHeight + 0.95, 24),
        material(shiftColor(theme.fog, -18))
      );
      platform.position.set(0, -1.58, 0);
      motion.add(platform);
      break;
    }
    default: {
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(spec.pedestalRadius + 0.8, spec.pedestalRadius + 0.8, spec.pedestalHeight, 36),
        material(shiftColor(theme.fog, 4))
      );
      platform.position.set(0, -1.92 + spec.pedestalHeight / 2, 0);
      motion.add(platform);
      break;
    }
  }
}

function addSceneBackdrop(motion: THREE.Group, sceneContext: SceneContext, theme: ReturnType<typeof themeFor>) {
  const sceneId = sceneContext.sceneId;
  const spec = sceneContext.sceneSpec;
  const seed = sceneSeed(sceneId);
  const archCount = 2 + (seed % 3);
  const panelCount = 3 + ((seed >> 4) % 4);
  const columnCount = 2 + ((seed >> 8) % 4);

  if (spec.backdropStyle === 'arches' || spec.backdropStyle === 'rings') {
    for (let i = 0; i < archCount; i += 1) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(3.4 + i * 1.1 + ((seed >> (i + 2)) % 4) * 0.12, 0.07, 12, 72, spec.backdropStyle === 'rings' ? Math.PI * 2 : Math.PI),
        material(i % 2 === 0 ? shiftColor(theme.accent, 12 + i * 6) : shiftColor(theme.accent2, -10 - i * 4), '#000000', 0.06, 0.84)
      );
      arch.rotation.z = spec.backdropStyle === 'rings' ? Math.PI / 2 : Math.PI;
      arch.position.set(0, -0.2 + i * 0.55, -6.4 + i * 0.16);
      motion.add(arch);
    }
  }

  if (spec.backdropStyle === 'panels' || spec.backdropStyle === 'constellation') {
    for (let i = 0; i < panelCount; i += 1) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.1 + (i % 2) * 0.35, 2.1 + ((seed >> (i + 6)) % 4) * 0.25, 0.18),
        material(i % 2 === 0 ? shiftColor(theme.fog, 6 + i * 4) : shiftColor(theme.bg, -8 - i * 4), '#000000', 0.14, 0.82)
      );
      panel.position.set(-6 + i * (12 / Math.max(panelCount - 1, 1)), -0.4 + ((seed >> (i + 10)) % 5) * 0.28, -5.7);
      panel.rotation.y = spec.backdropStyle === 'constellation' ? THREE.MathUtils.degToRad(-20 + i * 8) : 0;
      motion.add(panel);
    }
  }

  if (spec.backdropStyle === 'columns' || spec.backdropStyle === 'helix') {
    for (let i = 0; i < columnCount; i += 1) {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18 + (i % 3) * 0.03, 0.22 + (i % 3) * 0.03, 2.6 + ((seed >> (i + 14)) % 3) * 0.6, 14),
        material(shiftColor(theme.accent, -14 + i * 10), '#000000', 0.18, 0.58)
      );
      column.position.set(-4.5 + i * 3, -0.4 + i * 0.12, 5.4);
      column.rotation.z = spec.backdropStyle === 'helix' ? THREE.MathUtils.degToRad(i * 11) : 0;
      motion.add(column);
    }
  }

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(5.8 + ((seed >> 18) % 4) * 0.35, 0.05, 10, 90),
    material(shiftColor(theme.accent2, sceneBand(sceneId, 30, 20) - 15), '#000000', 0.08, 0.9)
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = -1.78;
  motion.add(halo);
}

function addSceneSignature(motion: THREE.Group, sceneContext: SceneContext, theme: ReturnType<typeof themeFor>) {
  const sceneId = sceneContext.sceneId;
  const spec = sceneContext.sceneSpec;
  const seed = sceneSeed(sceneId);
  switch (spec.heroShape) {
    case 'cradle': {
      const helix = tubeFromPoints(
        Array.from({ length: 60 }).map((_, i) => {
          const t = i * 0.18;
          return new THREE.Vector3(-5.2 + i * 0.18, 2.5 + Math.sin(t) * 0.55, -2.6 + Math.cos(t) * 0.55);
        }),
        shiftColor(theme.accent, 20),
        0.045
      );
      motion.add(helix);
      break;
    }
    case 'prism': {
      for (let i = 0; i < 5; i += 1) {
        const prism = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 1.2 + i * 0.22, 0.28),
          material(shiftColor(theme.accent2, -12 + i * 8))
        );
        prism.position.set(-5.4 + i * 0.68, -0.8 + i * 0.35, 3.5);
        prism.rotation.z = THREE.MathUtils.degToRad(12 + i * 7);
        motion.add(prism);
      }
      break;
    }
    case 'gate': {
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.18, 28),
        material(shiftColor(theme.accent, -18), '#000000', 0.1, 0.5)
      );
      disc.rotation.x = Math.PI / 2;
      disc.position.set(-4.8, 0.6, -2.8);
      motion.add(disc);
      break;
    }
    case 'coil': {
      const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.9 + ((seed >> 22) % 3) * 0.12, 0.14, 90, 12, 2, 5),
        material(shiftColor(theme.accent, 8), '#000000', 0.16, 0.48)
      );
      knot.position.set(4.7, 1.2, -2.3);
      motion.add(knot);
      break;
    }
    case 'tower': {
      for (let i = 0; i < 4; i += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.7 + i * 0.36, 0.03, 10, 56),
          material(i % 2 === 0 ? theme.accent : theme.accent2)
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(5.2, -0.5 + i * 0.25, 3.2);
        motion.add(ring);
      }
      break;
    }
    default: {
      const poly = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.9 + (seed % 3) * 0.2, 0),
        material(shiftColor(theme.accent, -6), '#000000', 0.24, 0.38)
      );
      poly.position.set(4.6, 0.8, 3.4);
      motion.add(poly);
      break;
    }
  }
}

function addLessonComponentDetail(motion: THREE.Group, sceneContext: SceneContext, config: Record<string, unknown>, theme: ReturnType<typeof themeFor>, presentation: ScenePresentation) {
  const components = Array.isArray(config.lessonComponents)
    ? (config.lessonComponents as Array<{ label?: string; note?: string }>)
    : [];
  const seed = sceneSeed(sceneContext.sceneId);
  const radius = sceneContext.sceneSpec.pedestalRadius + 1.4;

  components.slice(0, presentation.lessonMarkerCount).forEach((item, index) => {
    const angle = ((Math.PI * 2) / Math.max(components.length, 3)) * index + ((seed >> (index + 3)) % 10) * 0.03;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = -0.7 + index * 0.18;
    const motif = (index + sceneBand(sceneContext.sceneId, 6, index + 4)) % 6;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2 + index * 0.02, 0.28 + index * 0.02, 0.5 + index * 0.08, 16),
      material(index % 2 === 0 ? shiftColor(theme.accent, index * 8) : shiftColor(theme.accent2, -index * 6))
    );
    base.position.set(x, y - 0.35, z);
    motion.add(base);

    let marker: THREE.Mesh;
    switch (motif) {
      case 0:
        marker = new THREE.Mesh(new THREE.SphereGeometry(0.24 + index * 0.03, 18, 18), material(shiftColor(theme.accent, 20 - index * 3)));
        break;
      case 1:
        marker = new THREE.Mesh(new THREE.BoxGeometry(0.36 + index * 0.03, 0.36 + index * 0.04, 0.36), material(shiftColor(theme.accent2, index * 6)));
        break;
      case 2:
        marker = new THREE.Mesh(new THREE.ConeGeometry(0.24 + index * 0.02, 0.5 + index * 0.05, 16), material(shiftColor(theme.accent, -14 + index * 4)));
        break;
      case 3:
        marker = new THREE.Mesh(new THREE.TorusGeometry(0.22 + index * 0.03, 0.05, 10, 28), material(shiftColor(theme.accent2, 10 - index * 2)));
        marker.rotation.x = Math.PI / 2;
        break;
      case 4:
        marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.24 + index * 0.03, 0), material(shiftColor(theme.accent, index * 5)));
        break;
      default:
        marker = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 + index * 0.03, 0), material(shiftColor(theme.accent2, -10 + index * 5)));
        break;
    }

    marker.position.set(x, y, z);
    marker.rotation.y = angle;
    marker.name = `lesson-component-${index}`;
    motion.add(marker);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5 + index * 0.05, 10),
      material('#e2e8f0', '#000000', 0.1, 0.72)
    );
    stem.position.set(x, y + 0.28, z);
    motion.add(stem);

    const glyph = new THREE.Mesh(
      new THREE.BoxGeometry(0.12 + String(item.label || '').length * 0.012, 0.08, 0.08),
      material(shiftColor(theme.fog, 16))
    );
    glyph.position.set(x, y + 0.58 + index * 0.03, z);
    glyph.rotation.y = angle * 0.5;
    motion.add(glyph);
  });
}

function addSceneMicroDetails(motion: THREE.Group, sceneContext: SceneContext, theme: ReturnType<typeof themeFor>) {
  const density = sceneContext.sceneSpec.detailDensity;
  const seed = sceneSeed(sceneContext.sceneId);
  for (let i = 0; i < density; i += 1) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(0.12 + (i % 3) * 0.08, 0.1 + (i % 4) * 0.04, 0.18 + (i % 2) * 0.06),
      material(i % 2 === 0 ? shiftColor(theme.accent, i * 4) : shiftColor(theme.accent2, -i * 3), '#000000', 0.12, 0.55)
    );
    shard.position.set(
      -5.5 + ((seed >> (i + 1)) % 110) * 0.1,
      -1.45 + ((seed >> (i + 7)) % 12) * 0.08,
      -4.8 + ((seed >> (i + 11)) % 90) * 0.1
    );
    shard.rotation.set(
      THREE.MathUtils.degToRad((seed >> (i + 2)) % 50),
      THREE.MathUtils.degToRad((seed >> (i + 5)) % 90),
      THREE.MathUtils.degToRad((seed >> (i + 8)) % 70)
    );
    motion.add(shard);
  }
}

function addSceneAssemblyFrame(motion: THREE.Group, sceneContext: SceneContext, theme: ReturnType<typeof themeFor>) {
  const assembly = sceneContext.sceneAssembly;
  const accent = tubeFromPoints(
    [new THREE.Vector3(...assembly.accentLine[0]), new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(...assembly.accentLine[1])],
    shiftColor(theme.accent, 14),
    0.05
  );
  motion.add(accent);

  assembly.sideClusterA.forEach((point, index) => {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(0.18 + index * 0.05, 0.22 + index * 0.06, 0.18),
      material(index % 2 === 0 ? shiftColor(theme.accent, index * 6) : shiftColor(theme.accent2, -index * 5))
    );
    shard.position.set(...point);
    shard.rotation.set(index * 0.18, index * 0.26, index * 0.12);
    motion.add(shard);
  });

  assembly.sideClusterB.forEach((point, index) => {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.14 + index * 0.04, 14, 14),
      material(index % 2 === 0 ? shiftColor(theme.accent2, 8 + index * 4) : shiftColor(theme.accent, -10 + index * 5))
    );
    bead.position.set(...point);
    motion.add(bead);
  });
}

function applyOrbitAssembly(orbit: THREE.Group, sceneContext: SceneContext) {
  const assembly = sceneContext.sceneAssembly;
  orbit.position.set(...assembly.orbitAnchor);
  orbit.scale.set(...assembly.orbitScale);
  orbit.rotation.set(...assembly.orbitRotation);
}

function addHeroDecor(motion: THREE.Group, sceneContext: SceneContext, theme: ReturnType<typeof themeFor>) {
  const decor = sceneContext.heroDecor;

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(decor.haloRadius, 0.05, 10, 64),
    material(shiftColor(theme.accent, 18), '#000000', 0.1, 0.7)
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, decor.ribbonHeight * 0.2, 0);
  motion.add(halo);

  const ribbon = tubeFromPoints(
    Array.from({ length: 34 }).map((_, i) => {
      const t = i / 33;
      const angle = t * Math.PI * 2.2 + decor.ribbonTwist;
      return new THREE.Vector3(
        Math.cos(angle) * (0.9 + t * 0.8),
        -0.2 + t * decor.ribbonHeight,
        Math.sin(angle) * (0.9 + t * 0.7)
      );
    }),
    shiftColor(theme.accent2, -10),
    0.035
  );
  motion.add(ribbon);

  decor.satellitePoints.forEach((point, index) => {
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 + index * 0.025, 14, 14),
      material(index % 2 === 0 ? shiftColor(theme.accent, index * 5) : shiftColor(theme.accent2, -index * 4))
    );
    sat.position.set(...point);
    sat.name = `hero-satellite-${index}`;
    motion.add(sat);
  });

  const beam = tubeFromPoints(
    decor.beamPoints.map((point) => new THREE.Vector3(...point)),
    shiftColor(theme.accent, -18),
    0.03
  );
  motion.add(beam);

  decor.crownPoints.forEach((point, index) => {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.08 + index * 0.02, 0.24 + index * 0.04, 12),
      material(index % 2 === 0 ? shiftColor(theme.accent2, 14) : shiftColor(theme.accent, -8))
    );
    crown.position.set(...point);
    crown.rotation.z = index * 0.24;
    motion.add(crown);
  });
}

function addHeroStructure(motion: THREE.Group, sceneContext: SceneContext, theme: ReturnType<typeof themeFor>) {
  const structure = sceneContext.heroStructure;
  const pA = new THREE.Vector3(...structure.anchorA);
  const pB = new THREE.Vector3(...structure.anchorB);
  const pC = new THREE.Vector3(...structure.anchorC);

  const makeBox = (size: number, color: string, position: THREE.Vector3, tilt: number) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size * 1.8, size),
      material(color, '#000000', 0.14, 0.48)
    );
    mesh.position.copy(position);
    mesh.rotation.z = THREE.MathUtils.degToRad(tilt);
    motion.add(mesh);
  };

  switch (structure.frameType) {
    case 'portal': {
      makeBox(structure.scaleA, shiftColor(theme.accent, 10), pA, structure.tiltA);
      makeBox(structure.scaleB, shiftColor(theme.accent2, -8), pB, structure.tiltB);
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(2.4 * structure.scaleC, 0.18, 0.28),
        material(shiftColor(theme.accent, -10))
      );
      bridge.position.set((pA.x + pB.x) / 2, Math.max(pA.y, pB.y) + 0.8, (pA.z + pB.z) / 2);
      motion.add(bridge);
      break;
    }
    case 'spline': {
      const ribbon = tubeFromPoints([pA, new THREE.Vector3(0, 0.6, 0), pB, pC], shiftColor(theme.accent2, 12), 0.05);
      motion.add(ribbon);
      break;
    }
    case 'fins': {
      [pA, pB, pC].forEach((point, index) => {
        const fin = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 1.2 + index * 0.35, 0.55 + index * 0.12),
          material(index % 2 === 0 ? shiftColor(theme.accent, index * 7) : shiftColor(theme.accent2, -index * 5))
        );
        fin.position.copy(point);
        fin.rotation.y = THREE.MathUtils.degToRad(structure.tiltA + index * 22);
        motion.add(fin);
      });
      break;
    }
    case 'lattice': {
      const bar1 = tubeFromPoints([pA, pB], shiftColor(theme.accent, 16), 0.035);
      const bar2 = tubeFromPoints([pB, pC], shiftColor(theme.accent2, -12), 0.035);
      const bar3 = tubeFromPoints([pC, pA], shiftColor(theme.accent, -8), 0.035);
      motion.add(bar1, bar2, bar3);
      break;
    }
    case 'radial': {
      [pA, pB, pC].forEach((point, index) => {
        const spoke = tubeFromPoints([new THREE.Vector3(0, 0.2, 0), point], index % 2 === 0 ? shiftColor(theme.accent, 10) : shiftColor(theme.accent2, -10), 0.03);
        motion.add(spoke);
      });
      break;
    }
    default: {
      makeBox(structure.scaleA, shiftColor(theme.accent, 8), pA, structure.tiltA);
      makeBox(structure.scaleB, shiftColor(theme.accent2, -6), pB, structure.tiltB);
      makeBox(structure.scaleC, shiftColor(theme.accent, -12), pC, structure.tiltC);
      break;
    }
  }
}

function replaceNamedTube(group: THREE.Group, name: string, points: THREE.Vector3[], color: string, radius = 0.08) {
  const existing = group.getObjectByName(name) as THREE.Mesh | null;
  if (!existing) return;
  const next = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 140, radius, 14, false);
  existing.geometry.dispose();
  existing.geometry = next;
}

function makeWavePoints(length = 26, xStart = -7, xStep = 0.56, sampler: (x: number, i: number) => number) {
  return Array.from({ length }).map((_, i) => {
    const x = xStart + i * xStep;
    return new THREE.Vector3(x, sampler(x, i), 0);
  });
}

function addRay(parent: THREE.Group, name: string, color: string, from: THREE.Vector3, to: THREE.Vector3, radius = 0.045) {
  const ray = tubeFromPoints([from, to], color, radius);
  ray.name = name;
  parent.add(ray);
  return ray;
}

function setRayPoints(parent: THREE.Group, name: string, color: string, points: THREE.Vector3[], radius = 0.045) {
  replaceNamedTube(parent, name, points, color, radius);
}

function buildScene(type: string, title: string, params: Record<string, number | string>, config: Record<string, unknown>, motion: THREE.Group, orbit: THREE.Group, theme: ReturnType<typeof themeFor>) {
  clearGroup(motion);
  clearGroup(orbit);
  const sceneContext = resolveSceneContext(type, title, config);
  const presentation = scenePresentation(sceneContext.sceneKind);
  addFloor(motion, theme, presentation);
  if (presentation.showLabelBar) addLabelBar(motion, theme);
  addSparkField(motion, theme, presentation);
  addScenePedestal(motion, sceneContext, theme);
  if (presentation.showBackdrop) addSceneBackdrop(motion, sceneContext, theme);
  if (presentation.showSignature) addSceneSignature(motion, sceneContext, theme);
  if (presentation.showAssemblyFrame) addSceneAssemblyFrame(motion, sceneContext, theme);
  if (presentation.showHeroStructure) addHeroStructure(motion, sceneContext, theme);
  if (presentation.showHeroDecor) addHeroDecor(motion, sceneContext, theme);
  if (presentation.showMicroDetails) addSceneMicroDetails(motion, sceneContext, theme);
  addLessonComponentDetail(motion, sceneContext, config, theme, presentation);
  motion.add(orbit);
  applyOrbitAssembly(orbit, sceneContext);

  const sceneKind = sceneContext.sceneKind;
  const v = theme.variant;

  switch (sceneKind) {
    case 'linearRail': {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(15, 0.24, 1.4), material('#64748b'));
      rail.position.set(0, -1.55, 0);
      motion.add(rail);
      for (let i = 0; i < 8 + Math.round(v.amplitude * 2); i += 1) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 1.6), material(i % 2 === 0 ? '#e2e8f0' : theme.accent2));
        tick.position.set(-6.3 + i * 1.55, -1.28, 0);
        motion.add(tick);
      }
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 1.1), material(theme.accent));
      body.position.set(-5.5, -0.85 + v.offsetY, v.offsetZ * 0.3);
      orbit.add(body);
      addArrow(orbit, '#f8fafc', [1.2, 0.2, 0], [0, 0, -Math.PI / 2], 1.2);
      break;
    }
    case 'acceleratedCart': {
      const track = new THREE.Mesh(new THREE.BoxGeometry(15, 0.2, 2.2), material('#475569'));
      track.position.set(0, -1.55, 0);
      motion.add(track);
      const cart = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.4), material(theme.accent));
      const wheel1 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 12, 24), material('#111827'));
      wheel1.rotation.y = Math.PI / 2;
      wheel1.position.set(-0.65, -0.62, 0.75);
      const wheel2 = wheel1.clone(); wheel2.position.z = -0.75;
      orbit.add(cart, wheel1, wheel2);
      addArrow(orbit, '#f8fafc', [1.6, 0.55, 0], [0, 0, -Math.PI / 2], 1.45);
      addArrow(orbit, '#fde68a', [0, 1.2, 0], [0, 0, 0], 1.1);
      break;
    }
    case 'freeFallTower': {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2), material('#334155'));
      tower.position.set(-5.2, 2.15, -2.3);
      motion.add(tower);
      const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.16, 8.5, 0.16), material('#f8fafc'));
      ruler.position.set(-4.3, 2.0, -2.3);
      motion.add(ruler);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 28, 28), material(theme.accent));
      body.position.set(-5.25 + v.offsetX * 0.3, 2.8, 0);
      orbit.add(body);
      addArrow(orbit, '#f8fafc', [0.9, -0.1, 0], [0, 0, Math.PI], 0.95);
      break;
    }
    case 'circularRotor': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.08, 16, 90), material('#94a3b8'));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -0.8, 0);
      motion.add(ring);
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 12), material('#e2e8f0'));
      spoke.rotation.z = Math.PI / 2;
      orbit.add(spoke);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 24, 24), material(theme.accent));
      body.position.set(2.1 + v.offsetX * 0.3, 0, 0);
      orbit.add(body);
      break;
    }
    case 'forceBoard': {
      const board = new THREE.Mesh(new THREE.BoxGeometry(11, 0.18, 11), material('#1e293b'));
      board.position.set(0, -1.6, 0);
      motion.add(board);
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.8), material(theme.accent));
      block.position.y = -0.8;
      orbit.add(block);
      addArrow(orbit, '#22c55e', [0, 1.15, 0], [0, 0, 0], 1.1);
      addArrow(orbit, '#60a5fa', [1.15, -0.1, 0], [0, 0, -Math.PI / 2], 1.1);
      addArrow(orbit, '#f97316', [0, -0.95, 0], [0, 0, Math.PI], 1.1);
      break;
    }
    case 'newtonCart': {
      const ground = new THREE.Mesh(new THREE.BoxGeometry(15, 0.22, 2.4), material('#0f172a'));
      ground.position.set(0, -1.55, 0);
      motion.add(ground);
      const cart = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.3), material(theme.accent));
      orbit.add(cart);
      addArrow(orbit, '#22c55e', [1.55, 0.4, 0], [0, 0, -Math.PI / 2], 1.3);
      addArrow(orbit, '#ef4444', [-1.55, -0.1, 0], [0, 0, Math.PI / 2], 1.1);
      break;
    }
    case 'inclinedPlane': {
      const plane = new THREE.Mesh(new THREE.BoxGeometry(11, 0.34, 2.6), material('#78716c'));
      plane.rotation.z = -THREE.MathUtils.degToRad(20);
      plane.position.set(0.6, -0.6, 0);
      motion.add(plane);
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.2), material(theme.accent));
      block.position.set(-2.8, 0.55, 0);
      block.rotation.z = -THREE.MathUtils.degToRad(20);
      orbit.add(block);
      break;
    }
    case 'gravityOrbit': {
      const star = new THREE.Mesh(new THREE.SphereGeometry(1.25, 28, 28), material('#fde68a', '#78350f'));
      motion.add(star);
      const orbitRing1 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.04, 10, 90), material('#38bdf8'));
      orbitRing1.rotation.x = Math.PI / 2;
      motion.add(orbitRing1);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), material(theme.accent));
      body.position.set(4.2, 0, 0);
      orbit.add(body);
      break;
    }
    case 'thermalParticles': {
      const chamber = new THREE.Mesh(new THREE.BoxGeometry(8.5, 5, 5), new THREE.MeshPhysicalMaterial({ color: '#f97316', transmission: 0.4, transparent: true, opacity: 0.16, roughness: 0.08 }));
      motion.add(chamber);
      for (let i = 0; i < 18; i += 1) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), material(i % 3 === 0 ? '#fde68a' : i % 3 === 1 ? '#fb7185' : '#38bdf8'));
        particle.name = 'thermal-particle-' + i;
        particle.position.set(-2.8 + (i % 6) * 1.1, -1.6 + ((i * 3) % 5) * 0.8, -1.5 + ((i * 5) % 4) * 0.9);
        orbit.add(particle);
      }
      break;
    }
    case 'isothermalPiston': {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.2, 36, 1, true), new THREE.MeshPhysicalMaterial({ color: '#fb7185', transmission: 0.55, transparent: true, opacity: 0.18, roughness: 0.06 }));
      motion.add(cylinder);
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.08, 0.28, 36), material('#e2e8f0'));
      piston.name = 'thermal-piston';
      piston.position.y = 1.4;
      orbit.add(piston);
      for (let i = 0; i < 14; i += 1) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), material(i % 2 === 0 ? '#fde68a' : '#38bdf8'));
        particle.name = 'iso-particle-' + i;
        particle.position.set(-1.4 + (i % 4) * 0.9, -1.5 + [0, 0.6, 1.2, 1.8][i % 4], -1.0 + ((i * 7) % 5) * 0.45);
        orbit.add(particle);
      }
      break;
    }
    case 'isobaricPiston': {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.4, 36, 1, true), new THREE.MeshPhysicalMaterial({ color: '#f59e0b', transmission: 0.52, transparent: true, opacity: 0.18, roughness: 0.06 }));
      motion.add(cylinder);
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.08, 0.28, 36), material('#f8fafc'));
      piston.name = 'thermal-piston';
      piston.position.y = 1.2;
      orbit.add(piston);
      addArrow(motion, '#22c55e', [0, 2.55, 0], [0, 0, 0], 0.9);
      for (let i = 0; i < 12; i += 1) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), material(i % 2 === 0 ? '#fbbf24' : '#38bdf8'));
        particle.name = 'isobaric-particle-' + i;
        particle.position.set(-1.3 + (i % 4) * 0.85, -1.4 + ((i * 2) % 4) * 0.7, -1.0 + ((i * 3) % 4) * 0.55);
        orbit.add(particle);
      }
      break;
    }
    case 'stateEquationChamber': {
      const chamber = new THREE.Mesh(new THREE.BoxGeometry(7.8, 5.2, 5.2), new THREE.MeshPhysicalMaterial({ color: '#22c55e', transmission: 0.36, transparent: true, opacity: 0.15, roughness: 0.08 }));
      motion.add(chamber);
      const piston = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.22, 4.6), material('#e2e8f0'));
      piston.name = 'state-piston';
      piston.position.y = 1.55;
      orbit.add(piston);
      for (let i = 0; i < 16; i += 1) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), material(i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#38bdf8' : '#f97316'));
        particle.name = 'state-particle-' + i;
        particle.position.set(-2.6 + (i % 4) * 1.3, -1.6 + ((i * 3) % 5) * 0.7, -1.4 + ((i * 5) % 4) * 0.8);
        orbit.add(particle);
      }
      break;
    }
    case 'springMass': {
      const support = new THREE.Mesh(new THREE.BoxGeometry(10, 0.22, 1.2), material('#334155'));
      support.position.set(0, 2.2, 0);
      motion.add(support);
      const spring = tubeFromPoints(makeWavePoints(50, -4.1, 0.14, (x) => Math.sin((x + 4.1) * 5.6) * 0.32 + 0.2), theme.accent, 0.08);
      spring.name = 'spring-coil';
      orbit.add(spring);
      const mass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.25, 1.2), material('#e2e8f0'));
      mass.name = 'spring-mass';
      mass.position.set(3.1, 0.2, 0);
      orbit.add(mass);
      break;
    }
    case 'pendulumArc': {
      const support = new THREE.Mesh(new THREE.BoxGeometry(8, 0.24, 1.1), material('#475569'));
      support.position.set(0, 2.5, 0);
      motion.add(support);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.2, 12), material('#e2e8f0'));
      rod.position.set(0, 0.4, 0);
      orbit.add(rod);
      const bob = new THREE.Mesh(new THREE.SphereGeometry(0.82, 28, 28), material(theme.accent));
      bob.position.set(0, -2.42, 0);
      orbit.add(bob);
      const arc = tubeFromPoints(Array.from({ length: 40 }).map((_, i) => {
        const a = THREE.MathUtils.lerp(-0.6, 0.6, i / 39);
        return new THREE.Vector3(Math.sin(a) * 2.7, 2.5 - Math.cos(a) * 2.7, 0);
      }), '#38bdf8', 0.04);
      motion.add(arc);
      break;
    }
    case 'travelingWave': {
      const rope = tubeFromPoints(makeWavePoints(28, -7, 0.52, (x) => 0.52 * Math.sin((2 * Math.PI * x) / 4.6)), theme.accent, 0.08);
      rope.name = 'traveling-wave-rope';
      rope.position.y = -0.2;
      motion.add(rope);
      break;
    }
    case 'interferenceField': {
      const source1 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), material('#22d3ee'));
      const source2 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), material('#a78bfa'));
      source1.position.set(-2.8, -0.4, 0); source2.position.set(2.8, -0.4, 0);
      motion.add(source1, source2);
      for (let r = 1; r <= 4 + Math.round(v.amplitude); r += 1) {
        const ringL = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.04, 10, 80), material('#22d3ee'));
        ringL.rotation.x = Math.PI / 2; ringL.position.copy(source1.position); motion.add(ringL);
        const ringR = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.04, 10, 80), material('#a78bfa'));
        ringR.rotation.x = Math.PI / 2; ringR.position.copy(source2.position); motion.add(ringR);
      }
      break;
    }
    case 'standingWave': {
      const rope = tubeFromPoints(makeWavePoints(28, -7, 0.52, (x) => 0.9 * Math.sin((2 * Math.PI * (x + 7)) / 7.02)), '#14b8a6', 0.085);
      rope.name = 'standing-wave-rope';
      rope.position.y = -0.1;
      motion.add(rope);
      for (let i = 0; i < 6; i += 1) {
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), material('#f8fafc'));
        node.position.set(-7 + i * 2.6, -0.1, 0);
        motion.add(node);
      }
      break;
    }
    case 'electricPlates': {
      const plate1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.2, 4.2), material('#2563eb'));
      const plate2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.2, 4.2), material('#ef4444'));
      plate1.position.set(-2.8, 0, 0); plate2.position.set(2.8, 0, 0);
      motion.add(plate1, plate2);
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 20), material('#f8fafc'));
      orbit.add(particle);
      for (let i = -2; i <= 2; i += 1) {
        addArrow(motion, '#93c5fd', [0, i * 1.0, 0], [0, 0, -Math.PI / 2], 0.9);
      }
      break;
    }
    case 'coulombCharges': {
      const q1 = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 24), material('#ef4444'));
      const q2 = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 24), material('#3b82f6'));
      q1.position.set(-3, 0, 0); q2.position.set(3, 0, 0);
      motion.add(q1, q2);
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6, 10), material('#e2e8f0'));
      line.rotation.z = Math.PI / 2;
      motion.add(line);
      break;
    }
    case 'ohmCircuit': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 7), material('#1e293b'));
      base.position.set(0, -1.55, 0); motion.add(base);
      const wire = tubeFromPoints([new THREE.Vector3(-4, 0.2, 0), new THREE.Vector3(-1.2, 0.2, 0), new THREE.Vector3(-1.2, 2, 0), new THREE.Vector3(2.4, 2, 0), new THREE.Vector3(2.4, -1.2, 0), new THREE.Vector3(-4, -1.2, 0), new THREE.Vector3(-4, 0.2, 0)], '#f8fafc', 0.07);
      motion.add(wire);
      const resistor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.5), material('#f59e0b'));
      resistor.position.set(0.6, 2, 0); motion.add(resistor);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 20), material('#fde68a', '#92400e'));
      bulb.position.set(2.4, 0.4, 0); orbit.add(bulb);
      break;
    }
    case 'magnetField': {
      const magnet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.3, 1.3), material('#ef4444'));
      motion.add(magnet);
      for (let i = 0; i < 4 + Math.round(v.amplitude); i += 1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8 + i * 0.6, 0.04, 10, 90), material('#38bdf8'));
        ring.rotation.x = Math.PI / 2; motion.add(ring);
      }
      const compass = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.1, 12), material('#f8fafc'));
      compass.rotation.z = -Math.PI / 2; compass.position.set(0, 2.2, 0); orbit.add(compass);
      break;
    }
    case 'lorentzHelix': {
      const curve = tubeFromPoints(Array.from({ length: 80 }).map((_, i) => {
        const t = i * 0.18;
        return new THREE.Vector3(Math.cos(t) * 1.6, -3 + i * 0.09, Math.sin(t) * 1.6);
      }), theme.accent, 0.05);
      motion.add(curve);
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.33, 20, 20), material('#f8fafc'));
      particle.position.set(1.6, -3, 0);
      orbit.add(particle);
      break;
    }
    case 'inductionCoil': {
      const coil = new THREE.Mesh(new THREE.TorusKnotGeometry(1.3, 0.2, 120, 14, 2, 5), material(theme.accent));
      coil.rotation.y = Math.PI / 2; motion.add(coil);
      const magnet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.8, 0.9), material('#ef4444'));
      magnet.position.set(-4, 0, 0); orbit.add(magnet);
      for (let i = -2; i <= 2; i += 1) addArrow(motion, '#93c5fd', [i * 0.9, 1.9, 0], [0, 0, 0], 0.7);
      break;
    }
    case 'rlcPanel': {
      const board = new THREE.Mesh(new THREE.BoxGeometry(12, 0.22, 7), material('#0f172a'));
      board.position.set(0, -1.55, 0); motion.add(board);
      const rBar = new THREE.Mesh(new THREE.BoxGeometry(1, 2.8, 1), material('#f97316')); rBar.position.set(-3, 0, 0);
      const lCoil = new THREE.Mesh(new THREE.TorusKnotGeometry(0.7, 0.16, 90, 12, 2, 5), material('#60a5fa')); lCoil.position.set(0, 0, 0);
      const cPlate1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3, 1), material('#f8fafc')); cPlate1.position.set(2.8, 0, 0.35);
      const cPlate2 = cPlate1.clone(); cPlate2.position.z = -0.35;
      motion.add(rBar, lCoil, cPlate1, cPlate2);
      break;
    }
    case 'transformerCore': {
      const core = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.7, 14, 48), material('#475569'));
      core.rotation.x = Math.PI / 2; motion.add(core);
      const coil1 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.16, 100, 14, 2, 5), material('#f59e0b')); coil1.position.set(-1.8, 0, 0);
      const coil2 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.16, 100, 14, 2, 5), material('#10b981')); coil2.position.set(1.8, 0, 0);
      motion.add(coil1, coil2);
      break;
    }
    case 'refractionTank': {
      const tank = new THREE.Mesh(new THREE.BoxGeometry(9, 4, 4), new THREE.MeshPhysicalMaterial({ color: '#38bdf8', transmission: 0.7, transparent: true, opacity: 0.2, roughness: 0.08 }));
      tank.position.set(0, -0.1, 0); motion.add(tank);
      const ray1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 10), material('#fde68a')); ray1.rotation.z = Math.PI / 4; ray1.position.set(-2.5, 1.4, 0);
      const ray2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 10), material(theme.accent)); ray2.rotation.z = Math.PI / 8; ray2.position.set(1.6, -0.6, 0);
      const normal = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.2, 10), material('#f8fafc')); normal.position.set(0, 0.1, 0);
      motion.add(ray1, ray2, normal);
      break;
    }
    case 'lensBench': {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 1.2), material('#64748b')); bench.position.set(0, -1.55, 0); motion.add(bench);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(1.6, 30, 30), new THREE.MeshPhysicalMaterial({ color: theme.accent, transmission: 0.78, transparent: true, opacity: 0.45, roughness: 0.06 }));
      lens.scale.set(0.55, 1.4, 0.65); motion.add(lens);
      const objectArrow = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.35, 16), material('#f8fafc')); objectArrow.name = 'lens-object'; objectArrow.rotation.z = -Math.PI / 2; objectArrow.position.set(-4.5, -0.3, 0); motion.add(objectArrow);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.2, 3), material('#e2e8f0')); screen.name = 'lens-screen'; screen.position.set(4.8, 0, 0); motion.add(screen);
      addRay(motion, 'lens-ray-1', '#fde68a', new THREE.Vector3(-4.5, -0.3, 0), new THREE.Vector3(0, -0.3, 0));
      addRay(motion, 'lens-ray-2', '#93c5fd', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(4.8, 0.6, 0));
      addRay(motion, 'lens-ray-3', '#fca5a5', new THREE.Vector3(-4.5, -0.3, 0), new THREE.Vector3(0, 0, 0));
      addRay(motion, 'lens-ray-4', '#fca5a5', new THREE.Vector3(0, 0, 0), new THREE.Vector3(4.8, -0.15, 0));
      break;
    }
    case 'eyeOptics': {
      const eyeShell = new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 32), new THREE.MeshPhysicalMaterial({ color: '#dbeafe', transmission: 0.62, transparent: true, opacity: 0.34, roughness: 0.08 }));
      eyeShell.scale.set(1.55, 1, 1);
      motion.add(eyeShell);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.92, 28, 28), new THREE.MeshPhysicalMaterial({ color: theme.accent, transmission: 0.85, transparent: true, opacity: 0.4, roughness: 0.05 }));
      lens.scale.set(0.85, 1.05, 0.85);
      lens.position.set(-1.2, 0, 0);
      lens.name = 'eye-lens';
      motion.add(lens);
      const retina = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.07, 12, 60, Math.PI), material('#ef4444'));
      retina.rotation.y = Math.PI / 2;
      retina.position.set(2.15, 0, 0);
      motion.add(retina);
      addRay(motion, 'eye-ray-1', '#fde68a', new THREE.Vector3(-6, 0.9, 0), new THREE.Vector3(-1.2, 0.65, 0));
      addRay(motion, 'eye-ray-2', '#fde68a', new THREE.Vector3(-6, 0, 0), new THREE.Vector3(-1.2, 0, 0));
      addRay(motion, 'eye-ray-3', '#fde68a', new THREE.Vector3(-6, -0.9, 0), new THREE.Vector3(-1.2, -0.65, 0));
      addRay(motion, 'eye-focus-1', '#22d3ee', new THREE.Vector3(-1.2, 0.65, 0), new THREE.Vector3(2.15, 0, 0));
      addRay(motion, 'eye-focus-2', '#22d3ee', new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(2.15, 0, 0));
      addRay(motion, 'eye-focus-3', '#22d3ee', new THREE.Vector3(-1.2, -0.65, 0), new THREE.Vector3(2.15, 0, 0));
      break;
    }
    case 'magnifierLens': {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 1.2), material('#64748b')); bench.position.set(0, -1.55, 0); motion.add(bench);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(1.3, 28, 28), new THREE.MeshPhysicalMaterial({ color: theme.accent, transmission: 0.82, transparent: true, opacity: 0.42, roughness: 0.05 }));
      lens.scale.set(0.6, 1.45, 0.7);
      motion.add(lens);
      const objectArrow = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.15, 16), material('#f8fafc'));
      objectArrow.name = 'magnifier-object';
      objectArrow.rotation.z = -Math.PI / 2;
      objectArrow.position.set(-1.7, -0.45, 0);
      motion.add(objectArrow);
      addRay(motion, 'magnifier-ray-1', '#fde68a', new THREE.Vector3(-1.7, -0.45, 0), new THREE.Vector3(0, -0.45, 0));
      addRay(motion, 'magnifier-ray-2', '#93c5fd', new THREE.Vector3(0, -0.45, 0), new THREE.Vector3(5.3, 0.8, 0));
      addRay(motion, 'magnifier-ray-3', '#fca5a5', new THREE.Vector3(-1.7, -0.45, 0), new THREE.Vector3(0, 0.1, 0));
      addRay(motion, 'magnifier-ray-4', '#fca5a5', new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(5.3, 1.15, 0));
      break;
    }
    case 'microscopeRig': {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 1.2), material('#475569')); rail.position.set(0, -1.55, 0); motion.add(rail);
      const objective = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 24), new THREE.MeshPhysicalMaterial({ color: '#8b5cf6', transmission: 0.76, transparent: true, opacity: 0.38, roughness: 0.04 }));
      objective.scale.set(0.5, 1.5, 0.65); objective.position.set(-1.9, 0, 0); motion.add(objective);
      const eyepiece = objective.clone(); eyepiece.position.set(3.1, 0, 0); motion.add(eyepiece);
      const objectArrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 16), material('#f8fafc'));
      objectArrow.name = 'microscope-object';
      objectArrow.rotation.z = -Math.PI / 2;
      objectArrow.position.set(-3.4, -0.55, 0);
      motion.add(objectArrow);
      addRay(motion, 'micro-ray-1', '#fde68a', new THREE.Vector3(-3.4, -0.55, 0), new THREE.Vector3(-1.9, -0.55, 0));
      addRay(motion, 'micro-ray-2', '#93c5fd', new THREE.Vector3(-1.9, -0.55, 0), new THREE.Vector3(1.5, 1.2, 0));
      addRay(motion, 'micro-ray-3', '#fca5a5', new THREE.Vector3(1.5, 1.2, 0), new THREE.Vector3(3.1, 1.2, 0));
      addRay(motion, 'micro-ray-4', '#22d3ee', new THREE.Vector3(3.1, 1.2, 0), new THREE.Vector3(6, 2.1, 0));
      break;
    }
    case 'telescopeRig': {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 1.2), material('#334155')); rail.position.set(0, -1.55, 0); motion.add(rail);
      const objective = new THREE.Mesh(new THREE.SphereGeometry(1.4, 28, 28), new THREE.MeshPhysicalMaterial({ color: '#38bdf8', transmission: 0.84, transparent: true, opacity: 0.36, roughness: 0.04 }));
      objective.scale.set(0.52, 1.65, 0.72); objective.position.set(-1.8, 0, 0); motion.add(objective);
      const eyepiece = objective.clone(); eyepiece.scale.set(0.38, 1.15, 0.5); eyepiece.position.set(3.35, 0, 0); motion.add(eyepiece);
      addRay(motion, 'scope-ray-1', '#fde68a', new THREE.Vector3(-6, 0.8, 0), new THREE.Vector3(-1.8, 0.8, 0));
      addRay(motion, 'scope-ray-2', '#fde68a', new THREE.Vector3(-6, 0, 0), new THREE.Vector3(-1.8, 0, 0));
      addRay(motion, 'scope-ray-3', '#fde68a', new THREE.Vector3(-6, -0.8, 0), new THREE.Vector3(-1.8, -0.8, 0));
      addRay(motion, 'scope-ray-4', '#22d3ee', new THREE.Vector3(-1.8, 0.8, 0), new THREE.Vector3(0.8, 0, 0));
      addRay(motion, 'scope-ray-5', '#22d3ee', new THREE.Vector3(-1.8, 0, 0), new THREE.Vector3(0.8, 0, 0));
      addRay(motion, 'scope-ray-6', '#22d3ee', new THREE.Vector3(-1.8, -0.8, 0), new THREE.Vector3(0.8, 0, 0));
      addRay(motion, 'scope-ray-7', '#93c5fd', new THREE.Vector3(0.8, 0, 0), new THREE.Vector3(6, 0.72, 0));
      break;
    }
    case 'xrayTube': {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 8.6, 28, 1, true), new THREE.MeshPhysicalMaterial({ color: '#1e293b', transmission: 0.38, transparent: true, opacity: 0.16, roughness: 0.08 }));
      shell.rotation.z = Math.PI / 2;
      motion.add(shell);
      const cathode = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2, 1.2), material('#64748b'));
      cathode.position.set(-3.25, 0, 0);
      const anode = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.2, 1.4), material(theme.accent));
      anode.rotation.z = THREE.MathUtils.degToRad(18);
      anode.position.set(2.9, 0, 0);
      motion.add(cathode, anode);
      const electron = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), material('#93c5fd'));
      electron.name = 'xray-electron';
      orbit.add(electron);
      addRay(motion, 'xray-beam-1', '#fbbf24', new THREE.Vector3(2.9, 0.2, 0), new THREE.Vector3(5.9, 1.5, 0), 0.05);
      addRay(motion, 'xray-beam-2', '#f97316', new THREE.Vector3(2.9, 0.1, 0), new THREE.Vector3(5.8, 0.55, 0), 0.04);
      break;
    }
    case 'nuclearCluster': {
      for (let i = 0; i < 12; i += 1) {
        const nucleon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 18), material(i % 2 === 0 ? '#ef4444' : '#94a3b8'));
        nucleon.name = `nucleon-${i}`;
        nucleon.position.set(Math.cos((i / 12) * Math.PI * 2) * (1.1 + (i % 3) * 0.2), Math.sin((i / 12) * Math.PI * 2) * (0.9 + (i % 2) * 0.18), ((i % 4) - 1.5) * 0.24);
        orbit.add(nucleon);
      }
      break;
    }
    case 'bindingWell': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.08, 16, 80), material('#c084fc'));
      ring.rotation.x = Math.PI / 2;
      motion.add(ring);
      const well = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.1, 3.2, 32, 1, true), new THREE.MeshPhysicalMaterial({ color: '#4c1d95', transmission: 0.2, transparent: true, opacity: 0.16, roughness: 0.18 }));
      well.position.y = -0.8;
      motion.add(well);
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 18), material('#f8fafc'));
      particle.name = 'binding-particle';
      orbit.add(particle);
      break;
    }
    case 'photoelectricCell': {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 6.2, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: '#1e293b', transmission: 0.45, transparent: true, opacity: 0.2, roughness: 0.12 }));
      tube.rotation.z = Math.PI / 2; motion.add(tube);
      const cathode = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.4, 1.3), material('#64748b')); cathode.position.set(-1.7, 0, 0);
      const anode = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 1), material('#f8fafc')); anode.position.set(2.2, 0, 0);
      const photon = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 18), material('#fde68a', '#a16207')); photon.position.set(-4, 1.3, 0);
      motion.add(cathode, anode); orbit.add(photon);
      break;
    }
    case 'bohrAtom': {
      const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), material('#ef4444'));
      motion.add(nucleus);
      for (let i = 0; i < 3; i += 1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3 + i * 1.0, 0.05, 10, 90), material(i === 1 ? '#f59e0b' : '#60a5fa'));
        ring.rotation.x = i === 0 ? 0 : Math.PI / 3;
        ring.rotation.y = i === 2 ? Math.PI / 2 : 0;
        motion.add(ring);
      }
      const electron = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), material('#e2e8f0'));
      electron.position.set(3.3, 0, 0); orbit.add(electron);
      break;
    }
    case 'decayChamber': {
      const chamber = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 5), new THREE.MeshPhysicalMaterial({ color: '#0f172a', transmission: 0.3, transparent: true, opacity: 0.18, roughness: 0.14 }));
      motion.add(chamber);
      const source = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 20), material('#ef4444'));
      motion.add(source);
      const detector = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 2.4), material('#f8fafc')); detector.position.set(3.2, 0, 0); motion.add(detector);
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), material('#f97316')); particle.position.set(0.6, 0.3, 0); orbit.add(particle);
      break;
    }
    case 'nuclearReaction': {
      const target = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 24), material('#60a5fa'));
      target.position.set(1.2, 0, 0); motion.add(target);
      const incoming = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 18), material('#f59e0b')); incoming.position.set(-4.2, 0, 0); orbit.add(incoming);
      const product1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 18), material('#ef4444')); product1.position.set(2.8, 1.1, 0);
      const product2 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), material('#22c55e')); product2.position.set(2.6, -1.2, 0);
      motion.add(product1, product2);
      break;
    }
    default: {
      const token = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), material(theme.accent));
      orbit.add(token);
      break;
    }
  }
}

function motionTick(type: string, title: string, params: Record<string, number | string>, config: Record<string, unknown>, orbit: THREE.Group, t: number) {
  const sceneContext = resolveSceneContext(type, title, config);
  const v = createVariant(type, title, config);
  const time = t * v.speedFactor;
  const motionRoot = orbit.parent as THREE.Group | null;
  const assembly = sceneContext.sceneAssembly;
  const anchorX = assembly.orbitAnchor[0];
  const anchorY = assembly.orbitAnchor[1];
  const anchorZ = assembly.orbitAnchor[2];
  const swingX = assembly.motionEnvelope.swingX;
  const swingY = assembly.motionEnvelope.swingY;
  const swingZ = assembly.motionEnvelope.swingZ;
  switch (sceneContext.sceneKind) {
    case 'linearRail':
      orbit.position.set(anchorX - 5.6 + ((num(params.v, 4) * time * v.amplitude) % 11.4), anchorY + v.offsetY * 0.4, anchorZ + v.offsetZ * 0.35);
      break;
    case 'acceleratedCart': {
      const v0 = num(params.v0, 0.6); const a = num(params.a, 1.4);
      orbit.position.x = anchorX - 5.8 + ((v0 * time + 0.5 * a * time * time * v.amplitude) % 11.6);
      orbit.position.y = anchorY + v.offsetY * 0.5;
      orbit.position.z = anchorZ + Math.sin(time * 0.8) * swingZ;
      orbit.rotation.z = assembly.orbitRotation[2] + Math.sin(time * 6) * 0.05;
      break;
    }
    case 'freeFallTower': {
      const g = num(params.g, 9.81);
      const local = time % 3.2;
      orbit.position.y = anchorY + 2.9 - 0.5 * (g / 9.81) * local * local * v.amplitude;
      orbit.position.x = anchorX + local * num(params.vx, 0.08) + v.offsetX * 0.35;
      orbit.position.z = anchorZ + Math.sin(local * 2.1) * swingZ;
      break;
    }
    case 'circularRotor':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.y = assembly.orbitRotation[1] + time * num(params.omega, 1.6);
      break;
    case 'forceBoard':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.y = assembly.orbitRotation[1] + Math.sin(time * 0.8) * 0.18;
      orbit.rotation.x = assembly.orbitRotation[0] + Math.cos(time * 0.65) * 0.05;
      break;
    case 'newtonCart':
      orbit.position.x = anchorX - 5.2 + ((num(params.force, 8) / Math.max(num(params.mass, 2), 0.6) * 0.2 * time * time) % 10.4);
      orbit.position.y = anchorY;
      orbit.position.z = anchorZ + Math.sin(time * 0.9) * swingZ;
      break;
    case 'inclinedPlane':
      orbit.position.set(anchorX - 2.8 + (Math.sin(time * 1.4) + 1) * 1.6, anchorY + 0.55 - (Math.sin(time * 1.4) + 1) * 0.58, anchorZ);
      break;
    case 'gravityOrbit':
      orbit.position.set(anchorX + Math.cos(time * 1.2) * 4.2, anchorY + 0.2 * Math.sin(time * 0.55), anchorZ + Math.sin(time * 1.2) * 4.2);
      break;
    case 'thermalParticles': {
      orbit.position.set(anchorX, anchorY, anchorZ);
      const temperature = Math.max(num(params.temperature, 300), 50);
      const speed = 0.015 * Math.sqrt(temperature / 300);
      orbit.children.forEach((child, index) => {
        child.position.x += Math.sin(time * (1.2 + index * 0.11)) * speed;
        child.position.y += Math.cos(time * (1.5 + index * 0.07)) * speed;
        child.position.z += Math.sin(time * (1.1 + index * 0.09)) * speed;
        child.position.x = clamp(child.position.x, -3.5, 3.5);
        child.position.y = clamp(child.position.y, -2.1, 2.1);
        child.position.z = clamp(child.position.z, -2.0, 2.0);
      });
      break;
    }
    case 'isothermalPiston': {
      orbit.position.set(anchorX, anchorY, anchorZ);
      const volume = Math.max(num(params.volume, 1.4), 0.4);
      const pistonY = clamp(-1.2 + volume * 1.5, -0.8, 1.95);
      const piston = orbit.getObjectByName('thermal-piston');
      if (piston) piston.position.y = pistonY;
      orbit.children.forEach((child, index) => {
        if (!child.name.startsWith('iso-particle-')) return;
        child.position.x += Math.sin(time * (1.5 + index * 0.14)) * 0.018;
        child.position.y += Math.cos(time * (1.3 + index * 0.1)) * 0.014;
        child.position.z += Math.sin(time * (1.1 + index * 0.12)) * 0.014;
        child.position.x = clamp(child.position.x, -1.85, 1.85);
        child.position.y = clamp(child.position.y, -2.1, pistonY - 0.18);
        child.position.z = clamp(child.position.z, -1.7, 1.7);
      });
      break;
    }
    case 'isobaricPiston': {
      orbit.position.set(anchorX, anchorY, anchorZ);
      const volume = Math.max(num(params.volume, 1.3), 0.4);
      const pistonY = clamp(-1.3 + volume * 1.55, -0.9, 2.0);
      const piston = orbit.getObjectByName('thermal-piston');
      if (piston) piston.position.y = pistonY;
      orbit.children.forEach((child, index) => {
        if (!child.name.startsWith('isobaric-particle-')) return;
        child.position.x += Math.sin(time * (1.35 + index * 0.15)) * 0.016;
        child.position.y += Math.cos(time * (1.55 + index * 0.08)) * 0.014;
        child.position.z += Math.sin(time * (1.18 + index * 0.09)) * 0.013;
        child.position.x = clamp(child.position.x, -1.85, 1.85);
        child.position.y = clamp(child.position.y, -2.1, pistonY - 0.18);
        child.position.z = clamp(child.position.z, -1.7, 1.7);
      });
      break;
    }
    case 'stateEquationChamber': {
      orbit.position.set(anchorX, anchorY, anchorZ);
      const volume = Math.max(num(params.volume, 1.2), 0.3);
      const temperature = Math.max(num(params.temperature, 320), 50);
      const piston = orbit.getObjectByName('state-piston');
      const pistonY = clamp(-1.35 + volume * 1.7, -1.0, 2.05);
      if (piston) piston.position.y = pistonY;
      const speed = 0.012 * Math.sqrt(temperature / 300);
      orbit.children.forEach((child, index) => {
        if (!child.name.startsWith('state-particle-')) return;
        child.position.x += Math.sin(time * (1.25 + index * 0.13)) * speed;
        child.position.y += Math.cos(time * (1.42 + index * 0.09)) * speed;
        child.position.z += Math.sin(time * (1.14 + index * 0.07)) * speed;
        child.position.x = clamp(child.position.x, -3.0, 3.0);
        child.position.y = clamp(child.position.y, -2.2, pistonY - 0.18);
        child.position.z = clamp(child.position.z, -2.0, 2.0);
      });
      break;
    }
    case 'springMass':
      orbit.position.x = anchorX;
      orbit.position.y = anchorY;
      orbit.position.z = anchorZ;
      {
        const mass = orbit.getObjectByName('spring-mass');
        const displacement = Math.sin(time * Math.sqrt(Math.max(num(params.k, 25) / Math.max(num(params.m, 0.5), 0.1), 0.1))) * num(params.A, 6) * 0.18;
        if (mass) mass.position.x = 3.1 + displacement;
        replaceNamedTube(orbit, 'spring-coil', makeWavePoints(50, -4.1, 0.14, (x) => {
          const progress = clamp((x + 4.1) / (7.2 + displacement), 0, 1);
          return Math.sin(progress * Math.PI * 12) * 0.32 + 0.2;
        }).map((point) => new THREE.Vector3(point.x + displacement * ((point.x + 4.1) / 7.2), point.y, point.z)), '#06b6d4', 0.08);
      }
      break;
    case 'pendulumArc':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.z = assembly.orbitRotation[2] + Math.sin(time * 1.45) * THREE.MathUtils.degToRad(num(params.angle, 18));
      break;
    case 'travelingWave':
      if (motionRoot) {
        const A = num(params.A, 2) * 0.18;
        const lambda = Math.max(num(params.lambda, 4), 1);
        const speedWave = num(params.v, 6) * 0.22;
        const omega = (2 * Math.PI * speedWave) / lambda;
        setRayPoints(motionRoot, 'traveling-wave-rope', '#38bdf8', makeWavePoints(28, -7, 0.52, (x) => A * Math.sin((2 * Math.PI * x) / lambda - omega * time)).map((point) => new THREE.Vector3(point.x, point.y - 0.2, point.z)), 0.08);
      }
      break;
    case 'interferenceField':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.y = assembly.orbitRotation[1] + time * 0.45;
      orbit.rotation.x = assembly.orbitRotation[0] + Math.sin(time * 0.35) * 0.09;
      break;
    case 'standingWave':
      if (motionRoot) {
        const A = num(params.A, 3) * 0.16;
        const lambda = Math.max(num(params.lambda, 4), 1);
        const omega = (2 * Math.PI * num(params.A, 3)) / 6;
        setRayPoints(motionRoot, 'standing-wave-rope', '#14b8a6', makeWavePoints(28, -7, 0.52, (x) => A * Math.sin((2 * Math.PI * (x + 7)) / lambda) * Math.cos(omega * time)).map((point) => new THREE.Vector3(point.x, point.y - 0.1, point.z)), 0.085);
      }
      break;
    case 'electricPlates':
      orbit.position.set(anchorX + Math.sin(time * 1.8) * 2.1, anchorY + Math.cos(time * 1.1) * 1.2, anchorZ);
      break;
    case 'coulombCharges':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.y = assembly.orbitRotation[1] + Math.sin(time * 0.9) * 0.18;
      break;
    case 'ohmCircuit':
      orbit.position.set(anchorX, anchorY + Math.sin(time * 4) * 0.26, anchorZ);
      break;
    case 'magnetField':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.z = assembly.orbitRotation[2] + Math.sin(time * 1.2) * 0.8;
      break;
    case 'lorentzHelix':
      orbit.position.set(anchorX + Math.cos(time * 3) * 1.6, anchorY - 3 + ((time * 1.4) % 6), anchorZ + Math.sin(time * 3) * 1.6);
      break;
    case 'inductionCoil':
      orbit.position.x = anchorX - 4 + ((time * 1.6) % 8);
      orbit.position.y = anchorY;
      orbit.position.z = anchorZ;
      break;
    case 'rlcPanel':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.y = assembly.orbitRotation[1] + time * 0.4;
      break;
    case 'transformerCore':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.x = assembly.orbitRotation[0] + Math.sin(time * 1.2) * 0.12;
      break;
    case 'refractionTank':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.y = assembly.orbitRotation[1] + Math.sin(time * 0.6) * 0.08;
      break;
    case 'lensBench':
      if (motionRoot) {
        const objectX = -4.8 + Math.sin(time * 0.55) * 0.8;
        const f = Math.max(num(params.f, 12), 2) * 0.22;
        const d = Math.max(Math.abs(objectX), f + 0.4);
        const imageX = (f * d) / Math.max(d - f, 0.2);
        const screen = motionRoot.getObjectByName('lens-screen');
        const objectArrow = motionRoot.getObjectByName('lens-object');
        if (objectArrow) objectArrow.position.x = objectX;
        if (screen) screen.position.x = clamp(imageX, 1.8, 5.6);
        setRayPoints(motionRoot, 'lens-ray-1', '#fde68a', [new THREE.Vector3(objectX, -0.3, 0), new THREE.Vector3(0, -0.3, 0)], 0.045);
        setRayPoints(motionRoot, 'lens-ray-2', '#93c5fd', [new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(clamp(imageX, 1.8, 5.6), 0.55, 0)], 0.045);
        setRayPoints(motionRoot, 'lens-ray-3', '#fca5a5', [new THREE.Vector3(objectX, -0.3, 0), new THREE.Vector3(0, 0, 0)], 0.045);
        setRayPoints(motionRoot, 'lens-ray-4', '#fca5a5', [new THREE.Vector3(0, 0, 0), new THREE.Vector3(clamp(imageX, 1.8, 5.6), -0.14, 0)], 0.045);
      }
      break;
    case 'photoelectricCell':
      orbit.position.set(anchorX - 4 + ((time * 3.4) % 6), anchorY + 1.3 - ((time * 1.1) % 2.2), anchorZ);
      break;
    case 'eyeOptics':
      if (motionRoot) {
        const defect = Math.sin(time * 0.55) * 0.9;
        const focusX = 2.15 + defect;
        setRayPoints(motionRoot, 'eye-focus-1', '#22d3ee', [new THREE.Vector3(-1.2, 0.65, 0), new THREE.Vector3(focusX, 0, 0)], 0.045);
        setRayPoints(motionRoot, 'eye-focus-2', '#22d3ee', [new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(focusX, 0, 0)], 0.045);
        setRayPoints(motionRoot, 'eye-focus-3', '#22d3ee', [new THREE.Vector3(-1.2, -0.65, 0), new THREE.Vector3(focusX, 0, 0)], 0.045);
      }
      break;
    case 'magnifierLens':
      if (motionRoot) {
        const objectX = -1.65 + Math.sin(time * 0.9) * 0.34;
        const objectArrow = motionRoot.getObjectByName('magnifier-object');
        if (objectArrow) objectArrow.position.x = objectX;
        setRayPoints(motionRoot, 'magnifier-ray-1', '#fde68a', [new THREE.Vector3(objectX, -0.45, 0), new THREE.Vector3(0, -0.45, 0)], 0.045);
        setRayPoints(motionRoot, 'magnifier-ray-2', '#93c5fd', [new THREE.Vector3(0, -0.45, 0), new THREE.Vector3(5.3, 0.65 + Math.sin(time * 0.9) * 0.2, 0)], 0.045);
        setRayPoints(motionRoot, 'magnifier-ray-3', '#fca5a5', [new THREE.Vector3(objectX, -0.45, 0), new THREE.Vector3(0, 0.1, 0)], 0.045);
        setRayPoints(motionRoot, 'magnifier-ray-4', '#fca5a5', [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(5.3, 1.0 + Math.sin(time * 0.9) * 0.2, 0)], 0.045);
      }
      break;
    case 'microscopeRig':
      if (motionRoot) {
        const objectY = -0.55 + Math.sin(time * 1.1) * 0.18;
        const objectArrow = motionRoot.getObjectByName('microscope-object');
        if (objectArrow) objectArrow.position.y = objectY;
        setRayPoints(motionRoot, 'micro-ray-1', '#fde68a', [new THREE.Vector3(-3.4, objectY, 0), new THREE.Vector3(-1.9, objectY, 0)], 0.04);
        setRayPoints(motionRoot, 'micro-ray-2', '#93c5fd', [new THREE.Vector3(-1.9, objectY, 0), new THREE.Vector3(1.5, 1.15 - objectY * 0.6, 0)], 0.04);
        setRayPoints(motionRoot, 'micro-ray-3', '#fca5a5', [new THREE.Vector3(1.5, 1.15 - objectY * 0.6, 0), new THREE.Vector3(3.1, 1.15 - objectY * 0.6, 0)], 0.04);
        setRayPoints(motionRoot, 'micro-ray-4', '#22d3ee', [new THREE.Vector3(3.1, 1.15 - objectY * 0.6, 0), new THREE.Vector3(6, 2.0 - objectY * 0.35, 0)], 0.04);
      }
      break;
    case 'telescopeRig':
      if (motionRoot) {
        const offset = Math.sin(time * 0.45) * 0.28;
        setRayPoints(motionRoot, 'scope-ray-1', '#fde68a', [new THREE.Vector3(-6, 0.8 + offset, 0), new THREE.Vector3(-1.8, 0.8 + offset, 0)], 0.04);
        setRayPoints(motionRoot, 'scope-ray-2', '#fde68a', [new THREE.Vector3(-6, 0 + offset * 0.4, 0), new THREE.Vector3(-1.8, 0 + offset * 0.4, 0)], 0.04);
        setRayPoints(motionRoot, 'scope-ray-3', '#fde68a', [new THREE.Vector3(-6, -0.8 + offset * 0.1, 0), new THREE.Vector3(-1.8, -0.8 + offset * 0.1, 0)], 0.04);
        setRayPoints(motionRoot, 'scope-ray-4', '#22d3ee', [new THREE.Vector3(-1.8, 0.8 + offset, 0), new THREE.Vector3(0.8, 0, 0)], 0.04);
        setRayPoints(motionRoot, 'scope-ray-5', '#22d3ee', [new THREE.Vector3(-1.8, 0 + offset * 0.4, 0), new THREE.Vector3(0.8, 0, 0)], 0.04);
        setRayPoints(motionRoot, 'scope-ray-6', '#22d3ee', [new THREE.Vector3(-1.8, -0.8 + offset * 0.1, 0), new THREE.Vector3(0.8, 0, 0)], 0.04);
      }
      break;
    case 'xrayTube':
      orbit.position.set(anchorX - 3.25 + ((time * 4.6) % 6.1), anchorY + Math.sin(time * 12) * 0.08, anchorZ);
      break;
    case 'bohrAtom':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.rotation.y = assembly.orbitRotation[1] + time * 1.3;
      orbit.rotation.x = assembly.orbitRotation[0] + Math.sin(time * 0.7) * 0.35;
      break;
    case 'decayChamber':
      orbit.position.set(anchorX + ((time * 1.4) % 3.2), anchorY + Math.sin(time * 5) * 0.7, anchorZ + Math.cos(time * 4) * 0.6);
      break;
    case 'nuclearReaction':
      orbit.position.x = anchorX - 4.2 + ((time * 3.6) % 5.4);
      orbit.position.y = anchorY;
      orbit.position.z = anchorZ;
      break;
    case 'nuclearCluster':
      orbit.position.set(anchorX, anchorY, anchorZ);
      orbit.children.forEach((child, index) => {
        child.position.x += Math.sin(time * 1.8 + index) * 0.004;
        child.position.y += Math.cos(time * 1.4 + index * 0.7) * 0.004;
        child.position.z = Math.sin(time * 1.2 + index) * 0.18;
      });
      orbit.rotation.y = assembly.orbitRotation[1] + time * 0.18;
      break;
    case 'bindingWell': {
      const radius = 1.45 - 0.65 * (0.5 + 0.5 * Math.sin(time * 0.9));
      orbit.position.set(anchorX + Math.cos(time * 2.4) * radius, anchorY - 0.9 + 0.85 * Math.cos(time * 0.9), anchorZ + Math.sin(time * 2.4) * radius);
      break;
    }
    default:
      orbit.position.set(anchorX + Math.sin(time * assembly.motionEnvelope.yaw) * swingX, anchorY + Math.cos(time * assembly.motionEnvelope.pitch) * swingY, anchorZ + Math.sin(time * assembly.motionEnvelope.roll) * swingZ);
      orbit.rotation.y = assembly.orbitRotation[1] + time + sceneBand(sceneContext.sceneId, 11, 7) * 0.04;
      break;
  }

  if (motionRoot) {
    switch (sceneContext.sceneSpec.motionMode) {
      case 'pulse':
        motionRoot.rotation.y = 0;
        motionRoot.rotation.z = Math.sin(time * 0.18) * 0.02;
        motionRoot.rotation.x = 0;
        motionRoot.position.y = Math.sin(time * 0.5) * 0.08;
        motionRoot.position.x = 0;
        motionRoot.position.z = 0;
        break;
      case 'orbit':
        motionRoot.rotation.y += 0.002;
        motionRoot.rotation.x = 0;
        motionRoot.rotation.z = 0;
        motionRoot.position.x = Math.sin(time * 0.2) * 0.18;
        motionRoot.position.y = 0;
        motionRoot.position.z = 0;
        break;
      case 'sweep':
        motionRoot.rotation.y = 0;
        motionRoot.rotation.x = Math.cos(time * 0.22) * 0.03;
        motionRoot.rotation.z = Math.sin(time * 0.15) * 0.018;
        motionRoot.position.x = 0;
        motionRoot.position.y = 0;
        motionRoot.position.z = 0;
        break;
      case 'tilt':
        motionRoot.rotation.y = 0;
        motionRoot.rotation.x = Math.sin(time * 0.16) * 0.02;
        motionRoot.rotation.z = Math.cos(time * 0.14) * 0.024;
        motionRoot.position.x = 0;
        motionRoot.position.y = 0;
        motionRoot.position.z = 0;
        break;
      case 'helix':
        motionRoot.rotation.y = 0;
        motionRoot.rotation.x = 0;
        motionRoot.rotation.z = Math.sin(time * 0.12) * 0.014;
        motionRoot.position.x = 0;
        motionRoot.position.y = 0;
        motionRoot.position.z = Math.cos(time * 0.24) * 0.16;
        break;
      default:
        motionRoot.rotation.y = 0;
        motionRoot.rotation.x = 0;
        motionRoot.rotation.z = Math.sin(time * (0.08 + sceneBand(sceneContext.sceneId, 5, 9) * 0.01)) * (sceneBand(sceneContext.sceneId, 9, 12) * 0.003);
        motionRoot.position.y = 0;
        motionRoot.position.x = 0;
        motionRoot.position.z = 0;
        break;
    }
  }
}

function ImageStage({ url, title }: { url: string; title: string }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="stack">
      <div
        className="simulation-box image-stage"
        onMouseDown={(e) => { dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; }}
        onMouseMove={(e) => { if (!dragRef.current) return; setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y }); }}
        onMouseUp={() => { dragRef.current = null; }}
        onMouseLeave={() => { dragRef.current = null; }}
        onWheel={(e) => { e.preventDefault(); setZoom((prev) => clamp(prev + (e.deltaY < 0 ? 0.1 : -0.1), 0.7, 3)); }}
      >
        <img src={url} alt={title} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} />
      </div>
      <div className="note-box">Anh minh hoa bam sat noi dung bai dang bat. Keo de pan, lan chuot de zoom.</div>
    </div>
  );
}

export function PhysicsSimulation({ type = 'default', params = {}, title, config = {} }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handlesRef = useRef<StageHandles | null>(null);
  const frameRef = useRef<number>(0);
  const dragStateRef = useRef<{ mode: 'orbit' | 'pan'; x: number; y: number } | null>(null);
  const currentTimeRef = useRef(0);
  const hudTickRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [camera, setCamera] = useState<CameraState>(defaultCameraState);
  const [badges, setBadges] = useState<string[]>([]);
  const [displayTime, setDisplayTime] = useState(0);
  const [controlledParams, setControlledParams] = useState<Record<string, number | string>>(params);

  const sceneContext = useMemo(() => resolveSceneContext(type, title, config as Record<string, unknown>), [type, title, config]);
  const profile = sceneContext.profile;
  const variant = useMemo(() => createVariant(type, title, config as Record<string, unknown>), [type, title, config]);
  const requestedMode = String(config.displayMode || 'simulation');
  const computedMode = requestedMode === 'image' || profile.mode === 'image' ? 'image' : 'simulation';
  const imageUrl = typeof config.imageUrl === 'string' && config.imageUrl.trim() ? config.imageUrl : generateLessonIllustration(title, type, config as Record<string, unknown>);
  const theme = useMemo(() => themeFor(type, title, config as Record<string, unknown>), [type, title, config]);
  const t = repairVietnameseText;
  const annotations = useMemo(() => sceneAnnotationsSafe(sceneContext.sceneKind), [sceneContext.sceneKind]);
  const lessonFocus = sceneFocusFor(sceneContext.sceneKind);
  const displayLabel = sceneLabelFor(sceneContext.sceneKind);
  const headline = sceneFocusFor(sceneContext.sceneKind);
  const cameraBounds = useMemo(() => cameraBoundsFor(sceneContext.sceneKind), [sceneContext.sceneKind]);
  const controls = useMemo(() => parameterControlsFor(sceneContext.sceneKind), [sceneContext.sceneKind]);
  const effectiveParams = useMemo(() => ({ ...params, ...controlledParams }), [params, controlledParams]);
  const simState = useMemo(
    () => simulationStateFor(sceneContext.sceneKind, effectiveParams, displayTime, speed, running, camera),
    [sceneContext.sceneKind, effectiveParams, displayTime, speed, running, camera]
  );
  const cameraPresets = useMemo(() => cameraPresetsFor(sceneContext.sceneKind, cameraBounds), [sceneContext.sceneKind, cameraBounds]);
  const tips = useMemo(() => interactionTips(sceneContext.sceneKind), [sceneContext.sceneKind]);
  const paramEntries = useMemo(
    () => Object.entries(effectiveParams).filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '').slice(0, 8),
    [effectiveParams]
  );
  const visualModeLabel = computedMode === 'image' ? 'Anh minh hoa' : 'Mo phong tuong tac';

  useEffect(() => {
    setControlledParams(params);
  }, [params]);

  useEffect(() => {
    const nextDuration = simulationDuration(sceneContext.sceneKind, effectiveParams);
    currentTimeRef.current = clamp(currentTimeRef.current, 0, nextDuration);
    setDisplayTime(currentTimeRef.current);
  }, [sceneContext.sceneKind, effectiveParams]);

  useEffect(() => {
    if (computedMode === 'image' || !mountRef.current) return;
    const mount = mountRef.current;
    const width = mount.clientWidth || 760;
    const height = clamp(Math.round(width * 0.62), 420, 560);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.bg);
    scene.fog = new THREE.Fog(theme.fog, 12, 34);

    const camera3d = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8); keyLight.position.set(8, 10, 7); scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.15); fillLight.position.set(-7, 5, -6); scene.add(fillLight);

    const motion = new THREE.Group();
    const orbit = new THREE.Group();
    scene.add(motion);

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    handlesRef.current = { renderer, scene, camera: camera3d, motion, orbit, themeAccent: theme.accent };

    const applyWheelZoom = (deltaY: number) => {
      setCamera((prev) => ({
        ...prev,
        distance: clamp(prev.distance + (deltaY < 0 ? -0.9 : 0.9), cameraBounds.minDistance, cameraBounds.maxDistance)
      }));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.button !== 2) return;
      dragStateRef.current = {
        mode: event.button === 2 || event.shiftKey ? 'pan' : 'orbit',
        x: event.clientX,
        y: event.clientY
      };
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      dragStateRef.current = { ...drag, x: event.clientX, y: event.clientY };
      if (drag.mode === 'orbit') {
        setCamera((prev) => ({
          ...prev,
          yaw: prev.yaw - dx * 0.0085,
          pitch: clamp(prev.pitch - dy * 0.0065, -0.2, 1.15)
        }));
        return;
      }
      setCamera((prev) => {
        const panScale = Math.max(prev.distance * 0.012, 0.05);
        return {
          ...prev,
          targetX: clamp((prev.targetX ?? 0) - dx * panScale * 0.12, -cameraBounds.panX, cameraBounds.panX),
          targetY: clamp((prev.targetY ?? 0) + dy * panScale * 0.09, -cameraBounds.panY, cameraBounds.panY),
          targetZ: clamp((prev.targetZ ?? 0) + dx * panScale * 0.04, -cameraBounds.panZ, cameraBounds.panZ)
        };
      });
    };

    const clearDrag = () => {
      dragStateRef.current = null;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyWheelZoom(event.deltaY);
    };

    const preventContext = (event: MouseEvent) => event.preventDefault();
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', clearDrag);
    renderer.domElement.addEventListener('pointerleave', clearDrag);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', preventContext);

    const onResize = () => {
      const w = mount.clientWidth || 760;
      const h = clamp(Math.round(w * 0.62), 420, 560);
      renderer.setSize(w, h);
      camera3d.aspect = w / h;
      camera3d.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', clearDrag);
      renderer.domElement.removeEventListener('pointerleave', clearDrag);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', preventContext);
      renderer.dispose();
      mount.innerHTML = '';
      handlesRef.current = null;
    };
  }, [computedMode, theme, cameraBounds]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || computedMode === 'image') return;
    buildScene(type, title, effectiveParams, config as Record<string, unknown>, handles.motion, handles.orbit, theme);
  }, [type, title, effectiveParams, computedMode, theme, config]);


  useEffect(() => {
    if (computedMode === 'image') return;
    setBadges([
      `Mode: Three.js WebGL`,
      `Preset: ${type}`,
      `Scene: ${sceneContext.sceneId}`,
      `Layout: ${sceneContext.sceneKind}`,
      `Variant: #${String(variant.seed).slice(-4)}`,
      `M\u1ee5c ti\u00eau: ${headline}`
    ]);
  }, [type, computedMode, sceneContext, variant, headline]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || computedMode === 'image') return;
    const { camera: camera3d, renderer, scene, motion, orbit } = handles;
    let t0 = performance.now();
    const renderLoop = (now: number) => {
      const dt = (now - t0) / 1000;
      t0 = now;
      const duration = simulationDuration(sceneContext.sceneKind, effectiveParams);
      if (running) {
        currentTimeRef.current += dt * speed;
        if (currentTimeRef.current > duration) currentTimeRef.current = currentTimeRef.current % duration;
        motion.rotation.y += dt * (0.06 + sceneBand(sceneContext.sceneId, 5, 6) * 0.01) * variant.speedFactor;
      }
      motionTick(type, title, effectiveParams, config as Record<string, unknown>, orbit, currentTimeRef.current);
      if (now - hudTickRef.current > 70) {
        hudTickRef.current = now;
        setDisplayTime(currentTimeRef.current);
      }
      const targetX = camera.targetX ?? 0;
      const targetY = camera.targetY ?? 0;
      const targetZ = camera.targetZ ?? 0;
      const x = Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance + targetX;
      const y = Math.sin(camera.pitch) * camera.distance + targetY;
      const z = Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance + targetZ;
      camera3d.position.set(x, y, z);
      camera3d.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera3d);
      frameRef.current = requestAnimationFrame(renderLoop);
    };
    frameRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [camera, computedMode, config, effectiveParams, running, speed, title, type, variant, sceneContext]);

  return (
    <div className="stack">
      {computedMode === 'image' ? (
        <ImageStage url={imageUrl} title={title} />
      ) : (
        <>
          <div className="simulation-box canvas-box kntech-sim-shell sim-canvas-shell">
            <div ref={mountRef} className="three-stage" />
            <div className="sim-overlay-layer">
              {simState.overlays.map((item) => (
                <div
                  key={item.key}
                  className="sim-overlay-chip"
                  style={{ left: `${item.x}%`, top: `${item.y}%`, borderColor: item.color || '#93c5fd' }}
                >
                  <strong>{t(item.label)}</strong>
                  <span>{t(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="badge-row">{badges.map((item, idx) => <span key={item} className={`badge badge-variant-${idx % 4}`}>{t(item)}</span>)}</div>
          <div className="sim-preset-row">
            {cameraPresets.map((preset) => (
              <button
                key={preset.key}
                className="sim-preset-btn"
                onClick={() => setCamera({
                  yaw: preset.yaw,
                  pitch: preset.pitch,
                  distance: preset.distance,
                  targetX: preset.targetX ?? 0,
                  targetY: preset.targetY ?? 0,
                  targetZ: preset.targetZ ?? 0
                })}
              >
                {t(preset.label)}
              </button>
            ))}
          </div>
          <div className="sim-toolbar">
            <button className="sim-btn" onClick={() => setRunning((v) => !v)}>
              {running ? <Pause size={18} /> : <Play size={18} />}
              <span>{running ? 'Tam dung' : 'Chay tiep'}</span>
            </button>
            <div className="sim-divider" />
            <button className="sim-btn" onClick={() => setSpeed((v) => clamp(v - 0.25, 0.5, 3))}><Rewind size={18} /><span>Cham hon</span></button>
            <button className="sim-btn" onClick={() => setSpeed((v) => clamp(v + 0.25, 0.5, 3))}><FastForward size={18} /><span>Nhanh hon</span></button>
            <div className="sim-divider" />
            <button className="sim-btn" onClick={() => setCamera((prev) => ({ ...prev, yaw: prev.yaw - 0.24 }))}><RotateCcw size={18} /><span>Quay trai</span></button>
            <button className="sim-btn" onClick={() => setCamera((prev) => ({ ...prev, yaw: prev.yaw + 0.24 }))}><RotateCw size={18} /><span>Quay phai</span></button>
            <button className="sim-btn" onClick={() => setCamera((prev) => ({ ...prev, pitch: clamp(prev.pitch + 0.12, -0.15, 1.1) }))}><ArrowUpCircle size={18} /><span>Nang camera</span></button>
            <button className="sim-btn" onClick={() => setCamera((prev) => ({ ...prev, pitch: clamp(prev.pitch - 0.12, -0.15, 1.1) }))}><ArrowDownCircle size={18} /><span>Ha camera</span></button>
            <button className="sim-btn" onClick={() => setCamera((prev) => ({ ...prev, distance: clamp(prev.distance - 1, cameraBounds.minDistance, cameraBounds.maxDistance) }))}><ZoomIn size={18} /><span>Zoom in</span></button>
            <button className="sim-btn" onClick={() => setCamera((prev) => ({ ...prev, distance: clamp(prev.distance + 1, cameraBounds.minDistance, cameraBounds.maxDistance) }))}><ZoomOut size={18} /><span>Zoom out</span></button>
            <div className="sim-divider" />
            <button className="sim-btn" onClick={() => setCamera(defaultCameraState())}><Maximize2 size={18} /><span>Reset goc nhin</span></button>
            <span className="sim-speed-badge">Live x{speed.toFixed(2)}</span>
          </div>
          {controls.length ? (
            <div className="sim-control-grid">
              {controls.map((control) => {
                const value = num(effectiveParams[control.key], control.min);
                return (
                  <label key={control.key} className="sim-slider-card">
                    <div className="row-between">
                      <strong>{t(control.label)}</strong>
                      <span>{formatMetricValue(value, control.unit ? ` ${control.unit}` : '')}</span>
                    </div>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={value}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setControlledParams((prev) => ({ ...prev, [control.key]: next }));
                      }}
                    />
                  </label>
                );
              })}
            </div>
          ) : null}
          <div className="sim-timeline-card">
            <div className="row-between">
              <strong>Timeline</strong>
              <span>{formatMetricValue(simState.time, ' s')} / {formatMetricValue(simState.duration, ' s')}</span>
            </div>
            <input
              type="range"
              min={0}
              max={simState.duration}
              step={0.01}
              value={displayTime}
              onChange={(e) => {
                const next = Number(e.target.value);
                currentTimeRef.current = next;
                setDisplayTime(next);
              }}
            />
          </div>
          {simState.vectors.length ? (
            <div className="sim-vector-row">
              {simState.vectors.map((item) => (
                <div key={item.label} className="sim-vector-card">
                  <span className="sim-vector-swatch" style={{ background: item.color }} />
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="sim-dashboard-grid">
            {simState.metrics.map((item) => (
              <div key={item.label} className="sim-metric-card">
                  <strong>{t(item.label)}</strong>
                  <span>{t(item.value)}</span>
                  <small>{t(item.hint)}</small>
              </div>
            ))}
          </div>
          <div className="sim-help-grid">
            <div className="note-box">
              <strong>{'B\u1ea3ng th\u00f4ng s\u1ed1 \u0111ang d\u00f9ng'}</strong>
              <div className="sim-chip-row">
                <span className="sim-chip sim-chip-primary">{t(visualModeLabel)}</span>
                {paramEntries.map(([key, value]) => <span key={key} className="sim-chip">{t(firstString(key, 'param'))}: {t(String(value))}</span>)}
              </div>
            </div>
            <div className="note-box">
              <strong>{'H\u01b0\u1edbng d\u1eabn thao t\u00e1c nhanh'}</strong>
              <div className="sim-tip-list">
                {tips.map((tip) => <span key={tip}>{t(tip)}</span>)}
              </div>
            </div>
          </div>
          <div className="sim-help-grid">
            <div className="note-box"><strong>{t(displayLabel)}</strong> {'scene \u0111ang ch\u1ea1y theo '}<strong>{sceneContext.sceneId}</strong>{', n\u00ean \u0111\u1ea1o c\u1ee5, ph\u1ee5 ki\u1ec7n v\u00e0 nh\u1ecbp chuy\u1ec3n \u0111\u1ed9ng \u0111\u01b0\u1ee3c seed ri\u00eang theo t\u1eebng b\u00e0i.'}</div>
            <div className="note-box">{'Chi\u1ebfn l\u01b0\u1ee3c theo b\u00e0i: '}{t(lessonFocus)}</div>
          </div>
          <div className="sim-help-grid">
            {annotations.map((item) => (
              <div key={item.label} className="note-box">
                <strong>{t(item.label)}</strong>
                <div>{t(item.note)}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="note-box">{t(title)}{ ': ph\u1ea7n ' }<strong>{'Chi\u1ebfn l\u01b0\u1ee3c'}</strong>{' \u0111\u01b0\u1ee3c g\u1eafn v\u00e0o `sceneId` + visual profile \u0111\u1ec3 m\u1ed7i b\u00e0i c\u00f3 set n\u1ec1n, th\u00e0nh ph\u1ea7n ch\u00fa th\u00edch v\u00e0 nh\u1ecbp motion kh\u00e1c nhau.'}</div>
    </div>
  );
}


