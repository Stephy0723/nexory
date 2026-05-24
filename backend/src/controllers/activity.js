const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const { projectId, action, page = 1, limit = 50 } = req.query;
    const where = { userId: req.userId };
    if (projectId) where.projectId = projectId;
    if (action) where.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list };
