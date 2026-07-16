const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const env = require('./config/env');
const buildContainer = require('./config/container');
const sanitizeInput = require('./presentation/middlewares/sanitizeMiddleware');
const authRoutes = require('./presentation/routes/authRoutes');
const productRoutes = require('./presentation/routes/productRoutes');
const cartRoutes = require('./presentation/routes/cartRoutes');
const adminRoutes = require('./presentation/routes/adminRoutes');
const staffRoutes = require('./presentation/routes/staffRoutes');
const checkoutRoutes = require('./presentation/routes/checkoutRoutes');
const orderRoutes = require('./presentation/routes/orderRoutes');
const paymentRoutes = require('./presentation/routes/paymentRoutes');
const voucherRoutes = require('./presentation/routes/voucherRoutes');
const reviewRoutes = require('./presentation/routes/reviewRoutes');
const { success } = require('./shared/utils/apiResponse');
const { notFound, errorHandler } = require('./presentation/middlewares/errorMiddleware');

const createApp = (container = buildContainer()) => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(mongoSanitize());
  app.use(sanitizeInput);
  if (env.nodeEnv !== 'test') app.use(morgan('combined'));

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.get('/health', (req, res) => success(res, { status: 'ok', uptime: process.uptime() }));

  app.use(`${env.apiPrefix}/auth`, authRoutes(container));
  app.use(`${env.apiPrefix}/products`, productRoutes(container));
  app.use(`${env.apiPrefix}/cart`, cartRoutes(container));
  app.use(`${env.apiPrefix}/admin`, adminRoutes(container));
  if (container.staffController) {
    app.use(`${env.apiPrefix}/staff`, staffRoutes(container));
  }
  app.use(`${env.apiPrefix}/checkout`, checkoutRoutes(container));
  app.use(`${env.apiPrefix}/orders`, orderRoutes(container));
  app.use(`${env.apiPrefix}/payments`, paymentRoutes(container));
  if (container.voucherController) {
    app.use(`${env.apiPrefix}/vouchers`, voucherRoutes(container));
  }
  if (container.reviewController) {
    app.use(`${env.apiPrefix}/reviews`, reviewRoutes(container));
  }

  app.use(notFound);
  app.use(errorHandler);

  app.locals.container = container;
  return app;
};

module.exports = createApp;
