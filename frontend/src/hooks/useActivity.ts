import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import type { ActivityLog } from '@/types';

interface ActivityResponse {
  data: ActivityLog[];
  pagination: { page: number; total: number; pages: number };
}

export function useActivity(params?: { projectId?: string; entity?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['activity', params],
    queryFn: async (): Promise<ActivityResponse> => {
      const { data } = await api.get<{ data: ActivityLog[]; total: number; page: number; totalPages: number }>('/activity', { params });
      return {
        data: data.data,
        pagination: { page: data.page, total: data.total, pages: data.totalPages },
      };
    },
  });
}