const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function log(userId, action, entityName, entityId, projectId) {
  await prisma.activityLog.create({
    data: { action, entity: 'PROJECT', entityName, entityId, projectId, userId },
  });
}

async function list(req, res) {
  try {
    const { status, priority, category, search } = req.query;
    const where = { userId: req.userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) where.name = { contains: search };

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { tasks: true, credentials: true } },
      },
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function get(req, res) {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        credentials: true,
        tasks: { orderBy: { createdAt: 'desc' } },
        notes: { orderBy: { pinned: 'desc' } },
        dbConnections: true,
      },
    });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const {
      name, description, status, category, priority,
      startDate, deliveryDate, domain, hosting,
      frontendUrl, backendUrl, githubRepos,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const project = await prisma.project.create({
      data: {
        name, description, status, category, priority,
        startDate: startDate ? new Date(startDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        domain, hosting, frontendUrl, backendUrl,
        githubRepos: githubRepos || null,
        userId: req.userId,
      },
    });

    await log(req.userId, 'CREATED', project.name, project.id, project.id);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const {
      name, description, status, category, priority,
      startDate, deliveryDate, domain, hosting,
      frontendUrl, backendUrl, githubRepos,
    } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name, description, status, category, priority,
        startDate: startDate ? new Date(startDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        domain, hosting, frontendUrl, backendUrl,
        githubRepos: githubRepos || null,
      },
    });

    await log(req.userId, 'UPDATED', project.name, project.id, project.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!project) return res.status(404).json({ error: 'Not found' });

    await prisma.project.delete({ where: { id: req.params.id } });
    await log(req.userId, 'DELETED', project.name, project.id, null);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, get, create, update, remove };
