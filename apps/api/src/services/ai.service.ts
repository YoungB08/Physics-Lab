import { env, aiAvailability, loadedEnvPaths } from '../config/env.js';
import { GeminiProvider } from '../providers/gemini.provider.js';
import { OpenAIProvider } from '../providers/openai.provider.js';
import { LocalAIProvider } from '../providers/local.provider.js';
import type { AIRequestInput, AIProvider } from '../providers/ai.provider.js';
import { normalizeAIText } from '../providers/ai.provider.js';
import { prisma } from '../config/prisma.js';
import { logSystem } from './system.service.js';

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
