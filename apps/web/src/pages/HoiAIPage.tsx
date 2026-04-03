import { useEffect, useRef, useState } from 'react';
import { MarkdownMath } from '../components/MarkdownMath';
import { LoadingButton } from '../components/LoadingButton';
import { Avatar } from '../components/Avatar';
import { api } from '../services/api';
import { webAppConfig } from '../config/webAppConfig';

type Provider = 'auto' | 'gpt' | 'gemini';

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
  providerLabel?: string;
  imageUrl?: string;
  pending?: boolean;
};

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_DIMENSION = 1600;
const CONSENT_KEY = 'kntech-ai-data-consent';
const CONSENT_SNOOZE_KEY = 'kntech-ai-data-consent-snooze-until';

function responseText(response: any) {
  const detail = String(response?.du_lieu?.giai_thich || '').trim();
  if (detail) return detail;
  const blocks = response?.du_lieu?.noi_dung_chinh;
  if (Array.isArray(blocks) && blocks.length) return blocks.join('\n\n');
  return String(response?.du_lieu?.tom_tat || '').trim();
}

function summaryText(response: any) {
  const summary = String(response?.du_lieu?.tom_tat || '').trim();
  const detail = responseText(response);
  if (!summary) return '';
  if (detail && summary === detail.trim()) return '';
  return summary;
}

function nowLabel() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(value?: string) {
  if (!value) return nowLabel();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return nowLabel();
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể giải mã ảnh đã chọn.'));
    img.src = dataUrl;
  });
}

async function sanitizeImage(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) throw new Error(`Ảnh vượt quá ${MAX_IMAGE_SIZE_MB}MB.`);

  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể xử lý ảnh trên trình duyệt này.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function welcomeMessage(): ChatItem {
  return {
    id: 'welcome',
    role: 'assistant',
    text: `Chào bạn, mình là **${webAppConfig.aiAssistantName}**. Bạn có thể hỏi bằng văn bản hoặc gửi ảnh bài tập. Ảnh sẽ được kiểm tra định dạng, nén lại và loại bớt metadata trước khi gửi.`,
    at: nowLabel(),
    providerLabel: 'system'
  };
}

function toChatMessages(detail: any): ChatItem[] {
  const messages = Array.isArray(detail?.messages) ? detail.messages : [];
  return messages.map((item: any) => ({
    id: String(item.id || Math.random()),
    role: item.vaiTro === 'user' ? 'user' : 'assistant',
    text: String(item.noiDung || ''),
    at: formatTime(item.createdAt),
    providerLabel: item.vaiTro === 'assistant' ? String(item.provider || 'AI') : undefined,
    imageUrl: item.hinhAnhBase64 ? String(item.hinhAnhBase64) : undefined
  }));
}

