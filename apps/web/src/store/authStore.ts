import { create } from 'zustand';

type User = { id: string; email: string; tenHienThi: string; vaiTro: 'HOC_SINH' | 'GIAO_VIEN' | 'QUAN_TRI_VIEN' | 'CMS_ROOT' } | null;
interface AuthState {
  accessToken: string;
  user: User;
  setSession: (token: string, user: NonNullable<User>) => void;
  hydrate: () => void;
  logout: () => void;
}

const KEY = 'vatly-auth';

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: '',
  user: null,
  setSession: (accessToken, user) => {
    localStorage.setItem(KEY, JSON.stringify({ accessToken, user }));
    set({ accessToken, user });
  },
  hydrate: () => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try { set(JSON.parse(raw)); } catch {}
  },
  logout: () => {
    localStorage.removeItem(KEY);
    set({ accessToken: '', user: null });
  }
}));
