const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');
const ROLES = require('../../shared/constants/roles');
const logger = require('../../shared/utils/logger');
const { generateSecureToken, hashSha256 } = require('../../shared/utils/cryptoToken');

class AuthService {
  constructor({ userRepository, passwordService, tokenService, googleOAuthClient, eventPublisher, cartService }) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
    this.tokenService = tokenService;
    this.googleOAuthClient = googleOAuthClient;
    this.eventPublisher = eventPublisher;
    this.cartService = cartService;
  }

  async register({ email, password, name }) {
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

    const passwordHash = await this.passwordService.hash(password);
    const verification = this.generateVerificationPayload();

    const user = await this.userRepository.create({
      email: normalizedEmail,
      name,
      passwordHash,
      role: ROLES.USER,
      emailVerified: false,
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpires: verification.expiresAt,
      isBlocked: false
    });

    await this.eventPublisher.publishUserRegistered({
      userId: user._id.toString(),
      email: user.email,
      name: user.name || '',
      verifyUrl: this.buildVerificationUrl(verification.token)
    });

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
    };
  }

  async verifyEmail(token) {
    const tokenHash = hashSha256(token);
    const user = await this.userRepository.findByEmailVerificationTokenHash(tokenHash, {
      includeSecrets: true
    });
    if (!user) throw new AppError('Token xác thực không hợp lệ.', 400, 'INVALID_EMAIL_VERIFICATION_TOKEN');

    if (!user.emailVerificationExpires || user.emailVerificationExpires.getTime() < Date.now()) {
      throw new AppError('Token xác thực đã hết hạn.', 400, 'EMAIL_VERIFICATION_TOKEN_EXPIRED');
    }

    const updatedUser = await this.userRepository.updateById(user._id, {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpires: null
    });

    await this.eventPublisher.publishUserEmailVerified({
      userId: updatedUser._id.toString(),
      email: updatedUser.email,
      verifiedAt: new Date().toISOString()
    });

    return {
      verified: true,
      message: 'Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.'
    };
  }

  async resendVerificationEmail({ email }) {
    const normalizedEmail = String(email).toLowerCase().trim();
    const fallbackMessage = 'Nếu email tồn tại và chưa xác thực, chúng tôi đã gửi lại email xác thực.';
    const user = await this.userRepository.findByEmail(normalizedEmail, { includeSecrets: true });

    if (!user) return { message: fallbackMessage };
    if (user.emailVerified) {
      return { message: 'Tài khoản đã được xác thực email trước đó.' };
    }

    const verification = this.generateVerificationPayload();
    await this.userRepository.updateById(user._id, {
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpires: verification.expiresAt
    });

    await this.eventPublisher.publishEmailVerificationRequested({
      userId: user._id.toString(),
      email: user.email,
      name: user.name || '',
      verifyUrl: this.buildVerificationUrl(verification.token)
    });

    return { message: fallbackMessage };
  }

  async login({ email, password }, options = {}) {
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail, { includeSecrets: true });
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    if (user.isBlocked) throw new AppError('User account is blocked', 403, 'USER_BLOCKED');
    if (!user.emailVerified) {
      throw new AppError('Vui lòng xác thực email trước khi đăng nhập.', 403, 'EMAIL_NOT_VERIFIED');
    }

    const isValid = await this.passwordService.compare(password, user.passwordHash);
    if (!isValid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    await this.userRepository.updateById(user._id, { lastLoginAt: new Date() });
    const authPayload = await this.issueTokens(user);

    if (options.guestCartToken && this.cartService) {
      try {
        const merged = await this.cartService.mergeGuestCartIntoUser(user._id.toString(), options.guestCartToken);
        return { ...authPayload, mergedCart: merged, mergedFromGuest: true };
      } catch (error) {
        logger.warn('Guest cart merge after login failed', {
          userId: user._id.toString(),
          error: error.message
        });
      }
    }

    return authPayload;
  }

  async googleLogin({ idToken }, options = {}) {
    const profile = await this.googleOAuthClient.verifyIdToken(idToken);

    let user = await this.userRepository.findByEmail(profile.email);
    if (!user) {
      user = await this.userRepository.create({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.googleId,
        role: ROLES.USER,
        emailVerified: true,
        isBlocked: false,
        lastLoginAt: new Date()
      });

      await this.eventPublisher.publishUserRegistered({
        userId: user._id.toString(),
        email: user.email,
        name: user.name || '',
        provider: 'google',
        verifyUrl: null
      });
    } else {
      if (user.isBlocked) throw new AppError('User account is blocked', 403, 'USER_BLOCKED');
      user = await this.userRepository.updateById(user._id, {
        googleId: user.googleId || profile.googleId,
        avatar: user.avatar || profile.avatar,
        name: user.name || profile.name,
        emailVerified: true,
        lastLoginAt: new Date()
      });
    }

    const authPayload = await this.issueTokens(user);

    if (options.guestCartToken && this.cartService) {
      try {
        const merged = await this.cartService.mergeGuestCartIntoUser(user._id.toString(), options.guestCartToken);
        return { ...authPayload, mergedCart: merged, mergedFromGuest: true };
      } catch (error) {
        logger.warn('Guest cart merge after Google login failed', {
          userId: user._id.toString(),
          error: error.message
        });
      }
    }

    return authPayload;
  }

  async refresh(refreshToken) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.sub, { includeSecrets: true });
    if (!user || user.isBlocked) throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');

    const incomingHash = this.tokenService.hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    return this.issueTokens(user);
  }

  async logout(userId) {
    await this.userRepository.updateById(userId, { refreshTokenHash: null });
    return { loggedOut: true };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findById(userId, { includeSecrets: true });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (user.isBlocked) throw new AppError('User account is blocked', 403, 'USER_BLOCKED');
    if (!user.passwordHash) throw new AppError('Password login is not configured for this account', 400, 'PASSWORD_NOT_CONFIGURED');

    const isValid = await this.passwordService.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepository.updateById(user._id, {
      passwordHash,
      refreshTokenHash: null
    });

    return { passwordChanged: true, refreshTokenRevoked: true };
  }

  async issueTokens(user) {
    const accessToken = this.tokenService.signAccessToken(user);
    const refreshToken = this.tokenService.signRefreshToken(user);
    const refreshTokenHash = this.tokenService.hashToken(refreshToken);

    const updatedUser = await this.userRepository.updateById(user._id, { refreshTokenHash });

    return {
      user: updatedUser.toSafeObject ? updatedUser.toSafeObject() : updatedUser,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer'
      }
    };
  }

  generateVerificationPayload() {
    const token = generateSecureToken(32);
    const tokenHash = hashSha256(token);
    const expiresAt = new Date(Date.now() + env.emailVerificationTokenTtlMinutes * 60 * 1000);
    return { token, tokenHash, expiresAt };
  }

  buildVerificationUrl(token) {
    return `${env.frontendBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  }
}

module.exports = AuthService;
