const { success } = require('../../shared/utils/apiResponse');
const AppError = require('../../shared/errors/AppError');
const env = require('../../config/env');

class CartController {
  constructor(cartService) {
    this.cartService = cartService;
  }

  get = async (req, res) => {
    const cart = await this.cartService.getCart(req.cartOwner);
    return success(res, withOwnerPayload(req, { cart }));
  };

  add = async (req, res) => {
    const cart = await this.cartService.addItem(req.cartOwner, req.body.productId, req.body.quantity);
    return success(res, withOwnerPayload(req, { cart }), 'Cart item added', 201);
  };

  update = async (req, res) => {
    const cart = await this.cartService.updateItem(req.cartOwner, req.params.productId, req.body.quantity);
    return success(res, withOwnerPayload(req, { cart }), 'Cart item updated');
  };

  remove = async (req, res) => {
    const cart = await this.cartService.removeItem(req.cartOwner, req.params.productId);
    return success(res, withOwnerPayload(req, { cart }), 'Cart item removed');
  };

  clear = async (req, res) => {
    const cart = await this.cartService.clearCart(req.cartOwner);
    return success(res, withOwnerPayload(req, { cart }), 'Cart cleared');
  };

  merge = async (req, res) => {
    if (!req.user?._id) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const cart = await this.cartService.mergeGuestCartIntoUser(
      req.user._id.toString(),
      req.guestCartToken
    );

    if (req.guestCartToken) {
      res.clearCookie(env.guestCartCookieName, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.nodeEnv === 'production',
        path: '/'
      });
    }

    return success(res, { cart }, 'Cart merged');
  };
}

const withOwnerPayload = (req, payload) => {
  if (!req.cartOwner || req.cartOwner.type !== 'guest') return payload;
  return {
    ...payload,
    cartToken: req.cartOwner.cartToken ? 'set' : null
  };
};

module.exports = CartController;
