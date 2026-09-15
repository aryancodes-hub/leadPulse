const logger = require('../utils/logger');
const { AppError } = require('../lib/error');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request payload';
    details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
    details = err.errors.map(e => e.message);
  }

  if (statusCode === 500) {
    logger.error('Unhandled Exception:', { 
      message: err.message, 
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  } else {
    logger.warn('Client Error:', { code, message, details, url: req.originalUrl });
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && { details })
    }
  });
}

module.exports = errorHandler;
