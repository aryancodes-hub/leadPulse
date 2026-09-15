const app = require('./app');
const logger = require('./utils/logger');

function startServer(port, dbConnection) {
  const server = app.listen(port, () => {
    logger.info(`Core API server is running on http://localhost:${port}`);
  });

  // Flawless Graceful Shutdown
  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    server.close(async () => {
      logger.info('HTTP server closed.');
      if (dbConnection) {
        await dbConnection.close();
        logger.info('Database connection closed.');
      }
      process.exit(0); // 0 = Clean Exit
    });

    // Force close if taking too long (e.g., 10 seconds)
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  // Catch unexpected crashes
  const unexpectedErrorHandler = (error) => {
    logger.error('Unhandled Rejection or Exception', { error: error.message, stack: error.stack });
    process.exit(1); // 1 = Fatal Error
  };

  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}

module.exports = { startServer };
