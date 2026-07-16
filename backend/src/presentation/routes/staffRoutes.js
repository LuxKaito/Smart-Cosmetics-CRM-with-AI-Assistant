const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const ROLES = require('../../shared/constants/roles');
const { protectRoute, requireRole } = require('../middlewares/authMiddleware');
const {
  staffResourceParamSchema,
  listStaffOrdersQuerySchema,
  listStaffCustomersQuerySchema,
  staffOrderStatusSchema,
  staffCancelOrderSchema
} = require('../../application/dtos/staffDtos');

const staffRoutes = ({ staffController, tokenService, userRepository }) => {
  const router = express.Router();
  router.use(protectRoute(tokenService, userRepository));
  router.use(requireRole(ROLES.STAFF));

  router.get('/overview', asyncHandler(staffController.overview));

  router.get('/orders', validate(listStaffOrdersQuerySchema, 'query'), asyncHandler(staffController.listOrders));
  router.get(
    '/orders/:id',
    validate(staffResourceParamSchema, 'params'),
    asyncHandler(staffController.getOrderDetail)
  );
  router.patch(
    '/orders/:id/status',
    validate(staffResourceParamSchema, 'params'),
    validate(staffOrderStatusSchema),
    asyncHandler(staffController.updateOrderStatus)
  );
  router.patch(
    '/orders/:id/confirm',
    validate(staffResourceParamSchema, 'params'),
    asyncHandler(staffController.confirmOrder)
  );
  router.patch(
    '/orders/:id/cancel',
    validate(staffResourceParamSchema, 'params'),
    validate(staffCancelOrderSchema),
    asyncHandler(staffController.cancelOrder)
  );

  router.get(
    '/customers',
    validate(listStaffCustomersQuerySchema, 'query'),
    asyncHandler(staffController.listCustomers)
  );
  router.get(
    '/customers/:id/orders',
    validate(staffResourceParamSchema, 'params'),
    asyncHandler(staffController.getCustomerOrders)
  );
  router.get(
    '/customers/:id',
    validate(staffResourceParamSchema, 'params'),
    asyncHandler(staffController.getCustomerDetail)
  );

  return router;
};

module.exports = staffRoutes;
