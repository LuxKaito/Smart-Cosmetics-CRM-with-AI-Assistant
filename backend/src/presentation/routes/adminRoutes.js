const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const {
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  overviewQuerySchema,
  listUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
  blockUserSchema,
  listVouchersQuerySchema,
  createVoucherSchema,
  updateVoucherSchema,
  statisticsQuerySchema,
  adminResourceParamSchema
} = require('../../application/dtos/adminDtos');
const { protectRoute, requireAdmin } = require('../middlewares/authMiddleware');

const adminRoutes = ({ adminController, tokenService, userRepository }) => {
  const router = express.Router();
  router.use(protectRoute(tokenService, userRepository));

  router.get('/overview', requireAdmin, validate(overviewQuerySchema, 'query'), asyncHandler(adminController.overview));
  router.get('/statistics', requireAdmin, validate(statisticsQuerySchema, 'query'), asyncHandler(adminController.statistics));
  router.get('/products', requireAdmin, validate(listProductsQuerySchema, 'query'), asyncHandler(adminController.listProducts));
  router.post('/products', requireAdmin, validate(createProductSchema), asyncHandler(adminController.createProduct));
  router.patch(
    '/products/:id',
    requireAdmin,
    validate(adminResourceParamSchema, 'params'),
    validate(updateProductSchema),
    asyncHandler(adminController.updateProduct)
  );
  router.delete(
    '/products/:id',
    requireAdmin,
    validate(adminResourceParamSchema, 'params'),
    asyncHandler(adminController.deleteProduct)
  );

  router.get(
    '/users',
    requireAdmin,
    validate(listUsersQuerySchema, 'query'),
    asyncHandler(adminController.listUsers)
  );
  router.post('/users', requireAdmin, validate(createUserSchema), asyncHandler(adminController.createUser));
  router.patch(
    '/users/:id',
    requireAdmin,
    validate(adminResourceParamSchema, 'params'),
    validate(updateUserSchema),
    asyncHandler(adminController.updateUser)
  );
  router.patch(
    '/users/:id/block',
    requireAdmin,
    validate(adminResourceParamSchema, 'params'),
    validate(blockUserSchema),
    asyncHandler(adminController.setUserBlocked)
  );
  router.patch(
    '/users/:id/role',
    requireAdmin,
    validate(adminResourceParamSchema, 'params'),
    validate(assignRoleSchema),
    asyncHandler(adminController.assignRole)
  );
  router.get('/vouchers', requireAdmin, validate(listVouchersQuerySchema, 'query'), asyncHandler(adminController.listVouchers));
  router.post('/vouchers', requireAdmin, validate(createVoucherSchema), asyncHandler(adminController.createVoucher));
  router.patch(
    '/vouchers/:id',
    requireAdmin,
    validate(adminResourceParamSchema, 'params'),
    validate(updateVoucherSchema),
    asyncHandler(adminController.updateVoucher)
  );
  router.delete(
    '/vouchers/:id',
    requireAdmin,
    validate(adminResourceParamSchema, 'params'),
    asyncHandler(adminController.deleteVoucher)
  );

  return router;
};

module.exports = adminRoutes;
