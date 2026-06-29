const app = require('./app');
const env = require('./config/env.config');
const { sequelize } = require('./models');
const logger = require('./config/logger');

const server = app.listen(env.port, async () => {
  logger.info(`Server running in ${env.env} mode on port ${env.port}`);
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database: %o', error);
    process.exit(1);
  }
});

server.on('error', (error) => {
  logger.error('Server error: %o', error);
});

const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    sequelize.close().then(() => {
      logger.info('Database connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection: %o', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception: %o', err);
  server.close(() => process.exit(1));
});
