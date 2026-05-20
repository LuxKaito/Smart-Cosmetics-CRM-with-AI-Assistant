const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');
const { hashSha256 } = require('../../shared/utils/cryptoToken');

class PayOSClient {
  constructor() {
    this.clientId = env.payosClientId;
    this.apiKey = env.payosApiKey;
    this.checksumKey = env.payosChecksumKey;
    this.baseUrl = env.payosBaseUrl.replace(/\/+$/, '');
    this.payos = null;
    this.sdkLoadError = null;

    if (this.isConfigured()) {
      this.initializeSdkClient();
    }
  }

  isConfigured() {
    return Boolean(this.clientId && this.apiKey && this.checksumKey);
  }

  initializeSdkClient() {
    try {
      const { PayOS } = require('@payos/node');
      this.payos = new PayOS({
        clientId: this.clientId,
        apiKey: this.apiKey,
        checksumKey: this.checksumKey,
        baseURL: this.baseUrl
      });
    } catch (error) {
      this.sdkLoadError = error;
      this.payos = null;
    }
  }

  ensureSdkAvailable() {
    if (this.payos) return;

    if (this.sdkLoadError) {
      throw new AppError(
        'payOS SDK is unavailable. Please install @payos/node and restart backend.',
        500,
        'PAYOS_SDK_UNAVAILABLE',
        { reason: this.sdkLoadError.message }
      );
    }

    throw new AppError('payOS SDK is not initialized', 500, 'PAYOS_SDK_UNAVAILABLE');
  }

  async createPaymentLink(payload) {
    const body = buildPaymentPayload(payload);

    if (!this.isConfigured()) {
      return {
        checkoutUrl: `${env.frontendBaseUrl}/checkout/success?orderCode=${body.orderCode}`,
        paymentLinkId: `mock-${hashSha256(String(body.orderCode)).slice(0, 12)}`,
        payosOrderCode: body.orderCode,
        raw: {
          mode: 'mock',
          body
        }
      };
    }

    this.ensureSdkAvailable();

    try {
      const result = await this.payos.paymentRequests.create(body);
      if (!result?.checkoutUrl) {
        throw new AppError('Failed to create payOS payment link', 502, 'PAYOS_CREATE_LINK_FAILED');
      }

      return {
        checkoutUrl: result.checkoutUrl,
        paymentLinkId: result.paymentLinkId || '',
        payosOrderCode: Number(result.orderCode || body.orderCode),
        raw: result
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw normalizePayOSError(error, 'Failed to create payOS payment link', 'PAYOS_CREATE_LINK_FAILED');
    }
  }

  async verifyWebhookSignature(payload = {}) {
    if (!this.isConfigured()) return true;
    this.ensureSdkAvailable();

    try {
      await this.payos.webhooks.verify(payload);
      return true;
    } catch (error) {
      return false;
    }
  }
}

const buildPaymentPayload = (payload = {}) => {
  const orderCode = Number(payload.orderCode);
  const amount = Math.round(Number(payload.amount || 0));
  const description = String(payload.description || '').trim().slice(0, 255);
  const returnUrl = String(payload.returnUrl || env.payosReturnUrl || '').trim();
  const cancelUrl = String(payload.cancelUrl || env.payosCancelUrl || '').trim();
  const items = (payload.items || [])
    .map((item) => ({
      name: String(item?.name || '').trim().slice(0, 80),
      quantity: Number(item?.quantity || 0),
      price: Math.round(Number(item?.price || 0))
    }))
    .filter((item) => item.name && item.quantity > 0 && item.price >= 0);

  if (!Number.isInteger(orderCode) || orderCode <= 0) {
    throw new AppError('Invalid payOS orderCode', 400, 'PAYOS_ORDER_CODE_INVALID');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Invalid payOS amount', 400, 'PAYOS_AMOUNT_INVALID');
  }
  if (!description) {
    throw new AppError('Invalid payOS description', 400, 'PAYOS_DESCRIPTION_INVALID');
  }
  if (!returnUrl || !cancelUrl) {
    throw new AppError('Missing payOS return/cancel URL', 500, 'PAYOS_CALLBACK_URL_MISSING');
  }

  return {
    orderCode,
    amount,
    description,
    returnUrl,
    cancelUrl,
    items
  };
};

const normalizePayOSError = (error, fallbackMessage, code) =>
  new AppError(
    error?.desc || error?.message || fallbackMessage,
    Number.isInteger(error?.status) ? error.status : 502,
    code,
    {
      name: error?.name || 'PayOSError',
      status: error?.status || null,
      code: error?.code || null,
      desc: error?.desc || null
    }
  );

module.exports = PayOSClient;
