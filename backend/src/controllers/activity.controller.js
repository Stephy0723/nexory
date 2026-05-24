'use strict';
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function list(req, res, next) {
  try {
    const { projectId, entity, action, page = '1', limit = '20' } = req.query;
    const where = { userId: req.user.id };
    if (projectId) where.projectId = projectId;
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) { next(err); }
}

module.exports = { list };
