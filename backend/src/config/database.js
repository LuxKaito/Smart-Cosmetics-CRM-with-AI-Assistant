const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../shared/utils/logger');

const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  logger.info('MongoDB connected', { database: mongoose.connection.name });
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase };
