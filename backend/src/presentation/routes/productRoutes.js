const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const ROLES = require('../../shared/constants/roles');
const PERMISSIONS = require('../../shared/constants/permissions');
const {
  productQuerySchema,
  productCreateSchema,
  productUpdateSchema
} = require('../../application/dtos/productDtos');
const { protectRoute, authorize } = require('../middlewares/authMiddleware');
const { uploadProductImages } = require('../middlewares/uploadMiddleware');

const productRoutes = ({ productController, tokenService, userRepository }) => {
  const router = express.Router();
  const requireAuth = protectRoute(tokenService, userRepository);

  router.get('/categories', asyncHandler(productController.categories));
  router.get('/categories/:category/products', validate(productQuerySchema, 'query'), asyncHandler(productController.listByCategory));
  router.get('/search', validate(productQuerySchema, 'query'), asyncHandler(productController.search));
  router.get('/', validate(productQuerySchema, 'query'), asyncHandler(productController.list));
  router.get('/:id', asyncHandler(productController.detail));

  router.post(
    '/',
    requireAuth,
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.PRODUCT_CREATE] }),
    uploadProductImages,
    normalizeBodyArrays,
    validate(productCreateSchema),
    asyncHandler(productController.create)
  );
  router.patch(
    '/:id',
    requireAuth,
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.PRODUCT_UPDATE] }),
    uploadProductImages,
    normalizeBodyArrays,
    validate(productUpdateSchema),
    asyncHandler(productController.update)
  );
  router.delete(
    '/:id',
    requireAuth,
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.PRODUCT_DELETE] }),
    asyncHandler(productController.remove)
  );

  return router;
};

const normalizeBodyArrays = (req, res, next) => {
  if (typeof req.body.images === 'string') req.body.images = [req.body.images];
  if (typeof req.body.categories === 'string') {
    req.body.categories = req.body.categories
      .split(',')
      .map((category) => category.trim())
      .filter(Boolean);
  }
  next();
};

module.exports = productRoutes;
