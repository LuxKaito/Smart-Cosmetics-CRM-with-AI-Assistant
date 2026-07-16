const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const { optionalAuth, protectRoute } = require('../middlewares/authMiddleware');
const {
  reviewProductParamSchema,
  createReviewSchema
} = require('../../application/dtos/reviewDtos');

const reviewRoutes = ({ reviewController, tokenService, userRepository }) => {
  const router = express.Router();

  router.get(
    '/products/:productId',
    optionalAuth(tokenService, userRepository),
    validate(reviewProductParamSchema, 'params'),
    asyncHandler(reviewController.listForProduct)
  );
  router.post(
    '/products/:productId',
    protectRoute(tokenService, userRepository),
    validate(reviewProductParamSchema, 'params'),
    validate(createReviewSchema),
    asyncHandler(reviewController.create)
  );

  return router;
};

module.exports = reviewRoutes;
