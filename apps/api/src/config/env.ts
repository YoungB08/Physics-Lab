import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, '../../');
const rootDir = path.resolve(apiDir, '../..');

const candidateEnvPaths = [path.join(rootDir, '.env')];

for (const envPath of candidateEnvPaths) {
  dotenv.config({ path: envPath, override: false });
}

const schema = z.object({
  TEN_HE_THONG: z.string().default('KNTech Physics Lab'),
  CHE_DO: z.string().default('development'),
  CONG_API: z.coerce.number().default(4000),
  URL_API: z.string().default('http://localhost:4000'),
  URL_GIAO_DIEN: z.string().default('http://localhost:5173'),
  URL_API_WEB: z.string().default('https://api.kntech.site'),
  URL_GIAO_DIEN_WEB: z.string().default('https://kntech.site'),
  DATABASE_URL: z.string().default('mysql://root:root@localhost:3306/vatly_thpt'),
  DATABASE_URL_WEB: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().default('doi_secret_nay'),
  JWT_REFRESH_SECRET: z.string().default('doi_secret_nay_lan_2'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_MAC_DINH: z.enum(['gpt', 'gemini']).default('gpt'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_KEY_ALT: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5.4'),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3-pro-preview'),
  CHO_PHEP_AI_GPT: z.string().default('true'),
  CHO_PHEP_AI_GEMINI: z.string().default('true'),
  DUONG_DAN_UPLOAD: z.string().default('./uploads')
});

const parsed = schema.parse(process.env);
const databaseUrl = parsed.CHE_DO === 'web' && parsed.DATABASE_URL_WEB?.trim()
  ? parsed.DATABASE_URL_WEB.trim()
  : parsed.DATABASE_URL.trim();
const publicApiUrl = (parsed.CHE_DO === 'web' ? parsed.URL_API_WEB : parsed.URL_API).trim().replace(/\/+$/, '');
const publicWebUrl = (parsed.CHE_DO === 'web' ? parsed.URL_GIAO_DIEN_WEB : parsed.URL_GIAO_DIEN).trim().replace(/\/+$/, '');

process.env.DATABASE_URL = databaseUrl;

export const env = {
  ...parsed,
  DATABASE_URL: databaseUrl,
  PUBLIC_API_URL: publicApiUrl,
  PUBLIC_WEB_URL: publicWebUrl,
  OPENAI_API_KEY: (parsed.OPENAI_API_KEY || parsed.OPENAI_API_KEY_ALT || process.env.OPENAI_APIKEY || '').trim() || undefined,
  GEMINI_API_KEY: (parsed.GEMINI_API_KEY || parsed.GOOGLE_API_KEY || '').trim() || undefined
};

export const aiAvailability = {
  gpt: Boolean(env.OPENAI_API_KEY) && env.CHO_PHEP_AI_GPT === 'true',
  gemini: Boolean(env.GEMINI_API_KEY) && env.CHO_PHEP_AI_GEMINI === 'true'
};

export const loadedEnvPaths = candidateEnvPaths;
