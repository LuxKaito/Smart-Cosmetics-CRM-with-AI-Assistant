const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const {
  publicVoucherQuerySchema,
  voucherCodeParamSchema
} = require('../../application/dtos/voucherDtos');
const { protectRoute } = require('../middlewares/authMiddleware');

const voucherRoutes = ({ voucherController, tokenService, userRepository }) => {
  const router = express.Router();
  const requireAuth = protectRoute(tokenService, userRepository);

  router.get('/', validate(publicVoucherQuerySchema, 'query'), asyncHandler(voucherController.listPublic));
  router.get('/my', requireAuth, asyncHandler(voucherController.listMine));
  router.post(
    '/:code/save',
    requireAuth,
    validate(voucherCodeParamSchema, 'params'),
    asyncHandler(voucherController.save)
  );

  return router;
};

module.exports = voucherRoutes;
