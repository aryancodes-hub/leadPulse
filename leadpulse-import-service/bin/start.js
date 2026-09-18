const { startServer } = require('../app/server');
const logger = require('../app/utils/logger');
const { sequelize } = require('leadpulse-data-model');
const importWorker = require('../app/workers/import.worker');

async function bootstrap() {
  try {
    logger.info('Starting Leadpulse Import Service...');
    
    // Start the HTTP health check server
    await startServer();

    // Initialize database connection
    logger.info('Connecting to the database...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Start polling worker
    importWorker.start();
    
    logger.info('Import Service Part 2 is up and running. Background worker is active!');

  } catch (error) {
    logger.error('Failed to start Leadpulse Import Service', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
