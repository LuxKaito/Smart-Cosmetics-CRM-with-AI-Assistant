const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../shared/utils/logger');

const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  logger.info('MongoDB connected', { database: mongoose.connection.name });
  await cleanupLegacyCartIndexes();
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

const cleanupLegacyCartIndexes = async () => {
  const legacyIndexes = ['user_1', 'guestId_1'];
  try {
    const cartCollection = mongoose.connection.db.collection('carts');
    const indexes = await cartCollection.indexes();
    const existing = new Set(indexes.map((index) => index.name));

    for (const indexName of legacyIndexes) {
      if (!existing.has(indexName)) continue;
      await cartCollection.dropIndex(indexName);
      logger.warn('Dropped legacy cart index', { indexName });
    }
  } catch (error) {
    logger.warn('Skipping legacy cart index cleanup', { error: error.message });
  }
};

module.exports = { connectDatabase, disconnectDatabase };
