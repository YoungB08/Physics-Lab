import { env, aiAvailability, loadedEnvPaths } from '../config/env.js';
import { GeminiProvider } from '../providers/gemini.provider.js';
import { OpenAIProvider } from '../providers/openai.provider.js';
import { LocalAIProvider } from '../providers/local.provider.js';
import type { AIRequestInput, AIProvider } from '../providers/ai.provider.js';
import { normalizeAIText } from '../providers/ai.provider.js';
import { prisma } from '../config/prisma.js';
import { logSystem } from './system.service.js';

function normalizeForLookup(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const FOUNDER_PROFILE = {
  name: 'Trần Khôi Nguyên',
  alias: 'KhNguyenZ',
  ownerTitle: 'Chủ hệ thống và người đại diện KNTech',
  skills: ['PHP', 'C#', 'C++', 'React', 'JavaScript', 'MySQL', 'Python'],
  experience: {
    game: '4 năm kinh nghiệm lập trình game',
    web: '2 năm kinh nghiệm lập trình web',
    mobile: '4 tháng kinh nghiệm lập trình mobile'
  },
  projects: [
    {
      name: 'KN-Medic',
      url: 'https://github.com/YoungB08/KN-Medic',
      note: 'Sản phẩm bởi KhNguyenZ, dự án dành cho cuộc thi Sáng Tạo Thanh Thiếu Niên Lâm Đồng'
    },
    {
      name: 'Physics-Lab',
      url: 'https://github.com/YoungB08/Physics-Lab',
      note: 'Nền tảng học tập và AI/Vật lý'
    },
    {
      name: 'GVO-RP',
      url: 'https://github.com/KhNguyenZ/GVO-RP',
      note: 'Dự án game'
    }
  ],
  facebook: 'https://www.facebook.com/it.knz'
} as const;

function buildIdentityAnswer(input: AIRequestInput) {
  const normalized = normalizeForLookup(String(input.boCanh?.latestMessage || input.noiDung || ''));
  if (!normalized) return null;

  const asksOwner = normalized.includes('chu la ai') || normalized.includes('chu so huu la ai') || normalized.includes('owner la ai');
  const asksTranKhoiNguyen = normalized.includes('tran khoi nguyen la ai') || normalized.includes('tran khoi nguyen');
  const asksKntech = normalized.includes('kntech la gi') || normalized.includes('kntech la ai') || normalized === 'kntech';

  if (!asksOwner && !asksTranKhoiNguyen && !asksKntech) return null;

  const brandName = 'KNTech';
  const systemName = env.TEN_HE_THONG || `${brandName} Physics Lab`;
  const lines: string[] = [];

  if (asksKntech) {
    lines.push(
      `**${brandName}** là tên thương hiệu đang được dùng trong hệ thống này.`,
      `${brandName} gắn với sản phẩm **${systemName}** và trợ lý **Nova ${brandName}**.`,
      `${brandName} do **${FOUNDER_PROFILE.name}** đại diện/phát triển trong ngữ cảnh thông tin nội bộ hiện tại.`
    );
  }

  if (asksOwner) {
    lines.push(
      `Chủ hệ thống và người đại diện KNTech là **${FOUNDER_PROFILE.name}**.`,
      `Vai trò nội bộ: **${FOUNDER_PROFILE.ownerTitle}**.`
    );
  }

  if (asksTranKhoiNguyen) {
    lines.push(
      `**${FOUNDER_PROFILE.name}** (${FOUNDER_PROFILE.alias}) là ${FOUNDER_PROFILE.ownerTitle}.`,
      `Kỹ năng chính: ${FOUNDER_PROFILE.skills.join(', ')}.`,
      `Kinh nghiệm: ${FOUNDER_PROFILE.experience.game}; ${FOUNDER_PROFILE.experience.web}; ${FOUNDER_PROFILE.experience.mobile}.`,
      'Dự án nổi bật:',
      ...FOUNDER_PROFILE.projects.map((project) => `- [${project.name}](${project.url}): ${project.note}`),
      `Facebook: ${FOUNDER_PROFILE.facebook}`
    );
  }

  if ((asksOwner || asksTranKhoiNguyen || asksKntech) && !asksTranKhoiNguyen) {
    lines.push(
      `Kỹ năng chính của ${FOUNDER_PROFILE.name}: ${FOUNDER_PROFILE.skills.join(', ')}.`,
      `Kinh nghiệm: ${FOUNDER_PROFILE.experience.game}; ${FOUNDER_PROFILE.experience.web}; ${FOUNDER_PROFILE.experience.mobile}.`
    );
  }

  return {
    loai_tac_vu: input.loaiTacVu,
    nha_cung_cap: 'local' as const,
    trang_thai: 'thanh_cong' as const,
    du_lieu: {
      tieu_de: `${brandName} - thông tin nhận diện`,
      tom_tat: `Thông tin nội bộ về ${FOUNDER_PROFILE.name}, KNTech và vai trò đại diện/chủ hệ thống.`,
      noi_dung_chinh: lines,
      goi_y: [
        `Bạn có thể hỏi tiếp: "${brandName} dùng để làm gì?"`,
        `Hoặc hỏi tiếp: "${FOUNDER_PROFILE.name} có những dự án nào?"`
      ],
      dap_an: '',
      giai_thich: lines.join('\n')
    },
    meta: {
      phien_ban_schema: '1.0' as const,
      thoi_gian_xu_ly_ms: 5,
      can_kiem_duyet: false,
      used_external: false,
      model: 'kntech-identity-guard'
    }
  };
}

function resolveProvider(provider: 'gpt' | 'gemini' | 'auto'): { provider: AIProvider; resolved: 'gpt' | 'gemini' | 'local'; external: boolean } {
  if (provider === 'gpt') return aiAvailability.gpt ? { provider: new OpenAIProvider(), resolved: 'gpt', external: true } : { provider: new LocalAIProvider(), resolved: 'local', external: false };
  if (provider === 'gemini') return aiAvailability.gemini ? { provider: new GeminiProvider(), resolved: 'gemini', external: true } : { provider: new LocalAIProvider(), resolved: 'local', external: false };
  if (env.AI_MAC_DINH === 'gpt' && aiAvailability.gpt) return { provider: new OpenAIProvider(), resolved: 'gpt', external: true };
  if (env.AI_MAC_DINH === 'gemini' && aiAvailability.gemini) return { provider: new GeminiProvider(), resolved: 'gemini', external: true };
  if (aiAvailability.gpt) return { provider: new OpenAIProvider(), resolved: 'gpt', external: true };
  if (aiAvailability.gemini) return { provider: new GeminiProvider(), resolved: 'gemini', external: true };
  return { provider: new LocalAIProvider(), resolved: 'local', external: false };
}

export async function runAI(input: AIRequestInput, nguoiDungId?: string) {
  const identityAnswer = buildIdentityAnswer(input);
  if (identityAnswer) {
    if (nguoiDungId) {
      await prisma.lichSuAI.create({
        data: {
          nguoiDungId,
          nhaCungCap: identityAnswer.nha_cung_cap,
          loaiTacVu: input.loaiTacVu,
          promptRutGon: input.noiDung.slice(0, 200),
          ketQuaRutGon: normalizeAIText(identityAnswer.du_lieu).slice(0, 300)
        }
      });
    }

    await logSystem({
      nhom: 'ai',
      hanhDong: 'ai_request_identity_guard',
      doiTuong: input.loaiTacVu,
      nguoiDungId: nguoiDungId ?? null,
      duLieuJson: {
        requestedProvider: input.provider,
        resolvedProvider: identityAnswer.nha_cung_cap,
        usedExternal: false,
        model: identityAnswer.meta.model
      }
    });

    return {
      ...identityAnswer,
      meta: {
        ...identityAnswer.meta,
        requested_provider: input.provider
      },
      trace: {
        requestedProvider: input.provider,
        resolvedProvider: identityAnswer.nha_cung_cap,
        selectedProvider: 'local',
        usedExternal: false,
        model: identityAnswer.meta.model,
        fallbackReason: null,
        externalError: null
      }
    };
  }

  const selected = resolveProvider(input.provider);
  let result;
  let fallbackReason: string | null = null;
  let externalError: string | null = null;

  try {
    result = await selected.provider.generate(input);
  } catch (error: any) {
    externalError = error?.message || 'Unknown AI provider error';
    fallbackReason = externalError;
    result = await new LocalAIProvider().generate(input);
  }

  result.meta.requested_provider = input.provider;
  result.meta.used_external = selected.external && result.nha_cung_cap !== 'local';

  if (nguoiDungId) {
    await prisma.lichSuAI.create({
      data: {
        nguoiDungId,
        nhaCungCap: result.nha_cung_cap,
        loaiTacVu: input.loaiTacVu,
        promptRutGon: input.noiDung.slice(0, 200),
        ketQuaRutGon: normalizeAIText(result.du_lieu).slice(0, 300)
      }
    });
  }

  await logSystem({
    nhom: 'ai',
    hanhDong: result.nha_cung_cap === 'local' && selected.external ? 'ai_request_fallback' : 'ai_request_success',
    doiTuong: input.loaiTacVu,
    nguoiDungId: nguoiDungId ?? null,
    duLieuJson: {
      requestedProvider: input.provider,
      resolvedProvider: result.nha_cung_cap,
      usedExternal: result.meta.used_external,
      model: result.meta.model,
      fallbackReason,
      externalError
    }
  });

  return {
    ...result,
    trace: {
      requestedProvider: input.provider,
      resolvedProvider: result.nha_cung_cap,
      selectedProvider: selected.resolved,
      usedExternal: result.meta.used_external,
      model: result.meta.model,
      fallbackReason,
      externalError
    }
  };
}

export const getAIAvailability = () => ({
  ...aiAvailability,
  local: true,
  defaultProvider: env.AI_MAC_DINH,
  models: { gpt: env.OPENAI_MODEL, gemini: env.GEMINI_MODEL },
  envSources: loadedEnvPaths,
  envLoaded: {
    hasOpenAIKey: Boolean(env.OPENAI_API_KEY),
    hasGeminiKey: Boolean(env.GEMINI_API_KEY)
  }
});
