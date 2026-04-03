type AppEdition = 'standard' | 'commercial';

function readEnv(key: string, fallback = '') {
  const value = (import.meta as any)?.env?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readBool(key: string, fallback: boolean) {
  const value = readEnv(key);
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

const brandName = readEnv('VITE_APP_BRAND', 'KNTech');
const productName = readEnv('VITE_APP_PRODUCT', 'Physics Lab');
const supportEmail = readEnv('VITE_SUPPORT_EMAIL', 'support@kntech.site');
const supportBlurb = readEnv('VITE_SUPPORT_BLURB', 'Dành cho trường, trung tâm và đội ngũ học thuật cần vận hành nội dung sâu.');
const edition = (readEnv('VITE_APP_EDITION', 'commercial').toLowerCase() === 'standard' ? 'standard' : 'commercial') as AppEdition;

export const webAppConfig = {
  edition,
  brandName,
  productName,
  systemName: readEnv('VITE_SYSTEM_NAME', `${brandName} ${productName}`),
  supportEmail,
  supportBlurb,
  aiAssistantName: readEnv('VITE_AI_ASSISTANT_NAME', `Nova ${brandName}`),
  aiConsoleTitle: readEnv('VITE_AI_CONSOLE_TITLE', 'Chat với AI'),
  aiConsoleIntro: readEnv('VITE_AI_CONSOLE_INTRO', 'Giao diện này hoạt động như một form chat. Lịch sử chat được lưu và tải lại tự động. Ảnh được kiểm MIME, giới hạn dung lượng, nén lại và loại bớt metadata ngay trên trình duyệt trước khi gửi.'),
  aiConsoleConversationTitle: readEnv('VITE_AI_CONSOLE_CONVERSATION_TITLE', 'Chat với AI'),
  aiConsoleConsentTitle: readEnv('VITE_AI_CONSOLE_CONSENT_TITLE', `Đồng ý thu thập dữ liệu phục vụ cho kho dữ liệu ${brandName}`),
  aiConsoleConsentBody: readEnv('VITE_AI_CONSOLE_CONSENT_BODY', `Nếu bạn đồng ý, nội dung chat và dữ liệu đính kèm có thể được dùng để cải thiện kho dữ liệu và chất lượng trả lời của ${brandName}.`),
  aiConsoleConsentAcceptedNote: readEnv('VITE_AI_CONSOLE_CONSENT_ACCEPTED_NOTE', `Bạn đã đồng ý cho ${brandName} sử dụng dữ liệu chat để phục vụ kho dữ liệu nội bộ.`),
  aiConsoleSnoozeLabel: readEnv('VITE_AI_CONSOLE_SNOOZE_LABEL', 'Không hỏi lại sau 1 giờ'),
  showInstaller: readBool('VITE_ENABLE_INSTALLER', true),
  features: {
    aiConsole: readBool('VITE_ENABLE_AI_CONSOLE', true),
    chat: readBool('VITE_ENABLE_CHAT', true),
    examBuilder: readBool('VITE_ENABLE_EXAM_BUILDER', true)
  }
} as const;

export function appTitle(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
