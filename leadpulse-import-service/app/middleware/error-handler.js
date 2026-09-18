const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled Exception in Import Service API', { error: err.message, stack: err.stack });
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message
    }
  });
}

module.exports = errorHandler;
