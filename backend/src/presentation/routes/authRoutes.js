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
  changePasswordSchema
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
  router.get('/me', protectRoute(tokenService, userRepository), asyncHandler(authController.me));

  return router;
};

module.exports = authRoutes;
