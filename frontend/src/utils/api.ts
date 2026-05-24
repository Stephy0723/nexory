import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = api
          .post<{ accessToken: string }>('/auth/refresh')
          .then((r) => {
            const token = r.data.accessToken;
            useAuthStore.getState().setAccessToken(token);
            return token;
          })
          .catch(() => {
            useAuthStore.getState().clear();
            return null;
          })
          .finally(() => {
            refreshing = null;
          });
      }
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { email: string; username: string; password: string }) => api.post('/auth/register', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
};

export const projectsApi = {
  list: (params?: Record<string, string>) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: unknown) => api.post('/projects', data),
  update: (id: string, data: unknown) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  // Member management
  listMembers: (projectId: string) => api.get(`/projects/${projectId}/members`),
  inviteMember: (projectId: string, data: { username: string; role: string; canViewSecrets?: boolean }) =>
    api.post(`/projects/${projectId}/members`, data),
  updateMember: (projectId: string, memberId: string, data: { role?: string; canViewSecrets?: boolean }) =>
    api.put(`/projects/${projectId}/members/${memberId}`, data),
  removeMember: (projectId: string, memberId: string) =>
    api.delete(`/projects/${projectId}/members/${memberId}`),
};

export const credentialsApi = {
  list: (params?: Record<string, string>) => api.get('/credentials', { params }),
  reveal: (id: string) => api.get(`/credentials/${id}/reveal`),
  create: (data: unknown) => api.post('/credentials', data),
  update: (id: string, data: unknown) => api.put(`/credentials/${id}`, data),
  delete: (id: string) => api.delete(`/credentials/${id}`),
};

export const tasksApi = {
  list: (params?: Record<string, string>) => api.get('/tasks', { params }),
  create: (data: unknown) => api.post('/tasks', data),
  update: (id: string, data: unknown) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const notesApi = {
  list: (params?: Record<string, string>) => api.get('/notes', { params }),
  create: (data: unknown) => api.post('/notes', data),
  update: (id: string, data: unknown) => api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

export const dbApi = {
  list: (params?: Record<string, string>) => api.get('/database', { params }),
  reveal: (id: string) => api.get(`/database/${id}/reveal`),
  create: (data: unknown) => api.post('/database', data),
  update: (id: string, data: unknown) => api.put(`/database/${id}`, data),
  delete: (id: string) => api.delete(`/database/${id}`),
};

export const activityApi = {
  list: (params?: Record<string, string>) => api.get('/activity', { params }),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard'),
};

export const aiApi = {
  chat: (body: unknown) => api.post('/ai/chat', body),
  apply: (actions: unknown[]) => api.post('/ai/apply', { actions }),
};
