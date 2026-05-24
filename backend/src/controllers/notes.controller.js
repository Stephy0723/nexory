'use strict';
const { PrismaClient } = require('@prisma/client');
const { getProjectAccess, canEdit } = require('../utils/projectAccess');

const prisma = new PrismaClient();

async function logActivity(userId, projectId, action, entity, entityId, entityName) {
  await prisma.activityLog.create({
    data: { userId, projectId: projectId || null, action, entity, entityId, entityName: entityName || null, details: {} },
  });
}

async function list(req, res, next) {
  try {
    const { projectId, pinned, search } = req.query;
    const where = { userId: req.user.id };
    if (projectId) where.projectId = projectId;
    if (pinned !== undefined) where.isPinned = pinned === 'true';
    if (search) where.OR = [{ title: { contains: search } }, { content: { contains: search } }];
    const notes = await prisma.note.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
    return res.json({ success: true, data: notes });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, content, projectId, isPinned, tags } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });

    if (projectId) {
      const access = await getProjectAccess(prisma, projectId, userId);
      if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });
      if (!canEdit(access)) return res.status(403).json({ success: false, error: 'You need EDITOR or OWNER access to add notes to this project.' });
    }

    const note = await prisma.note.create({
      data: {
        userId, title, content: content || '',
        projectId: projectId || null,
        isPinned: isPinned === true,
        tags: Array.isArray(tags) ? tags : [],
      },
      include: { project: { select: { id: true, name: true } } },
    });
    await logActivity(userId, note.projectId, 'CREATED', 'NOTE', note.id, note.title);
    return res.status(201).json({ success: true, data: note });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Note not found.' });

    const { title, content, projectId, isPinned, tags } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (projectId !== undefined) data.projectId = projectId || null;
    if (isPinned !== undefined) data.isPinned = isPinned;
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];

    const note = await prisma.note.update({ where: { id }, data, include: { project: { select: { id: true, name: true } } } });
    await logActivity(userId, note.projectId, 'UPDATED', 'NOTE', note.id, note.title);
    return res.json({ success: true, data: note });
  } catch (err) { next(err); }
}

async function pin(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Note not found.' });
    const note = await prisma.note.update({ where: { id }, data: { isPinned: !existing.isPinned } });
    await logActivity(userId, note.projectId, 'UPDATED', 'NOTE', note.id, note.title);
    return res.json({ success: true, data: note });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Note not found.' });
    await prisma.note.delete({ where: { id } });
    await logActivity(userId, existing.projectId, 'DELETED', 'NOTE', id, existing.title);
    return res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, pin, remove };
