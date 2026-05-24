const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../utils/crypto');

const prisma = new PrismaClient();

async function log(userId, action, entityName, entityId, projectId) {
  await prisma.activityLog.create({
    data: { action, entity: 'DATABASE', entityName, entityId, projectId, userId },
  });
}

function mask(conn) {
  return {
    ...conn,
    password: conn.password ? '••••••••' : null,
    connString: conn.connString ? '••••••••' : null,
  };
}

async function list(req, res) {
  try {
    const { projectId } = req.query;
    const where = { userId: req.userId };
    if (projectId) where.projectId = projectId;

    const conns = await prisma.dbConnection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    res.json(conns.map(mask));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reveal(req, res) {
  try {
    const conn = await prisma.dbConnection.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!conn) return res.status(404).json({ error: 'Not found' });

    await log(req.userId, 'REVEALED', conn.name, conn.id, conn.projectId);
    res.json({
      ...conn,
      password: decrypt(conn.password),
      connString: decrypt(conn.connString),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, type, host, port, database, username, password, connString, projectId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const conn = await prisma.dbConnection.create({
      data: {
        name, type, host,
        port: port ? parseInt(port) : null,
        database, username,
        password: password ? encrypt(password) : null,
        connString: connString ? encrypt(connString) : null,
        projectId: projectId || null,
        userId: req.userId,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await log(req.userId, 'CREATED', conn.name, conn.id, conn.projectId);
    res.status(201).json(mask(conn));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const existing = await prisma.dbConnection.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { name, type, host, port, database, username, password, connString, projectId } = req.body;
    const conn = await prisma.dbConnection.update({
      where: { id: req.params.id },
      data: {
        name, type, host,
        port: port ? parseInt(port) : null,
        database, username,
        password: password ? encrypt(password) : existing.password,
        connString: connString ? encrypt(connString) : existing.connString,
        projectId: projectId || null,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await log(req.userId, 'UPDATED', conn.name, conn.id, conn.projectId);
    res.json(mask(conn));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const conn = await prisma.dbConnection.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!conn) return res.status(404).json({ error: 'Not found' });

    await prisma.dbConnection.delete({ where: { id: req.params.id } });
    await log(req.userId, 'DELETED', conn.name, conn.id, conn.projectId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, reveal, create, update, remove };
