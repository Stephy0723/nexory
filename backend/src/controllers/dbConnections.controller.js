'use strict';
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../utils/crypto');
const { getProjectAccess } = require('../utils/projectAccess');

const prisma = new PrismaClient();

async function logActivity(userId, projectId, action, entity, entityId, entityName, details) {
  await prisma.activityLog.create({
    data: { userId, projectId: projectId || null, action, entity, entityId, entityName: entityName || null, details: details || {} },
  });
}

function maskConn(c) {
  return { ...c, username: c.username ? '••••••••' : null, password: c.password ? '••••••••' : null };
}

async function list(req, res, next) {
  try {
    const { projectId } = req.query;
    const where = { userId: req.user.id };
    if (projectId) where.projectId = projectId;
    const conns = await prisma.dbConnection.findMany({ where, include: { project: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: conns.map(maskConn) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { projectId, label, type, host, port, dbName, username, password, backupUrl, notes } = req.body;
    if (!label)
      return res.status(400).json({ success: false, error: 'label is required.' });

    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const conn = await prisma.dbConnection.create({
      data: {
        userId, projectId: projectId || null, label, type: type || 'POSTGRESQL',
        host: host || null, port: port || null, dbName: dbName || null,
        username: username ? encrypt(username) : null,
        password: password ? encrypt(password) : null,
        backupUrl: backupUrl || null, notes: notes || null,
      },
      include: { project: { select: { id: true, name: true } } },
    });
    await logActivity(userId, projectId, 'CREATED', 'DB_CONNECTION', conn.id, conn.label);
    return res.status(201).json({ success: true, data: maskConn(conn) });
  } catch (err) { next(err); }
}

async function reveal(req, res, next) {
  try {
    const { id } = req.params;
    let conn = await prisma.dbConnection.findFirst({ where: { id, userId: req.user.id } });
    // Also allow if user has VIEW_SECRETS on the associated project
    if (!conn) {
      const anyConn = await prisma.dbConnection.findUnique({ where: { id } });
      if (anyConn?.projectId) {
        const access = await getProjectAccess(prisma, anyConn.projectId, req.user.id);
        if (access?.canViewSecrets) conn = anyConn;
      }
    }
    if (!conn) return res.status(404).json({ success: false, error: 'DB connection not found.' });
    const revealed = {
      ...conn,
      username: conn.username ? decrypt(conn.username) : null,
      password: conn.password ? decrypt(conn.password) : null,
    };
    await logActivity(req.user.id, conn.projectId, 'REVEALED', 'DB_CONNECTION', conn.id, conn.label, { ip: req.ip });
    return res.json({ success: true, data: revealed });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.dbConnection.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'DB connection not found.' });

    const { projectId, label, type, host, port, dbName, username, password, backupUrl, notes } = req.body;
    const data = {};
    if (projectId !== undefined) data.projectId = projectId || null;
    if (label !== undefined) data.label = label;
    if (type !== undefined) data.type = type;
    if (host !== undefined) data.host = host;
    if (port !== undefined) data.port = port;
    if (dbName !== undefined) data.dbName = dbName;
    if (username !== undefined) data.username = username ? encrypt(username) : null;
    if (password !== undefined) data.password = password ? encrypt(password) : null;
    if (backupUrl !== undefined) data.backupUrl = backupUrl;
    if (notes !== undefined) data.notes = notes;

    const conn = await prisma.dbConnection.update({
      where: { id },
      data,
      include: { project: { select: { id: true, name: true } } },
    });
    await logActivity(userId, conn.projectId, 'UPDATED', 'DB_CONNECTION', conn.id, conn.label);
    return res.json({ success: true, data: maskConn(conn) });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.dbConnection.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'DB connection not found.' });
    await prisma.dbConnection.delete({ where: { id } });
    await logActivity(userId, existing.projectId, 'DELETED', 'DB_CONNECTION', id, existing.label);
    return res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, reveal, update, remove };
