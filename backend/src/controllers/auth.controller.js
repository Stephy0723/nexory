'use strict';
require('dotenv').config();
const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production',
};

async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ success: false, error: 'Email, username and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email))
      return res.status(400).json({ success: false, error: 'Invalid email format.' });

    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase().trim(), username: username.trim(), passwordHash },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'CREATED', entity: 'USER', entityId: user.id, entityName: user.username, details: {} },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    return res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
    });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials.' });

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials.' });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'LOGIN', entity: 'USER', entityId: user.id, entityName: user.username, details: { ip: req.ip } },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    return res.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
    });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, error: 'No refresh token.' });
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true } });
    if (!user) return res.status(401).json({ success: false, error: 'User not found.' });
    const accessToken = generateAccessToken(user.id);
    const newRefresh = generateRefreshToken(user.id);
    res.cookie('refreshToken', newRefresh, COOKIE_OPTS);
    return res.json({ success: true, accessToken });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
  }
}

async function logout(req, res) {
  res.clearCookie('refreshToken');
  return res.json({ success: true });
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, username: true, createdAt: true, updatedAt: true },
    });
    return res.json({ success: true, user });
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout, me };
