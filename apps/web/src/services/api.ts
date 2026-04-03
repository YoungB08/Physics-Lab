import { useAuthStore } from '../store/authStore';

function resolveApiBase() {
  const fromEnv = (import.meta as any)?.env?.VITE_API_BASE;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim().replace(/\/$/, '');
  return 'http://localhost:4000';
}

const API_BASE = resolveApiBase();
const API = `${API_BASE}/api`;

function normalizeErrorMessage(value: unknown, fallback = 'Co loi xay ra.') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(normalizeErrorMessage(data.message));
  return data as T;
}

async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(normalizeErrorMessage(data.message));
  }
  return res.blob();
}

export const api = {
  systemInfo: () => request<any>('/he-thong/thong-tin'),
  systemInstallStatus: () => request<{ installed: boolean }>('/he-thong/trang-thai-cai-dat'),
  runInstaller: (payload: any) => request<any>('/he-thong/cai-dat', { method: 'POST', body: JSON.stringify(payload) }),
  cmsData: () => request<any>('/he-thong/cms'),
  updateCmsSettings: (payload: any) => request<any>('/he-thong/cms/cau-hinh', { method: 'PUT', body: JSON.stringify(payload) }),
  saveCmsPage: (payload: any) => request<any>('/he-thong/cms/trang', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCmsPage: (id: string) => request<any>(`/he-thong/cms/trang/${id}`, { method: 'DELETE' }),
  updateCmsLesson: (payload: any) => request<any>('/he-thong/cms/bai-hoc', { method: 'PUT', body: JSON.stringify(payload) }),
  updateCmsLessonSections: (payload: any) => request<any>('/he-thong/cms/bai-hoc/noi-dung', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<any>('/upload', { method: 'POST', body: form });
  },
  dangNhap: (payload: { email: string; matKhau: string }) => request<any>('/xac-thuc/dang-nhap', { method: 'POST', body: JSON.stringify(payload) }),
  dangKy: (payload: { email: string; tenHienThi: string; matKhau: string; vaiTro: 'HOC_SINH' | 'GIAO_VIEN'; lopHoc?: string }) => request<any>('/xac-thuc/dang-ky', { method: 'POST', body: JSON.stringify(payload) }),
  getChuongTrinh: () => request<any[]>('/hoc-lieu/chuong-trinh'),
  getBaiHoc: (slug: string) => request<any>(`/hoc-lieu/bai-hoc/${slug}`),
  hoiAI: (payload: any) => request<any>('/ai', { method: 'POST', body: JSON.stringify(payload) }),
  aiStatus: () => request<any>('/ai/trang-thai'),
  chatConversations: (lessonSlug?: string) => request<any[]>(`/chat/conversations${lessonSlug ? `?lessonSlug=${encodeURIComponent(lessonSlug)}` : ''}`),
  createChatConversation: (payload: { lessonSlug?: string; kind?: 'lesson_1_1' | 'ai_console'; tieuDe?: string; firstMessage?: string }) => request<any>('/chat/conversations', { method: 'POST', body: JSON.stringify(payload) }),
  chatConversationDetail: (id: string) => request<any>(`/chat/conversations/${id}`),
  sendChatMessage: (id: string, payload: { noiDung: string; provider?: 'auto' | 'gpt' | 'gemini'; hinhAnhBase64?: string; boCanh?: Record<string, any> }) => request<any>(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(payload) }),
  taoDe: (payload: any) => request<any>('/thi-cu/tao-de', { method: 'POST', body: JSON.stringify(payload) }),
  examList: () => request<any[]>('/thi-cu/danh-sach'),
  examDetail: (id: string) => request<any>(`/thi-cu/chi-tiet/${id}`),
  examPdf: (id: string) => requestBlob(`/thi-cu/xuat-pdf/${id}`),
  updateExam: (id: string, payload: any) => request<any>(`/thi-cu/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  examAction: (id: string, action: 'confirm' | 'start' | 'stop' | 'lock' | 'delete') => request<any>(`/thi-cu/${id}/${action}`, { method: 'POST' }),
  joinExam: (qrToken: string) => request<any>(`/thi-cu/phong-thi/${qrToken}/vao`, { method: 'POST' }),
  examRoomStatus: (qrToken: string) => request<any>(`/thi-cu/phong-thi/${qrToken}/trang-thai`),
  saveAnswer: (attemptId: string, payload: any) => request<any>(`/thi-cu/bai-lam/${attemptId}/cau`, { method: 'POST', body: JSON.stringify(payload) }),
  tabOut: (attemptId: string) => request<any>(`/thi-cu/bai-lam/${attemptId}/tab-out`, { method: 'POST' }),
  integrityEvent: (attemptId: string, payload: any) => request<any>(`/thi-cu/bai-lam/${attemptId}/integrity`, { method: 'POST', body: JSON.stringify(payload) }),
  submitAttempt: (attemptId: string) => request<any>(`/thi-cu/bai-lam/${attemptId}/nop`, { method: 'POST' }),
  thongKe: () => request<any>('/thi-cu/thong-ke'),
  adminTongQuan: () => request<any>('/quan-tri/tong-quan'),
  adminUsers: () => request<any[]>('/quan-tri/nguoi-dung'),
  adminCreateUser: (payload: any) => request<any>('/quan-tri/nguoi-dung', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateUser: (id: string, payload: any) => request<any>(`/quan-tri/nguoi-dung/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteUser: (id: string) => request<any>(`/quan-tri/nguoi-dung/${id}`, { method: 'DELETE' })
};
