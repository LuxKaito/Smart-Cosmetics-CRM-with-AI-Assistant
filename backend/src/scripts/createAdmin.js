const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../infrastructure/database/models/UserModel');
const PasswordService = require('../application/services/PasswordService');
const ROLES = require('../shared/constants/roles');
const logger = require('../shared/utils/logger');

const run = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const passwordService = new PasswordService();

  await mongoose.connect(env.mongoUri);

  const existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    existing.role = ROLES.ADMIN;
    existing.emailVerified = true;
    existing.isBlocked = false;
    if (!existing.passwordHash) existing.passwordHash = await passwordService.hash(password);
    await existing.save();
    logger.info('Existing user promoted to admin', { email });
  } else {
    await User.create({
      email,
      name: 'System Admin',
      passwordHash: await passwordService.hash(password),
      role: ROLES.ADMIN,
      emailVerified: true,
      isBlocked: false
    });
    logger.info('Admin user created', { email });
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  logger.error('Create admin failed', { error: error.message, stack: error.stack });
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
