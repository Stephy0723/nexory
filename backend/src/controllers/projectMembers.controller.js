'use strict';
const { PrismaClient } = require('@prisma/client');
const { getProjectAccess, canManageMembers } = require('../utils/projectAccess');

const prisma = new PrismaClient();

// GET /api/projects/:id/members
async function list(req, res, next) {
  try {
    const { id } = req.params;
    const access = await getProjectAccess(prisma, id, req.user.id);
    if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });

    const [members, owner] = await Promise.all([
      prisma.projectMember.findMany({
        where: { projectId: id, status: 'ACTIVE' },
        include: { user: { select: { id: true, username: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: access.project.userId },
        select: { id: true, username: true, email: true },
      }),
    ]);

    return res.json({ success: true, data: { owner, members } });
  } catch (err) { next(err); }
}

// POST /api/projects/:id/members
async function invite(req, res, next) {
  try {
    const { id } = req.params;
    const { username, role = 'VIEWER', canViewSecrets = false } = req.body;

    const access = await getProjectAccess(prisma, id, req.user.id);
    if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });
    if (!canManageMembers(access)) return res.status(403).json({ success: false, error: 'Only the owner can invite members.' });

    if (!username) return res.status(400).json({ success: false, error: 'username is required.' });
    if (!['VIEWER', 'EDITOR'].includes(role)) return res.status(400).json({ success: false, error: 'role must be VIEWER or EDITOR.' });

    const invitee = await prisma.user.findUnique({ where: { username } });
    if (!invitee) return res.status(404).json({ success: false, error: `User "${username}" not found.` });
    if (invitee.id === req.user.id) return res.status(400).json({ success: false, error: 'Cannot invite yourself.' });
    if (invitee.id === access.project.userId) return res.status(400).json({ success: false, error: 'User is already the project owner.' });

    const existing = await prisma.projectMember.findFirst({ where: { projectId: id, userId: invitee.id } });
    if (existing) return res.status(409).json({ success: false, error: 'User is already a member of this project.' });

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: invitee.id,
        role,
        canViewSecrets: canViewSecrets === true,
        status: 'ACTIVE',
        invitedById: req.user.id,
        acceptedAt: new Date(),
      },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    return res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
}

// PUT /api/projects/:id/members/:memberId
async function update(req, res, next) {
  try {
    const { id, memberId } = req.params;
    const { role, canViewSecrets } = req.body;

    const access = await getProjectAccess(prisma, id, req.user.id);
    if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });
    if (!canManageMembers(access)) return res.status(403).json({ success: false, error: 'Only the owner can change roles.' });

    const existing = await prisma.projectMember.findFirst({ where: { id: memberId, projectId: id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Member not found.' });

    const data = {};
    if (role !== undefined) {
      if (!['VIEWER', 'EDITOR'].includes(role)) return res.status(400).json({ success: false, error: 'Invalid role.' });
      data.role = role;
    }
    if (canViewSecrets !== undefined) data.canViewSecrets = Boolean(canViewSecrets);

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data,
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    return res.json({ success: true, data: member });
  } catch (err) { next(err); }
}

// DELETE /api/projects/:id/members/:memberId
async function remove(req, res, next) {
  try {
    const { id, memberId } = req.params;

    const access = await getProjectAccess(prisma, id, req.user.id);
    if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });

    const existing = await prisma.projectMember.findFirst({ where: { id: memberId, projectId: id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Member not found.' });

    // Owner can remove anyone; a member can remove themselves
    const isSelf = existing.userId === req.user.id;
    if (!canManageMembers(access) && !isSelf) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }

    await prisma.projectMember.delete({ where: { id: memberId } });
    return res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, invite, update, remove };
