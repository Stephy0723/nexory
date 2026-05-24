import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type { DbConnection } from '@/types';

export function useDbConnections(params?: { projectId?: string }) {
  return useQuery({
    queryKey: ['db-connections', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: DbConnection[] }>('/db-connections', { params });
      return data.data;
    },
  });
}

export function useRevealDbConnection() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.get<{ data: { username: string; password: string } }>(`/db-connections/${id}/reveal`);
      return data.data;
    },
  });
}

export function useCreateDbConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<DbConnection>) => api.post('/db-connections', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db-connections'] }),
  });
}

export function useUpdateDbConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<DbConnection> & { id: string }) => api.put(`/db-connections/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db-connections'] }),
  });
}

export function useDeleteDbConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/db-connections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db-connections'] }),
  });
}