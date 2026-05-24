'use strict';
const { PrismaClient } = require('@prisma/client');
const { verifyAccessToken } = require('../utils/jwt');

const prisma = new PrismaClient();

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

module.exports = { authenticate };
