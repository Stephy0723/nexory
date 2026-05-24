'use strict';

function errorHandler(err, req, res, _next) {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma unique constraint
  if (err.code === 'P2002') {
    const field = (err.meta && err.meta.target && err.meta.target[0]) || 'field';
    return res.status(409).json({ success: false, error: `A record with this ${field} already exists.`, code: 409 });
  }

  // Prisma not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Record not found.', code: 404 });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({ success: false, error: message, code: statusCode });
}

module.exports = { errorHandler };
