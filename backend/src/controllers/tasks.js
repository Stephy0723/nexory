const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function log(userId, action, entityName, entityId, projectId) {
  await prisma.activityLog.create({
    data: { action, entity: 'TASK', entityName, entityId, projectId, userId },
  });
}

async function list(req, res) {
  try {
    const { projectId, priority, status } = req.query;
    const where = { userId: req.userId };
    if (projectId) where.projectId = projectId;
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { title, description, status, priority, dueDate, projectId } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const task = await prisma.task.create({
      data: {
        title, description, status, priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        userId: req.userId,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await log(req.userId, 'CREATED', task.title, task.id, task.projectId);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { title, description, status, priority, dueDate, projectId } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title, description, status, priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await log(req.userId, 'UPDATED', task.title, task.id, task.projectId);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!task) return res.status(404).json({ error: 'Not found' });

    await prisma.task.delete({ where: { id: req.params.id } });
    await log(req.userId, 'DELETED', task.title, task.id, task.projectId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, create, update, remove };
