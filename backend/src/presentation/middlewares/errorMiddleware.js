const { fail } = require('../../shared/utils/apiResponse');
const logger = require('../../shared/utils/logger');

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  logger.error(message, {
    statusCode,
    code: err.code,
    path: req.originalUrl,
    method: req.method,
    details: err.details,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  return fail(res, message, statusCode, {
    code: err.code || 'INTERNAL_ERROR',
    details: err.details || null
  });
};

module.exports = { notFound, errorHandler };
