import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/utils/api';
import type { ProjectMembersData } from '@/types';

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: async () => {
      const { data } = await projectsApi.listMembers(projectId);
      return (data as { data: ProjectMembersData }).data;
    },
    enabled: !!projectId,
  });
}

export function useInviteMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string; role: string; canViewSecrets?: boolean }) =>
      projectsApi.inviteMember(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projectMembers', projectId] }),
  });
}

export function useUpdateMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, ...body }: { memberId: string; role?: string; canViewSecrets?: boolean }) =>
      projectsApi.updateMember(projectId, memberId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projectMembers', projectId] }),
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => projectsApi.removeMember(projectId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projectMembers', projectId] }),
  });
}
