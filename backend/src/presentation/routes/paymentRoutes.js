const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const { protectRoute } = require('../middlewares/authMiddleware');
const { payosCreatePaymentSchema, payosWebhookSchema } = require('../../application/dtos/paymentDtos');

const paymentRoutes = ({ paymentController, tokenService, userRepository }) => {
  const router = express.Router();
  const requireAuth = protectRoute(tokenService, userRepository);

  router.post('/payos/create', requireAuth, validate(payosCreatePaymentSchema), asyncHandler(paymentController.createPayOSPayment));
  router.post('/payos/webhook', validate(payosWebhookSchema), asyncHandler(paymentController.payosWebhook));
  router.get('/payos/return', asyncHandler(paymentController.payosReturn));
  router.get('/payos/cancel', asyncHandler(paymentController.payosCancel));

  return router;
};

module.exports = paymentRoutes;
