const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');

class PaymentService {
  constructor({ orderService, payosClient }) {
    this.orderService = orderService;
    this.payosClient = payosClient;
  }

  async createPayOSPaymentLink(userId, orderId) {
    return this.orderService.createPayOSPaymentForOrder(userId, orderId);
  }

  async handlePayOSWebhook(body) {
    if (!this.payosClient.verifyWebhookSignature(body)) {
      throw new AppError('Invalid payOS webhook signature', 400, 'PAYOS_INVALID_SIGNATURE');
    }

    const data = body?.data || {};
    const orderCode = Number(data.orderCode || body.orderCode || body?.data?.orderCode);
    if (!orderCode) throw new AppError('Missing payOS orderCode', 400, 'PAYOS_ORDER_CODE_REQUIRED');

    if (isSuccessPayload(body, data)) {
      const order = await this.orderService.markPaymentSuccessByOrderCode(orderCode, {
        source: 'webhook',
        payload: body
      });
      return { handled: true, paymentStatus: 'PAID', order };
    }

    const cancelled = isCancelledPayload(body, data);
    const order = await this.orderService.markPaymentFailedByOrderCode(
      orderCode,
      {
        source: 'webhook',
        payload: body,
        reason: body?.desc || data?.status || 'PAYMENT_FAILED'
      },
      cancelled
    );
    return { handled: true, paymentStatus: cancelled ? 'CANCELLED' : 'FAILED', order };
  }

  async handlePayOSReturn(query = {}) {
    const orderCode = Number(query.orderCode || query.ordercode || query.code);
    if (!orderCode) throw new AppError('Missing orderCode', 400, 'PAYOS_ORDER_CODE_REQUIRED');

    if (isQuerySuccess(query)) {
      const order = await this.orderService.markPaymentSuccessByOrderCode(orderCode, {
        source: 'return',
        query
      });
      return {
        order,
        redirectUrl: `${env.frontendBaseUrl}/checkout/success?orderId=${order.id}`
      };
    }

    const cancelled = isQueryCancelled(query);
    const order = await this.orderService.markPaymentFailedByOrderCode(
      orderCode,
      {
        source: 'return',
        query,
        reason: query.status || query.cancel || 'PAYMENT_FAILED'
      },
      cancelled
    );

    return {
      order,
      redirectUrl: `${env.frontendBaseUrl}/checkout/failed?orderId=${order.id}`
    };
  }

  async handlePayOSCancel(query = {}) {
    const orderCode = Number(query.orderCode || query.ordercode || query.code);
    if (!orderCode) throw new AppError('Missing orderCode', 400, 'PAYOS_ORDER_CODE_REQUIRED');

    const order = await this.orderService.markPaymentFailedByOrderCode(
      orderCode,
      {
        source: 'cancel',
        query,
        reason: 'PAYMENT_CANCELLED'
      },
      true
    );

    return {
      order,
      redirectUrl: `${env.frontendBaseUrl}/checkout/failed?orderId=${order.id}`
    };
  }
}

const isSuccessPayload = (body, data) => {
  const code = String(body?.code || '').toUpperCase();
  const status = String(data?.status || '').toUpperCase();
  return code === '00' || status === 'PAID' || status === 'SUCCESS';
};

const isCancelledPayload = (body, data) => {
  const status = String(data?.status || '').toUpperCase();
  const desc = String(body?.desc || '').toUpperCase();
  return status.includes('CANCEL') || desc.includes('CANCEL');
};

const isQuerySuccess = (query = {}) => {
  const status = String(query.status || query.code || '').toUpperCase();
  return status === 'SUCCESS' || status === '00' || status === 'PAID';
};

const isQueryCancelled = (query = {}) => {
  const status = String(query.status || query.cancel || '').toUpperCase();
  return status.includes('CANCEL');
};

module.exports = PaymentService;
