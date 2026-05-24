import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type { Project, ProjectStats } from '@/types';

interface ListParams { status?: string; priority?: string; category?: string; search?: string }

export function useProjects(params?: ListParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: Project[] }>('/projects', { params });
      return data.data;
    },
  });
}

export function useProjectStats() {
  return useQuery({
    queryKey: ['projects', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProjectStats }>('/projects/stats');
      return data.data;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Project }>(`/projects/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Project>) => api.post('/projects', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Project> & { id: string }) => api.put(`/projects/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}