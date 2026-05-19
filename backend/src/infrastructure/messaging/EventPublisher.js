const env = require('../../config/env');
const logger = require('../../shared/utils/logger');
const EVENTS = require('../../shared/constants/events');

class EventPublisher {
  constructor(rabbitMqClient) {
    this.rabbitMqClient = rabbitMqClient;
  }

  async publishUserRegistered(payload) {
    return this.publish(env.queues.userRegistered, EVENTS.AUTH.USER_REGISTERED, payload);
  }

  async publishEmailVerificationRequested(payload) {
    return this.publish(
      env.queues.emailVerificationRequested,
      EVENTS.AUTH.EMAIL_VERIFICATION_REQUESTED,
      payload
    );
  }

  async publishUserEmailVerified(payload) {
    return this.publish(env.queues.userEmailVerified, EVENTS.AUTH.USER_EMAIL_VERIFIED, payload);
  }

  async publishCartMerged(payload) {
    return this.publish(env.queues.cartMerged, EVENTS.CART.CART_MERGED, payload);
  }

  async publishOrderCreated(payload) {
    return this.publish(env.queues.orderCreated, EVENTS.ORDER.ORDER_CREATED, payload);
  }

  async publishOrderCancelled(payload) {
    return this.publish(env.queues.orderCancelled, EVENTS.ORDER.ORDER_CANCELLED, payload);
  }

  async publishPaymentPending(payload) {
    return this.publish(env.queues.paymentPending, EVENTS.PAYMENT.PAYMENT_PENDING, payload);
  }

  async publishPaymentSuccess(payload) {
    return this.publish(env.queues.paymentSuccess, EVENTS.PAYMENT.PAYMENT_SUCCESS, payload);
  }

  async publishPaymentFailed(payload) {
    return this.publish(env.queues.paymentFailed, EVENTS.PAYMENT.PAYMENT_FAILED, payload);
  }

  async publishProductCreated(payload) {
    return this.publish(env.queues.productCreated, EVENTS.PRODUCT.PRODUCT_CREATED, payload);
  }

  async publishProductUpdated(payload) {
    return this.publish(env.queues.productUpdated, EVENTS.PRODUCT.PRODUCT_UPDATED, payload);
  }

  async publishProductDeleted(payload) {
    return this.publish(env.queues.productDeleted, EVENTS.PRODUCT.PRODUCT_DELETED, payload);
  }

  async publish(queue, event, payload) {
    try {
      await this.rabbitMqClient.publish(queue, {
        event,
        payload,
        publishedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Event publish failed', { queue, event, error: error.message });
    }
  }
}

module.exports = EventPublisher;
