const amqp = require('amqplib');
const env = require('../../config/env');
const logger = require('../../shared/utils/logger');

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect(retries = 5) {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        this.connection = await amqp.connect(env.rabbitMqUrl);
        this.channel = await this.connection.createChannel();
        await this.assertQueues();
        logger.info('RabbitMQ connected');
        return this.channel;
      } catch (error) {
        logger.warn('RabbitMQ connection failed', { attempt, error: error.message });
        if (attempt === retries) throw error;
        await wait(attempt * 1000);
      }
    }
  }

  async assertQueues() {
    const queues = Object.values(env.queues);
    await Promise.all(
      queues.map((queue) =>
        this.channel.assertQueue(queue, {
          durable: true
        })
      )
    );
  }

  async publish(queue, payload) {
    if (!this.channel) return false;
    return this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json'
    });
  }

  async consume(queue, handler) {
    if (!this.channel) return;
    await this.channel.prefetch(10);
    await this.channel.consume(queue, async (message) => {
      if (!message) return;
      try {
        const payload = JSON.parse(message.content.toString());
        await handler(payload);
        this.channel.ack(message);
      } catch (error) {
        logger.error('RabbitMQ consumer error', { queue, error: error.message });
        const retries = Number(message.properties.headers?.['x-retry-count'] || 0);
        if (retries >= 3) {
          this.channel.ack(message);
          return;
        }
        this.channel.nack(message, false, false);
        this.channel.sendToQueue(queue, message.content, {
          persistent: true,
          contentType: 'application/json',
          headers: { 'x-retry-count': retries + 1 }
        });
      }
    });
  }

  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = RabbitMQClient;
