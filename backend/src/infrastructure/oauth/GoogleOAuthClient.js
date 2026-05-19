const { OAuth2Client } = require('google-auth-library');
const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');

class GoogleOAuthClient {
  constructor() {
    this.client = new OAuth2Client(env.googleClientId);
  }

  async verifyIdToken(idToken) {
    if (!env.googleClientId) {
      throw new AppError('Google OAuth is not configured', 503, 'GOOGLE_OAUTH_NOT_CONFIGURED');
    }

    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: env.googleClientId
    });

    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new AppError('Google email is not verified', 401, 'GOOGLE_EMAIL_NOT_VERIFIED');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: payload.picture
    };
  }
}

module.exports = GoogleOAuthClient;
