'use strict';
require('dotenv').config();
const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('./crypto');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding NEXORY demo data...');

  const existing = await prisma.user.findUnique({ where: { email: 'demo@nexory.dev' } });
  if (existing) {
    console.log('✅ Demo data already exists. Skipping seed.');
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await argon2.hash('nexory123');
  const user = await prisma.user.create({
    data: { email: 'demo@nexory.dev', username: 'nexory_demo', passwordHash },
  });

  // Project 1 — NEXORY Platform
  const p1 = await prisma.project.create({
    data: {
      userId: user.id, name: 'NEXORY Platform', status: 'IN_DEVELOPMENT', priority: 'CRITICAL', category: 'WEB_APP',
      description: 'The NEXORY developer command center — a full-stack project management vault.',
      domain: 'nexory.dev', hosting: 'Vercel + Railway',
      frontendUrl: 'https://nexory.dev', backendUrl: 'https://api.nexory.dev',
      githubRepos: ['https://github.com/nexory/platform', 'https://github.com/nexory/api'],
      tags: ['react', 'node', 'prisma', 'tailwind'],
      technicalDocs: 'Built with React 18 + TypeScript, Node.js + Express, Prisma ORM + SQLite.',
      roadmap: 'Phase 1: MVP\nPhase 2: Teams & collaboration\nPhase 3: API integrations',
    },
  });

  await prisma.credential.createMany({
    data: [
      { userId: user.id, projectId: p1.id, label: 'Admin Panel', category: 'ADMIN', username: encrypt('admin@nexory.dev'), password: encrypt('AdminPass123!'), url: 'https://admin.nexory.dev' },
      { userId: user.id, projectId: p1.id, label: 'GitHub Deploy Key', category: 'API_KEY', username: encrypt('nexory-bot'), password: encrypt('ghp_demo_token_key_2026'), url: 'https://github.com' },
      { userId: user.id, projectId: p1.id, label: 'Vercel API Token', category: 'API_KEY', password: encrypt('vercel_token_demo_2026'), url: 'https://vercel.com' },
    ],
  });

  await prisma.task.createMany({
    data: [
      { userId: user.id, projectId: p1.id, title: 'Implement project drawer tabs', status: 'IN_PROGRESS', priority: 'HIGH', order: 1 },
      { userId: user.id, projectId: p1.id, title: 'Add markdown preview to notes', status: 'TODO', priority: 'MEDIUM', order: 2 },
      { userId: user.id, projectId: p1.id, title: 'Write API documentation', status: 'TODO', priority: 'LOW', order: 3 },
      { userId: user.id, projectId: p1.id, title: 'Setup CI/CD pipeline', status: 'TESTING', priority: 'HIGH', order: 4 },
      { userId: user.id, projectId: p1.id, title: 'Initial project scaffold', status: 'DONE', priority: 'CRITICAL', order: 5 },
    ],
  });

  await prisma.dbConnection.create({
    data: {
      userId: user.id, projectId: p1.id, label: 'Production DB', type: 'POSTGRESQL',
      host: 'db.railway.app', port: '5432', dbName: 'nexory_prod',
      username: encrypt('nexory_user'), password: encrypt('DbPassword2026!'),
      backupUrl: 's3://nexory-backups/prod',
    },
  });

  await prisma.note.createMany({
    data: [
      { userId: user.id, projectId: p1.id, title: 'Architecture Overview', content: '# Architecture\n\nNEXORY uses a monorepo structure with:\n- **Frontend**: React 18 + Vite + Tailwind\n- **Backend**: Node.js + Express + Prisma\n- **Database**: SQLite (dev) / PostgreSQL (prod)', isPinned: true, tags: JSON.stringify(['architecture', 'docs']) },
      { userId: user.id, projectId: p1.id, title: 'Deployment Checklist', content: '- [ ] Run `npm run build`\n- [ ] Set production env vars\n- [ ] Push DB migrations\n- [ ] Deploy to Vercel', tags: JSON.stringify(['deployment']) },
    ],
  });

  // Project 2 — Client Portal v2
  const p2 = await prisma.project.create({
    data: {
      userId: user.id, name: 'Client Portal v2', status: 'ACTIVE', priority: 'HIGH', category: 'CLIENT',
      description: 'Redesigned client portal with real-time dashboards and document management.',
      domain: 'portal.clientcorp.com', hosting: 'AWS EC2',
      tags: ['react', 'aws', 'client'],
    },
  });

  await prisma.credential.createMany({
    data: [
      { userId: user.id, projectId: p2.id, label: 'AWS Console', category: 'ADMIN', username: encrypt('aws-admin'), password: encrypt('AwsKey2026!'), url: 'https://aws.amazon.com' },
      { userId: user.id, projectId: p2.id, label: 'Client SFTP', category: 'FTP', username: encrypt('sftp_client'), password: encrypt('SftpPass99!'), url: 'sftp://files.clientcorp.com' },
    ],
  });

  await prisma.task.createMany({
    data: [
      { userId: user.id, projectId: p2.id, title: 'Redesign dashboard layout', status: 'IN_PROGRESS', priority: 'HIGH', order: 1 },
      { userId: user.id, projectId: p2.id, title: 'Integrate document upload API', status: 'TODO', priority: 'MEDIUM', order: 2 },
      { userId: user.id, projectId: p2.id, title: 'UAT testing with client', status: 'TODO', priority: 'HIGH', order: 3 },
    ],
  });

  await prisma.note.create({
    data: { userId: user.id, projectId: p2.id, title: 'Client Requirements', content: '## Key Requirements\n1. Real-time notifications\n2. PDF export\n3. Mobile responsive\n4. SSO with Azure AD', tags: ['requirements', 'client'] },
  });

  // Project 3 — Internal CLI Tools
  const p3 = await prisma.project.create({
    data: {
      userId: user.id, name: 'Internal CLI Tools', status: 'PAUSED', priority: 'MEDIUM', category: 'CLI',
      description: 'Collection of internal developer CLI utilities for automation and deployment.',
      githubRepos: ['https://github.com/nexory/cli-tools'],
      tags: ['cli', 'automation', 'nodejs'],
    },
  });

  await prisma.credential.create({
    data: { userId: user.id, projectId: p3.id, label: 'npm Registry Token', category: 'API_KEY', password: encrypt('npm_token_demo_2026'), url: 'https://registry.npmjs.org' },
  });

  await prisma.task.createMany({
    data: [
      { userId: user.id, projectId: p3.id, title: 'Add nexory deploy command', status: 'TODO', priority: 'MEDIUM', order: 1 },
      { userId: user.id, projectId: p3.id, title: 'Write CLI documentation', status: 'TODO', priority: 'LOW', order: 2 },
    ],
  });

  // Project 4 — E-commerce API
  const p4 = await prisma.project.create({
    data: {
      userId: user.id, name: 'E-commerce API', status: 'COMPLETED', priority: 'LOW', category: 'API',
      description: 'RESTful API for e-commerce platform with Stripe integration.',
      domain: 'api.shop.io', hosting: 'DigitalOcean',
      tags: ['api', 'stripe', 'ecommerce'],
    },
  });

  await prisma.credential.createMany({
    data: [
      { userId: user.id, projectId: p4.id, label: 'Stripe Secret Key', category: 'API_KEY', password: encrypt('sk_live_demo_stripe_2026'), url: 'https://stripe.com' },
      { userId: user.id, projectId: p4.id, label: 'DigitalOcean SSH', category: 'SSH', username: encrypt('root'), password: encrypt('DO_SSH_KEY_2026'), url: 'shop.io' },
    ],
  });

  await prisma.task.create({
    data: { userId: user.id, projectId: p4.id, title: 'Final integration tests', status: 'DONE', priority: 'HIGH', order: 1 },
  });

  await prisma.note.create({
    data: { userId: user.id, projectId: p4.id, title: 'API Endpoints', content: '## Endpoints\n- POST /products — Create product\n- GET /products — List products\n- POST /checkout — Create Stripe session\n- POST /webhooks/stripe — Handle events', tags: ['api', 'docs'] },
  });

  // Activity logs
  await prisma.activityLog.createMany({
    data: [
      { userId: user.id, action: 'LOGIN', entity: 'USER', entityId: user.id, entityName: user.username, details: {} },
      { userId: user.id, projectId: p1.id, action: 'CREATED', entity: 'PROJECT', entityId: p1.id, entityName: p1.name, details: {} },
      { userId: user.id, projectId: p2.id, action: 'CREATED', entity: 'PROJECT', entityId: p2.id, entityName: p2.name, details: {} },
      { userId: user.id, projectId: p3.id, action: 'CREATED', entity: 'PROJECT', entityId: p3.id, entityName: p3.name, details: {} },
      { userId: user.id, projectId: p4.id, action: 'CREATED', entity: 'PROJECT', entityId: p4.id, entityName: p4.name, details: {} },
      { userId: user.id, projectId: p4.id, action: 'UPDATED', entity: 'PROJECT', entityId: p4.id, entityName: p4.name, details: { field: 'status', value: 'COMPLETED' } },
    ],
  });

  console.log('✅ Demo data seeded successfully!');
  console.log('   Login: demo@nexory.dev / nexory123');
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
