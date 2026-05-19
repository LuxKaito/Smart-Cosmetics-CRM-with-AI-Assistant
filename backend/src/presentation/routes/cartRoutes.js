const { randomBytes } = require('crypto');
const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const AppError = require('../../shared/errors/AppError');
const env = require('../../config/env');
const { parseCookies } = require('../../shared/utils/cookies');
const {
  addCartItemSchema,
  updateCartItemSchema,
  mergeCartSchema
} = require('../../application/dtos/cartDtos');
const { optionalAuth, protectRoute } = require('../middlewares/authMiddleware');

const cartRoutes = ({ cartController, tokenService, userRepository }) => {
  const router = express.Router();
  const requireAuth = protectRoute(tokenService, userRepository);

  router.use(optionalAuth(tokenService, userRepository));
  router.use(attachCartOwner);

  router.get('/', asyncHandler(cartController.get));
  router.post('/items', validate(addCartItemSchema), asyncHandler(cartController.add));
  router.patch('/items/:productId', validate(updateCartItemSchema), asyncHandler(cartController.update));
  router.delete('/items/:productId', asyncHandler(cartController.remove));
  router.delete('/clear', asyncHandler(cartController.clear));
  router.post('/merge', requireAuth, validate(mergeCartSchema), asyncHandler(cartController.merge));

  return router;
};

const attachCartOwner = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const cartToken = cookies[env.guestCartCookieName];
  const hasValidCartToken = isValidCartToken(cartToken);

  req.guestCartToken = hasValidCartToken ? cartToken : null;

  if (req.user?._id) {
    req.cartOwner = { type: 'user', userId: req.user._id.toString() };
    return next();
  }

  if (cartToken && !hasValidCartToken) {
    return next(new AppError('Invalid cart token', 400, 'INVALID_CART_TOKEN'));
  }

  const resolvedToken = hasValidCartToken ? cartToken : generateGuestCartToken();
  req.cartOwner = { type: 'guest', cartToken: resolvedToken };

  if (!hasValidCartToken) {
    res.cookie(env.guestCartCookieName, resolvedToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: env.guestCartTtlDays * 24 * 60 * 60 * 1000,
      path: '/'
    });
  }

  return next();
};

const generateGuestCartToken = () => randomBytes(32).toString('hex');

const isValidCartToken = (value) => /^[A-Fa-f0-9]{32,128}$/.test(String(value || ''));

module.exports = cartRoutes;
