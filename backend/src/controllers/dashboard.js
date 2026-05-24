const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function stats(req, res) {
  try {
    const userId = req.userId;

    const [
      totalProjects,
      activeProjects,
      openTasks,
      credentialsStored,
      projectsByStatus,
      recentProjects,
      recentActivity,
    ] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.task.count({ where: { userId, status: { not: 'DONE' } } }),
      prisma.credential.count({ where: { userId } }),
      prisma.project.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true, name: true, status: true, priority: true,
          category: true, updatedAt: true,
        },
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { project: { select: { id: true, name: true } } },
      }),
    ]);

    res.json({
      stats: { totalProjects, activeProjects, openTasks, credentialsStored },
      projectsByStatus,
      recentProjects,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { stats };
