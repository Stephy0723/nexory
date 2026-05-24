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
    const { projectId, status, priority, search } = req.query;
    const where = { userId: req.user.id };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) where.title = { contains: search };
    const tasks = await prisma.task.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { projectId, title, description, status, priority, dueDate, tags } = req.body;
    if (!title)
      return res.status(400).json({ success: false, error: 'title is required.' });

    if (projectId) {
      const access = await getProjectAccess(prisma, projectId, userId);
      if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });
      if (!canEdit(access)) return res.status(403).json({ success: false, error: 'You need EDITOR or OWNER access to add tasks to this project.' });
    }

    const maxOrder = await prisma.task.aggregate({ where: { projectId, status: status || 'TODO' }, _max: { order: true } });
    const task = await prisma.task.create({
      data: {
        userId, projectId: projectId || null, title, description: description || null,
        status: status || 'TODO', priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: Array.isArray(tags) ? tags : [],
        order: (maxOrder._max.order || 0) + 1,
      },
      include: { project: { select: { id: true, name: true } } },
    });
    await logActivity(userId, projectId, 'CREATED', 'TASK', task.id, task.title);
    return res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Task not found.' });

    const { title, description, status, priority, dueDate, tags, order } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
    if (order !== undefined) data.order = order;

    const task = await prisma.task.update({ where: { id }, data, include: { project: { select: { id: true, name: true } } } });
    await logActivity(userId, task.projectId, 'UPDATED', 'TASK', task.id, task.title);
    return res.json({ success: true, data: task });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'status is required.' });

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Task not found.' });

    const task = await prisma.task.update({ where: { id }, data: { status }, include: { project: { select: { id: true, name: true } } } });
    await logActivity(userId, task.projectId, 'UPDATED', 'TASK', task.id, task.title);
    return res.json({ success: true, data: task });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Task not found.' });
    await prisma.task.delete({ where: { id } });
    await logActivity(userId, existing.projectId, 'DELETED', 'TASK', id, existing.title);
    return res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, updateStatus, remove };
