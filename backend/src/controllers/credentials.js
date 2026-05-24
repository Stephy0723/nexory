const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../utils/crypto');

const prisma = new PrismaClient();

async function log(userId, action, entityName, entityId, projectId) {
  await prisma.activityLog.create({
    data: { action, entity: 'CREDENTIAL', entityName, entityId, projectId, userId },
  });
}

function mask(cred) {
  return { ...cred, password: cred.password ? '••••••••' : null };
}

async function list(req, res) {
  try {
    const { projectId, category } = req.query;
    const where = { userId: req.userId };
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;

    const creds = await prisma.credential.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    res.json(creds.map(mask));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reveal(req, res) {
  try {
    const cred = await prisma.credential.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!cred) return res.status(404).json({ error: 'Not found' });

    await log(req.userId, 'REVEALED', cred.label, cred.id, cred.projectId);
    res.json({ ...cred, password: decrypt(cred.password) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { label, category, username, password, url, notes, projectId } = req.body;
    if (!label || !password) {
      return res.status(400).json({ error: 'Label and password are required' });
    }

    const cred = await prisma.credential.create({
      data: {
        label, category, username,
        password: encrypt(password),
        url, notes, projectId: projectId || null,
        userId: req.userId,
      },
    });

    await log(req.userId, 'CREATED', cred.label, cred.id, cred.projectId);
    res.status(201).json(mask(cred));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const existing = await prisma.credential.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { label, category, username, password, url, notes, projectId } = req.body;
    const cred = await prisma.credential.update({
      where: { id: req.params.id },
      data: {
        label, category, username,
        password: password ? encrypt(password) : existing.password,
        url, notes, projectId: projectId || null,
      },
    });

    await log(req.userId, 'UPDATED', cred.label, cred.id, cred.projectId);
    res.json(mask(cred));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const cred = await prisma.credential.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!cred) return res.status(404).json({ error: 'Not found' });

    await prisma.credential.delete({ where: { id: req.params.id } });
    await log(req.userId, 'DELETED', cred.label, cred.id, cred.projectId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, reveal, create, update, remove };
