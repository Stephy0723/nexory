import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type { Note } from '@/types';

export function useNotes(params?: { projectId?: string; pinned?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: Note[] }>('/notes', { params });
      return data.data;
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Note>) => api.post('/notes', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Note> & { id: string }) => api.put(`/notes/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function usePinNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notes/${id}/pin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}