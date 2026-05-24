const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function log(userId, action, entityName, entityId, projectId) {
  await prisma.activityLog.create({
    data: { action, entity: 'NOTE', entityName, entityId, projectId, userId },
  });
}

async function list(req, res) {
  try {
    const { projectId, search } = req.query;
    const where = { userId: req.userId };
    if (projectId) where.projectId = projectId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      include: { project: { select: { id: true, name: true } } },
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { title, content, tags, pinned, projectId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const note = await prisma.note.create({
      data: {
        title, content, pinned: pinned || false,
        tags: tags ? JSON.stringify(tags) : null,
        projectId: projectId || null,
        userId: req.userId,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await log(req.userId, 'CREATED', note.title, note.id, note.projectId);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const existing = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { title, content, tags, pinned, projectId } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        title, content, pinned,
        tags: tags ? JSON.stringify(tags) : null,
        projectId: projectId || null,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await log(req.userId, 'UPDATED', note.title, note.id, note.projectId);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!note) return res.status(404).json({ error: 'Not found' });

    await prisma.note.delete({ where: { id: req.params.id } });
    await log(req.userId, 'DELETED', note.title, note.id, note.projectId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, create, update, remove };
