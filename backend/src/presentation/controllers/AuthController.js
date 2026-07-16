const { success } = require('../../shared/utils/apiResponse');
const env = require('../../config/env');
const { parseCookies } = require('../../shared/utils/cookies');
const AppError = require('../../shared/errors/AppError');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res) => {
    const result = await this.authService.register(req.body);
    return success(
      res,
      {},
      result.message || 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      201
    );
  };

  login = async (req, res) => {
    const guestCartToken = this.getGuestCartToken(req);
    const result = await this.authService.login(req.body, { guestCartToken });
    this.setAuthCookies(res, result?.tokens);
    this.clearGuestCartCookieIfMerged(res, result);

    return success(res, sanitizeAuthPayload(result), 'Login successfully');
  };

  verifyEmail = async (req, res) => {
    const result = await this.authService.verifyEmail(req.query.token);
    return success(res, { verified: true }, result.message || 'Xác thực email thành công.');
  };

  resendVerificationEmail = async (req, res) => {
    const result = await this.authService.resendVerificationEmail(req.body);
    return success(res, {}, result.message || 'Vui lòng kiểm tra email để xác thực tài khoản.');
  };

  googleLogin = async (req, res) => {
    const guestCartToken = this.getGuestCartToken(req);
    const result = await this.authService.googleLogin(req.body, { guestCartToken });
    this.setAuthCookies(res, result?.tokens);
    this.clearGuestCartCookieIfMerged(res, result);
    return success(res, sanitizeAuthPayload(result), 'Google login successfully');
  };

  refresh = async (req, res) => {
    const refreshToken = req.body.refreshToken || this.getRefreshToken(req);
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401, 'REFRESH_TOKEN_REQUIRED');
    }

    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, result?.tokens);
    return success(res, sanitizeAuthPayload(result), 'Token refreshed');
  };

  logout = async (req, res) => {
    const result = await this.authService.logout(req.user._id);
    this.clearAuthCookies(res);
    this.clearGuestCartCookie(res);
    return success(res, result, 'Logout successfully');
  };

  changePassword = async (req, res) => {
    const result = await this.authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );
    return success(res, result, 'Password changed successfully');
  };

  updateProfile = async (req, res) => {
    const result = await this.authService.updateProfile(req.user._id, req.body);
    return success(res, result, 'Profile updated successfully');
  };

  addShippingAddress = async (req, res) => {
    const result = await this.authService.addShippingAddress(req.user._id, req.body);
    return success(res, result, 'Shipping address added successfully', 201);
  };

  updateShippingAddress = async (req, res) => {
    const result = await this.authService.updateShippingAddress(
      req.user._id,
      req.params.addressId,
      req.body
    );
    return success(res, result, 'Shipping address updated successfully');
  };

  deleteShippingAddress = async (req, res) => {
    const result = await this.authService.deleteShippingAddress(req.user._id, req.params.addressId);
    return success(res, result, 'Shipping address deleted successfully');
  };

  listFavoriteProducts = async (req, res) => {
    const result = await this.authService.listFavoriteProducts(req.user._id);
    return success(res, result, 'Đã tải danh sách sản phẩm yêu thích.');
  };

  saveFavoriteProduct = async (req, res) => {
    const result = await this.authService.saveFavoriteProduct(req.user._id, req.params.productId);
    return success(res, result, 'Đã lưu sản phẩm yêu thích.');
  };

  removeFavoriteProduct = async (req, res) => {
    const result = await this.authService.removeFavoriteProduct(req.user._id, req.params.productId);
    return success(res, result, 'Đã xóa sản phẩm khỏi danh sách yêu thích.');
  };

  me = async (req, res) => {
    const user = req.user.toSafeObject ? req.user.toSafeObject() : req.user;
    return success(res, { user });
  };

  getGuestCartToken(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    return cookies[env.guestCartCookieName];
  }

  getRefreshToken(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    return cookies[env.authRefreshCookieName];
  }

  setAuthCookies(res, tokens) {
    if (!tokens?.accessToken || !tokens?.refreshToken) return;

    const commonCookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      path: '/'
    };

    res.cookie(env.authAccessCookieName, tokens.accessToken, {
      ...commonCookieOptions,
      maxAge: parseDurationMs(env.jwtExpiresIn)
    });
    res.cookie(env.authRefreshCookieName, tokens.refreshToken, {
      ...commonCookieOptions,
      maxAge: parseDurationMs(env.jwtRefreshExpiresIn)
    });
  }

  clearAuthCookies(res) {
    const commonCookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      path: '/'
    };
    res.clearCookie(env.authAccessCookieName, commonCookieOptions);
    res.clearCookie(env.authRefreshCookieName, commonCookieOptions);
  }

  clearGuestCartCookieIfMerged(res, result) {
    if (!result?.mergedFromGuest) return;
    this.clearGuestCartCookie(res);
  }

  clearGuestCartCookie(res) {
    res.clearCookie(env.guestCartCookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      path: '/'
    });
  }
}

const sanitizeAuthPayload = (result = {}) => {
  const { tokens, ...safe } = result || {};
  return safe;
};

const parseDurationMs = (value) => {
  const normalized = String(value || '').trim();
  const matched = normalized.match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!matched) return undefined;

  const amount = Number(matched[1]);
  const unit = String(matched[2] || 'ms').toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const factor = multipliers[unit] || 1;
  return amount * factor;
};

module.exports = AuthController;
