'use strict';
const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../utils/crypto');
const { getProjectAccess, canEdit, canManageMembers } = require('../utils/projectAccess');

const prisma = new PrismaClient();

async function logActivity(userId, projectId, action, entity, entityId, entityName, details) {
  await prisma.activityLog.create({
    data: {
      userId,
      projectId: projectId || null,
      action,
      entity,
      entityId,
      entityName: entityName || null,
      details: details || {},
    },
  });
}

async function list(req, res, next) {
  try {
    const { status, priority, category, search } = req.query;
    const userId = req.user.id;

    const buildWhere = (base) => {
      const w = { ...base };
      if (status) w.status = status;
      if (priority) w.priority = priority;
      if (category) w.category = category;
      if (search) w.OR = [{ name: { contains: search } }, { description: { contains: search } }];
      return w;
    };

    const include = {
      _count: { select: { tasks: { where: { status: { not: 'DONE' } } }, credentials: true } },
    };

    // Projects owned by user
    const ownedPromise = prisma.project.findMany({
      where: buildWhere({ userId }),
      include,
      orderBy: { updatedAt: 'desc' },
    });

    // Projects shared with user
    const memberships = await prisma.projectMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { projectId: true },
    });
    const memberIds = memberships.map((m) => m.projectId);

    const sharedPromise = memberIds.length > 0
      ? prisma.project.findMany({
          where: buildWhere({ id: { in: memberIds } }),
          include,
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([]);

    const [owned, shared] = await Promise.all([ownedPromise, sharedPromise]);

    // Merge without duplicates
    const ownedSet = new Set(owned.map((p) => p.id));
    const all = [...owned, ...shared.filter((p) => !ownedSet.has(p.id))];
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.json({ success: true, data: all });
  } catch (err) { next(err); }
}

async function stats(req, res, next) {
  try {
    const userId = req.user.id;
    const [projects, openTasks, totalCredentials] = await Promise.all([
      prisma.project.findMany({ where: { userId } }),
      prisma.task.count({ where: { userId, status: { not: 'DONE' } } }),
      prisma.credential.count({ where: { userId } }),
    ]);
    const byStatus = {};
    const byPriority = {};
    const byCategory = {};
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    }
    return res.json({ success: true, data: { total: projects.length, byStatus, byPriority, byCategory, openTasks, totalCredentials } });
  } catch (err) { next(err); }
}

