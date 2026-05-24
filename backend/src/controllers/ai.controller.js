'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../utils/crypto');

const prisma = new PrismaClient();

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-your-key-here') {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please set it in backend/.env');
  }
  return new Anthropic({ apiKey });
}

async function logActivity(userId, projectId, action, entity, entityId, entityName, source = 'AI') {
  await prisma.activityLog.create({
    data: {
      userId,
      projectId: projectId || null,
      action,
      entity,
      entityId,
      entityName: entityName || null,
      details: {},
      source,
    },
  });
}

function buildSystemPrompt(projects, selectedProjectId, currentPage) {
  return `You are NEXORY Assistant, an AI integrated into NEXORY — a personal project vault for a developer.
You have full context of all the user's projects and can read and update them.

## Your capabilities:
1. UPDATE projects — any field: status, priority, stack layers, URLs, client info, dates, hosting
2. CREATE tasks and bugs from natural language
3. ADD technologies to stack layers (frontend/backend/database/devops/external)
4. ADD credentials, notes, DB connections
5. SEARCH across projects and return information
6. GENERATE documentation, setup notes, env var templates
7. BULK UPDATE multiple projects at once
8. SMART DETECTION — if user says "I finished the backend", detect which project they mean from context, update stackBackend to mark relevant tech as done or add missing ones, update status if appropriate

## Response format — ALWAYS return valid JSON:
{
  "message": "Human explanation of what you found or will do",
  "actions": [
    {
      "type": "UPDATE_PROJECT" | "CREATE_TASK" | "CREATE_CREDENTIAL" | "ADD_STACK" | "UPDATE_TASK" | "CREATE_NOTE" | "CREATE_DB" | "BULK_UPDATE",
      "projectId": "cuid...",
      "projectName": "Project name for display",
      "data": { ...exact fields to update or create },
      "description": "Short human-readable description e.g. 'Set status to COMPLETED'"
    }
  ],
  "requiresConfirmation": true,
  "summary": "One line e.g. 'Updated 2 fields in NEXORY Platform'"
}

If only answering a question, return actions: [].
If unclear which project, ask in message with actions: [].

ADD_STACK action data format:
{ "layer": "stackFrontend"|"stackBackend"|"stackDatabase"|"stackDevops"|"stackExternal", "add": ["Tech1","Tech2"] }

## User's projects:
${JSON.stringify(projects, null, 2)}

## Selected project: ${selectedProjectId || 'none'}
## Current page: ${currentPage || 'unknown'}`;
}

async function chat(req, res, next) {
  try {
    const { message, projectId, conversationHistory = [], context = {} } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ success: false, error: 'Message is required.' });

    const userId = req.user.id;

    const projects = await prisma.project.findMany({
      where: { userId },
      select: {
        id: true, name: true, status: true, category: true, priority: true,
        stackFrontend: true, stackBackend: true, stackDatabase: true,
        stackDevops: true, stackExternal: true,
      },
    });

    const anthropic = getAnthropicClient();
    const systemPrompt = buildSystemPrompt(projects, projectId, context.currentPage);

    const messages = [
      ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    let response;
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages,
      });
    } catch (anthropicErr) {
      // Map Anthropic API errors to friendly messages
      const status = anthropicErr.status || anthropicErr.statusCode;
      let friendlyMsg = 'The AI service is temporarily unavailable. Please try again later.';
      if (status === 400 || status === 402) {
        const body = anthropicErr.error || anthropicErr.message || '';
        const bodyStr = typeof body === 'object' ? JSON.stringify(body) : String(body);
        if (bodyStr.includes('credit') || bodyStr.includes('balance')) {
          friendlyMsg = 'The AI feature is currently unavailable: insufficient API credits. Please contact the administrator.';
        }
      } else if (status === 401) {
        friendlyMsg = 'The AI feature is not configured correctly. Please contact the administrator.';
      } else if (status === 429) {
        friendlyMsg = 'AI rate limit exceeded. Please wait a moment and try again.';
      }
      return res.status(503).json({ success: false, error: friendlyMsg });
    }

    const rawText = response.content[0]?.text || '';
    let result;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { message: rawText, actions: [], requiresConfirmation: false, summary: '' };
      }
    } catch {
      result = { message: rawText, actions: [], requiresConfirmation: false, summary: '' };
    }

    return res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function apply(req, res, next) {
  try {
    const { actions = [] } = req.body;
    const userId = req.user.id;
    const results = [];

    for (const action of actions) {
      try {
        let result;
        switch (action.type) {
          case 'UPDATE_PROJECT':
            result = await applyUpdateProject(action, userId);
            break;
          case 'ADD_STACK':
            result = await applyAddStack(action, userId);
            break;
          case 'CREATE_TASK':
            result = await applyCreateTask(action, userId);
            break;
          case 'CREATE_CREDENTIAL':
            result = await applyCreateCredential(action, userId);
            break;
          case 'CREATE_NOTE':
            result = await applyCreateNote(action, userId);
            break;
          case 'CREATE_DB':
            result = await applyCreateDb(action, userId);
            break;
          case 'UPDATE_TASK':
            result = await applyUpdateTask(action, userId);
            break;
          case 'BULK_UPDATE':
            result = await applyBulkUpdate(action, userId);
            break;
          default:
            result = { skipped: true };
        }
        results.push({ action: action.type, success: true, result });

        const entity = action.type.replace('_', ' ').split(' ')[1] || 'ITEM';
        await logActivity(userId, action.projectId || null, action.type, entity, action.projectId || 'ai', action.projectName || null, 'AI').catch(() => {});
      } catch (err) {
        results.push({ action: action.type, success: false, error: err.message });
      }
    }

    return res.json({ success: true, applied: actions.length, results });
  } catch (err) { next(err); }
}

