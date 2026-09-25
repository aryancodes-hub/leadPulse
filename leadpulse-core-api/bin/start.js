const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const { sequelize } = require('leadpulse-data-model');
const { startServer } = require('../app/server');
const logger = require('../app/utils/logger');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Authenticate with the database
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL successfully.');
    
    // 2. Auto-migrate tables
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized and tables migrated.');

    // 3. Start the server, passing the DB connection for graceful shutdown
    startServer(PORT, sequelize);
    
  } catch (error) {
    logger.error('Startup failed:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

bootstrap();