function buildProjectData(body, userId) {
  const {
    name, description, status, priority, category, tags,
    startDate, deliveryDate, domain, hosting, frontendUrl, backendUrl,
    githubRepos, envVars, technicalDocs, roadmap,
    // Stack
    stackFrontend, stackBackend, stackDatabase, stackDevops, stackExternal,
    // Client
    clientName, clientEmail, clientPhone, clientCompany,
    // Financial
    budget, monthlyCost, billingType, estimatedHours, realHours,
    // Infrastructure extras
    domainRegistrar, domainExpiry, hostingPlan, hostingExpiry,
    stagingUrl, adminPanelUrl, mainBranch,
    // Server Access
    sshHost, sshPort, sshUser, sshPassword, sshKeyPath,
    hostingPanelType, hostingPanelUrl, hostingPanelUser, hostingPanelPass,
    // Misc
    setupNotes, screenshots,
  } = body;

  const data = {
    userId,
    name: name.trim(),
    description: description || null,
    status: status || 'ACTIVE',
    priority: priority || 'MEDIUM',
    category: category || 'WEB_APP',
    tags: Array.isArray(tags) ? tags : [],
    startDate: startDate ? new Date(startDate) : null,
    deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    domain: domain || null,
    hosting: hosting || null,
    frontendUrl: frontendUrl || null,
    backendUrl: backendUrl || null,
    githubRepos: Array.isArray(githubRepos) ? githubRepos : [],
    envVars: envVars ? encrypt(envVars) : null,
    technicalDocs: technicalDocs || null,
    roadmap: roadmap || null,
    stackFrontend: Array.isArray(stackFrontend) ? stackFrontend : [],
    stackBackend: Array.isArray(stackBackend) ? stackBackend : [],
    stackDatabase: Array.isArray(stackDatabase) ? stackDatabase : [],
    stackDevops: Array.isArray(stackDevops) ? stackDevops : [],
    stackExternal: Array.isArray(stackExternal) ? stackExternal : [],
    clientName: clientName || null,
    clientEmail: clientEmail || null,
    clientPhone: clientPhone || null,
    clientCompany: clientCompany || null,
    budget: budget || null,
    monthlyCost: monthlyCost || null,
    billingType: billingType || null,
    estimatedHours: estimatedHours != null ? parseFloat(estimatedHours) : null,
    realHours: realHours != null ? parseFloat(realHours) : null,
    domainRegistrar: domainRegistrar || null,
    domainExpiry: domainExpiry ? new Date(domainExpiry) : null,
    hostingPlan: hostingPlan || null,
    hostingExpiry: hostingExpiry ? new Date(hostingExpiry) : null,
    stagingUrl: stagingUrl || null,
    adminPanelUrl: adminPanelUrl || null,
    mainBranch: mainBranch || null,
    sshHost: sshHost || null,
    sshPort: sshPort || '22',
    sshUser: sshUser || null,
    sshPassword: sshPassword ? encrypt(sshPassword) : null,
    sshKeyPath: sshKeyPath || null,
    hostingPanelType: hostingPanelType || null,
    hostingPanelUrl: hostingPanelUrl || null,
    hostingPanelUser: hostingPanelUser || null,
    hostingPanelPass: hostingPanelPass ? encrypt(hostingPanelPass) : null,
    setupNotes: setupNotes || null,
    screenshots: Array.isArray(screenshots) ? screenshots : [],
  };
  return data;
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ success: false, error: 'Project name is required.' });

    const project = await prisma.project.create({ data: buildProjectData(req.body, userId) });
    await logActivity(userId, project.id, 'CREATED', 'PROJECT', project.id, project.name);
    return res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const access = await getProjectAccess(prisma, id, req.user.id);
    if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });

    const project = await prisma.project.findFirst({
      where: { id },
      include: {
        tasks: { orderBy: { order: 'asc' } },
        notes: { orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }] },
        dbConnections: access.canViewSecrets
          ? true
          : { select: { id: true, label: true, type: true, host: true, port: true, dbName: true, backupUrl: true, notes: true, createdAt: true, updatedAt: true } },
        _count: { select: { notes: true, tasks: true, credentials: true, dbConnections: true } },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

    // Credentials: only for users with VIEW_SECRETS (owner or canViewSecrets member)
    let credentials = [];
    if (access.canViewSecrets) {
      const rawCreds = await prisma.credential.findMany({ where: { projectId: id } });
      credentials = rawCreds.map((c) => ({
        ...c,
        username: c.username ? '••••••••' : null,
        password: c.password ? '••••••••' : null,
      }));
    }

    return res.json({
      success: true,
      data: {
        ...project,
        credentials,
        _access: { role: access.role, canViewSecrets: access.canViewSecrets },
      },
    });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const access = await getProjectAccess(prisma, id, userId);
    if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });
    if (!canEdit(access)) return res.status(403).json({ success: false, error: 'You need EDITOR or OWNER access to update this project.' });

    const ARRAY_FIELDS = ['tags', 'githubRepos', 'stackFrontend', 'stackBackend', 'stackDatabase', 'stackDevops', 'stackExternal', 'screenshots'];
    const DATE_FIELDS = ['startDate', 'deliveryDate', 'domainExpiry', 'hostingExpiry'];
    const ENCRYPT_FIELDS = ['envVars', 'sshPassword', 'hostingPanelPass'];
    const FLOAT_FIELDS = ['estimatedHours', 'realHours'];

    const data = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value === undefined) continue;
      if (ARRAY_FIELDS.includes(key)) {
        data[key] = Array.isArray(value) ? value : [];
      } else if (DATE_FIELDS.includes(key)) {
        data[key] = value ? new Date(value) : null;
      } else if (ENCRYPT_FIELDS.includes(key)) {
        data[key] = value ? encrypt(value) : null;
      } else if (FLOAT_FIELDS.includes(key)) {
        data[key] = value != null ? parseFloat(value) : null;
      } else {
        data[key] = value;
      }
    }

    const project = await prisma.project.update({ where: { id }, data });
    await logActivity(userId, id, 'UPDATED', 'PROJECT', id, project.name);
    return res.json({ success: true, data: project });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const access = await getProjectAccess(prisma, id, userId);
    if (!access) return res.status(404).json({ success: false, error: 'Project not found.' });
    if (!canManageMembers(access)) return res.status(403).json({ success: false, error: 'Only the owner can delete this project.' });
    await prisma.project.delete({ where: { id } });
    await logActivity(userId, null, 'DELETED', 'PROJECT', id, access.project.name);
    return res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, stats, create, getById, update, remove };
