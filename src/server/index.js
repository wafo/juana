const logger = require('../utils/logger');

function startServer() {
  logger.server('Initializing Server');
  require('../locale');
  require('../discord');
}

startServer();
