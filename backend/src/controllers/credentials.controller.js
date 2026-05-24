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

async function list(req, res, next) {
  try {
    const { projectId } = req.query;
    const where = { userId: req.user.id };
    if (projectId) where.projectId = projectId;
    const creds = await prisma.credential.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const masked = creds.map(c => ({ ...c, username: c.username ? '••••••••' : null, password: c.password ? '••••••••' : null }));
    return res.json({ success: true, data: masked });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { projectId, label, username, password, url, notes, category } = req.body;
    if (!label)
      return res.status(400).json({ success: false, error: 'label is required.' });

    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const cred = await prisma.credential.create({
      data: {
        projectId: projectId || null,
        userId,
        label,
        username: username ? encrypt(username) : null,
        password: password ? encrypt(password) : null,
        url: url || null,
        notes: notes || null,
        category: category || 'OTHER',
      },
      include: { project: { select: { id: true, name: true } } },
    });
    await logActivity(userId, projectId, 'CREATED', 'CREDENTIAL', cred.id, cred.label);
    return res.status(201).json({ success: true, data: { ...cred, username: cred.username ? '••••••••' : null, password: cred.password ? '••••••••' : null } });
  } catch (err) { next(err); }
}

async function reveal(req, res, next) {
  try {
    const { id } = req.params;
    const cred = await prisma.credential.findFirst({ where: { id, userId: req.user.id } });
    // Also allow if the user has VIEW_SECRETS on the project
    let accessible = !!cred;
    if (!accessible && id) {
      const anyRec = await prisma.credential.findUnique({ where: { id } });
      if (anyRec?.projectId) {
        const access = await getProjectAccess(prisma, anyRec.projectId, req.user.id);
        if (access?.canViewSecrets) accessible = true;
        if (accessible) {
          const revealed = {
            ...anyRec,
            username: anyRec.username ? decrypt(anyRec.username) : null,
            password: anyRec.password ? decrypt(anyRec.password) : null,
          };
          await logActivity(req.user.id, anyRec.projectId, 'REVEALED', 'CREDENTIAL', anyRec.id, anyRec.label, { ip: req.ip });
          return res.json({ success: true, data: revealed });
        }
      }
    }
    if (!cred) return res.status(404).json({ success: false, error: 'Credential not found.' });

    const revealed = {
      ...cred,
      username: cred.username ? decrypt(cred.username) : null,
      password: cred.password ? decrypt(cred.password) : null,
    };
    await logActivity(req.user.id, cred.projectId, 'REVEALED', 'CREDENTIAL', cred.id, cred.label, { ip: req.ip });
    return res.json({ success: true, data: revealed });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.credential.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Credential not found.' });

    const { projectId, label, username, password, url, notes, category } = req.body;
    const data = {};
    if (projectId !== undefined) data.projectId = projectId || null;
    if (label !== undefined) data.label = label;
    if (username !== undefined) data.username = username ? encrypt(username) : null;
    if (password !== undefined) data.password = password ? encrypt(password) : null;
    if (url !== undefined) data.url = url;
    if (notes !== undefined) data.notes = notes;
    if (category !== undefined) data.category = category;

    const cred = await prisma.credential.update({
      where: { id },
      data,
      include: { project: { select: { id: true, name: true } } },
    });
    await logActivity(userId, cred.projectId, 'UPDATED', 'CREDENTIAL', cred.id, cred.label);
    return res.json({ success: true, data: { ...cred, username: cred.username ? '••••••••' : null, password: cred.password ? '••••••••' : null } });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await prisma.credential.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Credential not found.' });
    await prisma.credential.delete({ where: { id } });
    await logActivity(userId, existing.projectId, 'DELETED', 'CREDENTIAL', id, existing.label);
    return res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, reveal, update, remove };
