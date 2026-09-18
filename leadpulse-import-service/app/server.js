const app = require('./app');
const logger = require('./utils/logger');

function startServer(port = process.env.IMPORT_SERVICE_PORT || 3002) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      logger.info(`Import service HTTP server running on port ${port}`);
      resolve(server);
    });
  });
}

module.exports = { startServer };
