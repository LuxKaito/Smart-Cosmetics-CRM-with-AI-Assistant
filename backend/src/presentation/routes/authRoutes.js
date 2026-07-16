const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  googleLoginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  createShippingAddressSchema,
  updateShippingAddressSchema,
  shippingAddressParamsSchema,
  favoriteProductParamsSchema
} = require('../../application/dtos/authDtos');
const { protectRoute } = require('../middlewares/authMiddleware');

const authRoutes = ({ authController, tokenService, userRepository }) => {
  const router = express.Router();

  router.post('/register', validate(registerSchema), asyncHandler(authController.register));
  router.get('/verify-email', validate(verifyEmailSchema, 'query'), asyncHandler(authController.verifyEmail));
  router.post(
    '/resend-verification-email',
    validate(resendVerificationEmailSchema),
    asyncHandler(authController.resendVerificationEmail)
  );
  router.post('/login', validate(loginSchema), asyncHandler(authController.login));
  router.post('/google', validate(googleLoginSchema), asyncHandler(authController.googleLogin));
  router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh));
  router.post('/logout', protectRoute(tokenService, userRepository), asyncHandler(authController.logout));
  router.post(
    '/change-password',
    protectRoute(tokenService, userRepository),
    validate(changePasswordSchema),
    asyncHandler(authController.changePassword)
  );
  router.patch(
    '/profile',
    protectRoute(tokenService, userRepository),
    validate(updateProfileSchema),
    asyncHandler(authController.updateProfile)
  );
  router.post(
    '/addresses',
    protectRoute(tokenService, userRepository),
    validate(createShippingAddressSchema),
    asyncHandler(authController.addShippingAddress)
  );
  router.patch(
    '/addresses/:addressId',
    protectRoute(tokenService, userRepository),
    validate(shippingAddressParamsSchema, 'params'),
    validate(updateShippingAddressSchema),
    asyncHandler(authController.updateShippingAddress)
  );
  router.delete(
    '/addresses/:addressId',
    protectRoute(tokenService, userRepository),
    validate(shippingAddressParamsSchema, 'params'),
    asyncHandler(authController.deleteShippingAddress)
  );
  router.get(
    '/favorites',
    protectRoute(tokenService, userRepository),
    asyncHandler(authController.listFavoriteProducts)
  );
  router.post(
    '/favorites/:productId',
    protectRoute(tokenService, userRepository),
    validate(favoriteProductParamsSchema, 'params'),
    asyncHandler(authController.saveFavoriteProduct)
  );
  router.delete(
    '/favorites/:productId',
    protectRoute(tokenService, userRepository),
    validate(favoriteProductParamsSchema, 'params'),
    asyncHandler(authController.removeFavoriteProduct)
  );
  router.get('/me', protectRoute(tokenService, userRepository), asyncHandler(authController.me));

  return router;
};

module.exports = authRoutes;
