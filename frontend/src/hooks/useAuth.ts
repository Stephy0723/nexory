import { useAuthStore } from '@/store/authStore';
import api from '@/utils/api';
import { getErrorMessage } from '@/utils/formatters';
import type { User } from '@/types';

export function useAuth() {
  const { user, accessToken, setAuth, clear } = useAuthStore();

  const isAuthenticated = !!user && !!accessToken;

  async function login(email: string, password: string): Promise<void> {
    const { data } = await api.post<{ user: User; accessToken: string }>('/auth/login', { email, password });
    setAuth(data.user, data.accessToken);
  }

  async function register(email: string, username: string, password: string): Promise<void> {
    const { data } = await api.post<{ user: User; accessToken: string }>('/auth/register', { email, username, password });
    setAuth(data.user, data.accessToken);
  }

  async function logout(): Promise<void> {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clear();
  }

  return { user, isAuthenticated, login, register, logout, getErrorMessage };
}
