'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const prisma = new PrismaClient();
const app = express();

// Security & middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/credentials', require('./routes/credentials'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/db-connections', require('./routes/dbConnections'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/ai', require('./routes/ai'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// Error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`\n🚀 NEXORY Backend → http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
