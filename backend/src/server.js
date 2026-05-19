const fs = require('fs');
const path = require('path');
const env = require('./config/env');
const createApp = require('./app');
const buildContainer = require('./config/container');
const { connectDatabase } = require('./config/database');
const { startConsumers } = require('./infrastructure/messaging/consumers');
const logger = require('./shared/utils/logger');

const start = async () => {
  fs.mkdirSync(path.join(process.cwd(), 'uploads', 'products'), { recursive: true });

  const container = buildContainer();
  await connectDatabase();

  try {
    await container.rabbitMqClient.connect();
    await startConsumers(container.rabbitMqClient);
  } catch (error) {
    logger.warn('RabbitMQ unavailable; API will continue without async messaging', { error: error.message });
  }

  const app = createApp(container);
  const server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down server');
    server.close(async () => {
      await container.rabbitMqClient.close().catch(() => {});
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((error) => {
  logger.error('Server startup failed', { error: error.message, stack: error.stack });
  process.exit(1);
});
