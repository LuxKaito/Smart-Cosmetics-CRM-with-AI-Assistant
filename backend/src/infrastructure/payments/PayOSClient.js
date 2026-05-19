const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');
const { hashSha256 } = require('../../shared/utils/cryptoToken');

class PayOSClient {
  constructor() {
    this.clientId = env.payosClientId;
    this.apiKey = env.payosApiKey;
    this.checksumKey = env.payosChecksumKey;
    this.baseUrl = env.payosBaseUrl.replace(/\/+$/, '');
  }

  isConfigured() {
    return Boolean(this.clientId && this.apiKey && this.checksumKey);
  }

  async createPaymentLink(payload) {
    const body = {
      orderCode: Number(payload.orderCode),
      amount: Math.round(Number(payload.amount || 0)),
      description: String(payload.description || '').slice(0, 255),
      cancelUrl: payload.cancelUrl || env.payosCancelUrl,
      returnUrl: payload.returnUrl || env.payosReturnUrl,
      items: (payload.items || []).map((item) => ({
        name: String(item.name || '').slice(0, 80),
        quantity: Number(item.quantity || 1),
        price: Math.round(Number(item.price || 0))
      }))
    };

    body.signature = this.sign(body);

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

    const response = await fetch(`${this.baseUrl}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(body)
    });

    const result = await parseJsonSafe(response);
    if (!response.ok || !result?.data?.checkoutUrl) {
      throw new AppError(
        result?.desc || result?.message || 'Failed to create payOS payment link',
        502,
        'PAYOS_CREATE_LINK_FAILED',
        result || null
      );
    }

    return {
      checkoutUrl: result.data.checkoutUrl,
      paymentLinkId: result.data.paymentLinkId || '',
      payosOrderCode: Number(result.data.orderCode || body.orderCode),
      raw: result
    };
  }

  verifyWebhookSignature(payload = {}) {
    if (!this.isConfigured()) return true;

    const incomingSignature = payload.signature || payload.data?.signature || '';
    if (!incomingSignature) return false;

    const data = payload.data || payload;
    const localSignature = this.sign(data);
    return safeCompare(incomingSignature, localSignature);
  }

  sign(data = {}) {
    if (!this.checksumKey) return '';
    const canonical = canonicalize(data);
    return require('crypto').createHmac('sha256', this.checksumKey).update(canonical).digest('hex');
  }
}

const canonicalize = (data) =>
  Object.keys(data)
    .filter((key) => key !== 'signature' && data[key] !== undefined && data[key] !== null)
    .sort()
    .map((key) => `${key}=${stringifyValue(data[key])}`)
    .join('&');

const stringifyValue = (value) => {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const safeCompare = (a, b) => {
  try {
    return require('crypto').timingSafeEqual(Buffer.from(String(a)), Buffer.from(String(b)));
  } catch (error) {
    return false;
  }
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

module.exports = PayOSClient;
