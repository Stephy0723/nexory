'use strict';

/**
 * Returns access info for (projectId, userId), or null if no access.
 * { project, role: 'OWNER'|'EDITOR'|'VIEWER', canViewSecrets: boolean }
 */
async function getProjectAccess(prisma, projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;

  if (project.userId === userId) {
    return { project, role: 'OWNER', canViewSecrets: true };
  }

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId, status: 'ACTIVE' },
  });
  if (!member) return null;

  return { project, role: member.role, canViewSecrets: member.canViewSecrets };
}

function canEdit(access) {
  return !!access && (access.role === 'OWNER' || access.role === 'EDITOR');
}

function canManageMembers(access) {
  return !!access && access.role === 'OWNER';
}

module.exports = { getProjectAccess, canEdit, canManageMembers };
