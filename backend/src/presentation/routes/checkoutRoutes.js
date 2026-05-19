const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { protectRoute } = require('../middlewares/authMiddleware');

const checkoutRoutes = ({ checkoutController, tokenService, userRepository }) => {
  const router = express.Router();
  const requireAuth = protectRoute(tokenService, userRepository);

  router.get('/summary', requireAuth, asyncHandler(checkoutController.summary));

  return router;
};

module.exports = checkoutRoutes;
