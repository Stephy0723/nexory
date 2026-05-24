import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type { Credential } from '@/types';

export function useCredentials(params?: { projectId?: string; search?: string }) {
  return useQuery({
    queryKey: ['credentials', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: Credential[] }>('/credentials', { params });
      return data.data;
    },
  });
}

export function useRevealCredential() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.get<{ data: { username: string; password: string } }>(`/credentials/${id}/reveal`);
      return data.data;
    },
  });
}

export function useCreateCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Credential>) => api.post('/credentials', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  });
}

export function useUpdateCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Credential> & { id: string }) => api.put(`/credentials/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  });
}

export function useDeleteCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/credentials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  });
}