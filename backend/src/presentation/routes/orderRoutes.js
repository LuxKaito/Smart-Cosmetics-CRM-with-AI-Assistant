const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const { protectRoute } = require('../middlewares/authMiddleware');
const {
  createOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema
} = require('../../application/dtos/orderDtos');

const orderRoutes = ({ orderController, tokenService, userRepository }) => {
  const router = express.Router();
  const requireAuth = protectRoute(tokenService, userRepository);

  router.use(requireAuth);

  router.post('/', validate(createOrderSchema), asyncHandler(orderController.create));
  router.get('/my', asyncHandler(orderController.listMyOrders));
  router.patch(
    '/:id/cancel',
    validate(orderIdParamSchema, 'params'),
    validate(cancelOrderSchema),
    asyncHandler(orderController.cancel)
  );
  router.get('/:id', validate(orderIdParamSchema, 'params'), asyncHandler(orderController.detail));

  return router;
};

module.exports = orderRoutes;
