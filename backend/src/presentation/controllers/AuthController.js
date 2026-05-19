const { success } = require('../../shared/utils/apiResponse');
const env = require('../../config/env');
const { parseCookies } = require('../../shared/utils/cookies');

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
    this.clearGuestCartCookieIfMerged(res, result);

    return success(res, result, 'Login successfully');
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
    this.clearGuestCartCookieIfMerged(res, result);
    return success(res, result, 'Google login successfully');
  };

  refresh = async (req, res) => {
    const result = await this.authService.refresh(req.body.refreshToken);
    return success(res, result, 'Token refreshed');
  };

  logout = async (req, res) => {
    const result = await this.authService.logout(req.user._id);
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

  me = async (req, res) => {
    const user = req.user.toSafeObject ? req.user.toSafeObject() : req.user;
    return success(res, { user });
  };

  getGuestCartToken(req) {
    const cookies = parseCookies(req.headers.cookie);
    return cookies[env.guestCartCookieName];
  }

  clearGuestCartCookieIfMerged(res, result) {
    if (!result?.mergedFromGuest) return;
    res.clearCookie(env.guestCartCookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      path: '/'
    });
  }
}

module.exports = AuthController;
