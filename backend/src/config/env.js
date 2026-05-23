const dotenv = require('dotenv');

dotenv.config();

const parseList = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/smart_cosmetics_crm',
  jwtSecret: process.env.JWT_SECRET || 'dev_access_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  authAccessCookieName: process.env.AUTH_ACCESS_COOKIE_NAME || 'access_token',
  authRefreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || 'refresh_token',
  emailVerificationTokenTtlMinutes: Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60),
  guestCartCookieName: process.env.GUEST_CART_COOKIE_NAME || 'cart_token',
  guestCartTtlDays: Number(process.env.GUEST_CART_TTL_DAYS || 30),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  payosClientId: process.env.PAYOS_CLIENT_ID || '',
  payosApiKey: process.env.PAYOS_API_KEY || '',
  payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  payosReturnUrl: process.env.PAYOS_RETURN_URL || 'http://localhost:5000/api/v1/payments/payos/return',
  payosCancelUrl: process.env.PAYOS_CANCEL_URL || 'http://localhost:5000/api/v1/payments/payos/cancel',
  payosBaseUrl: process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || 'no-reply@luxberry.vn',
  rabbitMqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  queues: {
    userRegistered: process.env.RABBITMQ_USER_REGISTERED_QUEUE || 'user.registered',
    emailVerificationRequested:
      process.env.RABBITMQ_EMAIL_VERIFICATION_REQUESTED_QUEUE || 'email.verification.requested',
    userEmailVerified: process.env.RABBITMQ_USER_EMAIL_VERIFIED_QUEUE || 'user.email.verified',
    cartMerged: process.env.RABBITMQ_CART_MERGED_QUEUE || 'cart.merged',
    orderCreated: process.env.RABBITMQ_ORDER_CREATED_QUEUE || 'order.created',
    orderCancelled: process.env.RABBITMQ_ORDER_CANCELLED_QUEUE || 'order.cancelled',
    paymentPending: process.env.RABBITMQ_PAYMENT_PENDING_QUEUE || 'payment.pending',
    paymentSuccess: process.env.RABBITMQ_PAYMENT_SUCCESS_QUEUE || 'payment.success',
    paymentFailed: process.env.RABBITMQ_PAYMENT_FAILED_QUEUE || 'payment.failed',
    productCreated: process.env.RABBITMQ_PRODUCT_CREATED_QUEUE || 'product.created',
    productUpdated: process.env.RABBITMQ_PRODUCT_UPDATED_QUEUE || 'product.updated',
    productDeleted: process.env.RABBITMQ_PRODUCT_DELETED_QUEUE || 'product.deleted'
  },
  corsOrigins: parseList(process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
};

module.exports = env;