async function applyUpdateProject(action, userId) {
  const { projectId, data } = action;
  const existing = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!existing) throw new Error(`Project ${projectId} not found`);

  const ARRAY_FIELDS = ['tags', 'githubRepos', 'stackFrontend', 'stackBackend', 'stackDatabase', 'stackDevops', 'stackExternal', 'screenshots'];
  const DATE_FIELDS = ['startDate', 'deliveryDate', 'domainExpiry', 'hostingExpiry'];
  const ENCRYPT_FIELDS = ['envVars', 'sshPassword', 'hostingPanelPass'];

  const updateData = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (key === 'userId') continue;
    if (ARRAY_FIELDS.includes(key)) {
        updateData[key] = Array.isArray(value) ? value : [];
    } else if (DATE_FIELDS.includes(key)) {
      updateData[key] = value ? new Date(value) : null;
    } else if (ENCRYPT_FIELDS.includes(key)) {
      updateData[key] = value ? encrypt(value) : null;
    } else {
      updateData[key] = value;
    }
  }

  return prisma.project.update({ where: { id: projectId }, data: updateData });
}

async function applyAddStack(action, userId) {
  const { projectId, data } = action;
  const { layer, add = [] } = data || {};
  if (!layer || !add.length) return { skipped: true };

  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  let existing = [];
  existing = Array.isArray(project[layer]) ? project[layer] : [];
  const merged = [...new Set([...existing, ...add])];
  return prisma.project.update({ where: { id: projectId }, data: { [layer]: merged } });
}

async function applyCreateTask(action, userId) {
  const { projectId, data } = action;
  return prisma.task.create({
    data: {
      userId,
      projectId: projectId || null,
      title: data.title || 'New Task',
      description: data.description || null,
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      tags: JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
    },
  });
}

async function applyCreateCredential(action, userId) {
  const { projectId, data } = action;
  return prisma.credential.create({
    data: {
      userId,
      projectId: projectId || null,
      label: data.label || 'New Credential',
      username: data.username ? encrypt(data.username) : null,
      password: data.password ? encrypt(data.password) : null,
      url: data.url || null,
      notes: data.notes || null,
      category: data.category || 'OTHER',
    },
  });
}

async function applyCreateNote(action, userId) {
  const { projectId, data } = action;
  return prisma.note.create({
    data: {
      userId,
      projectId: projectId || null,
      title: data.title || 'New Note',
      content: data.content || '',
      isPinned: data.isPinned || false,
      tags: Array.isArray(data.tags) ? data.tags : [],
    },
  });
}

async function applyCreateDb(action, userId) {
  const { projectId, data } = action;
  return prisma.dbConnection.create({
    data: {
      userId,
      projectId: projectId || null,
      label: data.label || 'New Connection',
      type: data.type || 'POSTGRESQL',
      host: data.host || null,
      port: data.port || null,
      dbName: data.dbName || null,
      username: data.username ? encrypt(data.username) : null,
      password: data.password ? encrypt(data.password) : null,
      backupUrl: data.backupUrl || null,
      notes: data.notes || null,
    },
  });
}

async function applyUpdateTask(action, userId) {
  const { data } = action;
  const { id, ...rest } = data || {};
  if (!id) throw new Error('Task id required');
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error(`Task ${id} not found`);
  return prisma.task.update({ where: { id }, data: rest });
}

async function applyBulkUpdate(action, userId) {
  const { data } = action;
  const { updates = [] } = data || {};
  const results = [];
  for (const upd of updates) {
    const res = await applyUpdateProject({ projectId: upd.projectId, data: upd.data }, userId);
    results.push(res);
  }
  return results;
}

module.exports = { chat, apply };
