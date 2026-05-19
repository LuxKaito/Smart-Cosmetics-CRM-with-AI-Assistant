const env = require('../../config/env');
const logger = require('../../shared/utils/logger');
const EVENTS = require('../../shared/constants/events');
const EmailService = require('../notifications/EmailService');

const startConsumers = async (rabbitMqClient) => {
  const emailService = new EmailService();

  await rabbitMqClient.consume(env.queues.userRegistered, async (message) => {
    await handleAuthEmailEvent(emailService, message);
  });

  await rabbitMqClient.consume(env.queues.emailVerificationRequested, async (message) => {
    await handleAuthEmailEvent(emailService, message);
  });

  await rabbitMqClient.consume(env.queues.userEmailVerified, async (message) => {
    logger.info('User email verified event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.productCreated, async (message) => {
    logger.info('Product created event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.productUpdated, async (message) => {
    logger.info('Product updated event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.productDeleted, async (message) => {
    logger.info('Product deleted event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.cartMerged, async (message) => {
    logger.info('Cart merged event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.orderCreated, async (message) => {
    logger.info('Order created event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.orderCancelled, async (message) => {
    logger.info('Order cancelled event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.paymentPending, async (message) => {
    logger.info('Payment pending event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.paymentSuccess, async (message) => {
    logger.info('Payment success event consumed', message);
  });

  await rabbitMqClient.consume(env.queues.paymentFailed, async (message) => {
    logger.info('Payment failed event consumed', message);
  });
};

const handleAuthEmailEvent = async (emailService, message) => {
  const event = message?.event;
  const payload = message?.payload || {};

  if (![EVENTS.AUTH.USER_REGISTERED, EVENTS.AUTH.EMAIL_VERIFICATION_REQUESTED].includes(event)) {
    logger.warn('Unhandled auth email event', { event, payload });
    return;
  }

  await emailService.sendVerificationEmail({
    email: payload.email,
    name: payload.name,
    verifyUrl: payload.verifyUrl
  });

  logger.info('Verification email dispatch succeeded', {
    event,
    userId: payload.userId,
    email: payload.email
  });
};

module.exports = { startConsumers };
