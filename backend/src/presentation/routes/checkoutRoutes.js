const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const { addressSuggestQuerySchema, addressDetailQuerySchema } = require('../../application/dtos/addressDtos');
const { protectRoute } = require('../middlewares/authMiddleware');

const checkoutRoutes = ({ checkoutController, tokenService, userRepository }) => {
  const router = express.Router();
  const requireAuth = protectRoute(tokenService, userRepository);

  router.get('/address/suggest', requireAuth, validate(addressSuggestQuerySchema, 'query'), asyncHandler(checkoutController.suggestAddress));
  router.get('/address/detail', requireAuth, validate(addressDetailQuerySchema, 'query'), asyncHandler(checkoutController.addressDetail));
  router.get('/summary', requireAuth, asyncHandler(checkoutController.summary));

  return router;
};

module.exports = checkoutRoutes;