export function HoiAIPage() {
  const [provider] = useState<Provider>('auto');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [messages, setMessages] = useState<ChatItem[]>([welcomeMessage()]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState('');
  const [pendingImage, setPendingImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [dataConsent, setDataConsent] = useState(false);
  const [showConsentPrompt, setShowConsentPrompt] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function refreshConversations(activeId?: string) {
    const list = await api.chatConversations();
    const aiConsoleConversations = Array.isArray(list) ? list.filter((item) => item?.kind === 'ai_console') : [];
    setConversations(aiConsoleConversations);
    const nextId = activeId || aiConsoleConversations[0]?.id || '';
    if (!nextId) {
      setConversationId('');
      setMessages([welcomeMessage()]);
      return;
    }
    const detail = await api.chatConversationDetail(nextId);
    const mapped = toChatMessages(detail);
    setConversationId(nextId);
    setMessages(mapped.length ? mapped : [welcomeMessage()]);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      try {
        const consent = window.localStorage.getItem(CONSENT_KEY) === 'accepted';
        const snoozeUntil = Number(window.localStorage.getItem(CONSENT_SNOOZE_KEY) || '0');
        if (!cancelled) {
          setDataConsent(consent);
          setShowConsentPrompt(!consent && Date.now() >= snoozeUntil);
        }
      } catch {
        if (!cancelled) setShowConsentPrompt(true);
      }

      try {
        const list = await api.chatConversations();
        if (cancelled) return;
        const aiConsoleConversations = Array.isArray(list) ? list.filter((item) => item?.kind === 'ai_console') : [];
        setConversations(aiConsoleConversations);
        const latest = aiConsoleConversations[0];
        if (!latest?.id) {
          setMessages([welcomeMessage()]);
          setConversationId('');
          return;
        }
        const detail = await api.chatConversationDetail(latest.id);
        if (cancelled) return;
        const mapped = toChatMessages(detail);
        setConversationId(latest.id);
        setMessages(mapped.length ? mapped : [welcomeMessage()]);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          setMessages([welcomeMessage()]);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadInitialState();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingImage, showConsentPrompt]);

  async function handlePickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      const dataUrl = await sanitizeImage(file);
      setPendingImage({ name: file.name, dataUrl });
    } catch (e: any) {
      setError(e.message);
      setPendingImage(null);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function acceptDataConsent() {
    setDataConsent(true);
    setShowConsentPrompt(false);
    try {
      window.localStorage.setItem(CONSENT_KEY, 'accepted');
      window.localStorage.removeItem(CONSENT_SNOOZE_KEY);
    } catch {
      // noop
    }
  }

  function snoozeConsentPrompt() {
    const until = Date.now() + 60 * 60 * 1000;
    setShowConsentPrompt(false);
    try {
      window.localStorage.setItem(CONSENT_SNOOZE_KEY, String(until));
    } catch {
      // noop
    }
  }

  async function startNewConversation() {
    setConversationId('');
    setResponse(null);
    setQuestion('');
    setPendingImage(null);
    setError('');
    setMessages([welcomeMessage()]);
  }

  async function openConversation(id: string) {
    try {
      setHistoryLoading(true);
      setError('');
      const detail = await api.chatConversationDetail(id);
      const mapped = toChatMessages(detail);
      setConversationId(id);
      setMessages(mapped.length ? mapped : [welcomeMessage()]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed && !pendingImage) return;
    try {
      setLoading(true);
      setError('');
      setResponse(null);
      const messageText = trimmed || 'Phân tích giúp mình ảnh này.';
      const messageId = `user-${Date.now()}`;
      const pendingId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          role: 'user',
          text: messageText,
          at: nowLabel(),
          imageUrl: pendingImage?.dataUrl
        },
        {
          id: pendingId,
          role: 'assistant',
          text: 'Đang phân tích yêu cầu...',
          at: nowLabel(),
          providerLabel: provider === 'auto' ? 'auto' : provider.toUpperCase(),
          pending: true
        }
      ]);

      let nextConversationId = conversationId;
      if (!nextConversationId) {
        const created = await api.createChatConversation({
          kind: 'ai_console',
          tieuDe: webAppConfig.aiConsoleConversationTitle,
          firstMessage: messageText
        });
        nextConversationId = String(created?.id || '');
        setConversationId(nextConversationId);
      }

      const result = await api.sendChatMessage(nextConversationId, {
        noiDung: messageText,
        provider,
        hinhAnhBase64: pendingImage?.dataUrl,
        boCanh: {
          chatMode: 'ai_console',
          latestMessage: messageText,
          topic: 'vat-ly-thpt',
          hasImage: Boolean(pendingImage),
          choPhepThuThapDuLieu: dataConsent
        }
      });

      setResponse({ trace: result.trace || null });
      const detail = await api.chatConversationDetail(nextConversationId);
      const mapped = toChatMessages(detail);
      setMessages(mapped.length ? mapped : [welcomeMessage()]);
      await refreshConversations(nextConversationId);
      setQuestion('');
      setPendingImage(null);
    } catch (e: any) {
      setError(e.message);
      setMessages((prev) => prev.filter((item) => !item.pending));
    } finally {
      setLoading(false);
    }
  }

  const summary = summaryText(response);

  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-cms">
        <div className="brand-kicker">{webAppConfig.brandName} AI Console</div>
        <h1 className="page-title">{webAppConfig.aiConsoleTitle}</h1>
        <p>{webAppConfig.aiConsoleIntro}</p>
      </div>

      <div className="card stack">
        <div className="row-between wrap-mobile">
          <h3>Phiên chat</h3>
          <div className="row-between wrap-mobile" style={{ gap: '8px' }}>
            {historyLoading ? <span className="badge badge-soft">Đang tải lịch sử...</span> : null}
            <button className="button button-secondary" type="button" onClick={startNewConversation}>
              Chat mới
            </button>
            {response?.trace?.usedExternal ? (
              <span className="badge badge-variant-2">AI ngoài</span>
            ) : response ? (
              <span className="badge badge-variant-3">Fallback nội bộ</span>
            ) : null}
          </div>
        </div>

        {conversations.length ? (
          <div className="stack" style={{ gap: '8px' }}>
            {conversations.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === conversationId ? 'button lesson-chat-thread active-thread' : 'button lesson-chat-thread'}
                onClick={() => openConversation(String(item.id))}
              >
                <strong>{item.tieuDe || webAppConfig.aiConsoleConversationTitle}</strong>
                <small>{item.tomTat || 'Chưa có tin nhắn'}</small>
              </button>
            ))}
          </div>
        ) : null}

        {error ? <div className="error-box">{error}</div> : null}
        {response?.trace?.fallbackReason ? (
          <div className="error-box">External AI lỗi, hệ thống đã tự fallback: {response.trace.fallbackReason}</div>
        ) : null}
        {summary ? <div className="response-box"><strong>{response?.du_lieu?.tieu_de || 'Tóm tắt'}</strong><div className="muted">{summary}</div></div> : null}
        <div className="note-box">
          Ảnh hỗ trợ: JPG, PNG, WebP. Giới hạn {MAX_IMAGE_SIZE_MB}MB. Ảnh sẽ được thu gọn tối đa {MAX_IMAGE_DIMENSION}px trước khi gửi.
        </div>

        <div className="lesson-chat-box">
          {messages.map((item) => (
            <div key={item.id} className={`chat-row ${item.role}`}>
              {item.role !== 'user' && <Avatar name={webAppConfig.aiAssistantName} variant="brand" />}
              <div className={`chat-bubble ${item.role === 'user' ? 'user' : 'assistant'} ai-console-bubble`}>
                <div className="chat-meta">
                  <strong>{item.role === 'user' ? 'Bạn' : webAppConfig.aiAssistantName}</strong>
                  <span>{item.providerLabel || item.at}</span>
                </div>
                {item.imageUrl ? <img src={item.imageUrl} alt="Ảnh đã chọn" style={{ maxWidth: '240px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #cfe0ff' }} /> : null}
                <MarkdownMath content={item.text} />
              </div>
              {item.role === 'user' && <Avatar name="Bạn" variant="gradient" />}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {pendingImage ? (
            <div className="response-box stack" style={{ padding: '12px' }}>
              <div className="row-between wrap-mobile">
                <strong>Ảnh đính kèm</strong>
                <button className="button button-secondary" type="button" onClick={() => setPendingImage(null)}>Bỏ ảnh</button>
              </div>
              <div className="muted">{pendingImage.name}</div>
              <img src={pendingImage.dataUrl} alt="Preview" style={{ maxWidth: '280px', borderRadius: '14px', border: '1px solid #cfe0ff' }} />
            </div>
          ) : null}

          {showConsentPrompt ? (
            <div className="response-box stack" style={{ padding: '12px' }}>
              <strong>{webAppConfig.aiConsoleConsentTitle}</strong>
              <div className="muted">
                {webAppConfig.aiConsoleConsentBody}
              </div>
              <div className="row-between wrap-mobile">
                <button className="button button-secondary" type="button" onClick={acceptDataConsent}>
                  Tôi đồng ý
                </button>
                <button className="button button-ghost" type="button" onClick={snoozeConsentPrompt}>
                  {webAppConfig.aiConsoleSnoozeLabel}
                </button>
              </div>
            </div>
          ) : dataConsent ? (
            <div className="note-box">{webAppConfig.aiConsoleConsentAcceptedNote}</div>
          ) : null}

          <textarea className="textarea" placeholder="Nhập câu hỏi hoặc gửi ảnh bài tập..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          <div className="row-between wrap-mobile">
            <div className="ai-upload-row">
              <input ref={fileRef} className="ai-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePickImage} />
              <button className="button button-secondary" type="button" onClick={() => fileRef.current?.click()}>
                Chọn ảnh
              </button>
              {pendingImage ? <span className="muted">{pendingImage.name}</span> : null}
            </div>
            <LoadingButton onClick={ask} loading={loading} loadingText="Đang gửi AI..." disabled={(!question.trim() && !pendingImage) || loading}>
              Gửi câu hỏi
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
}
